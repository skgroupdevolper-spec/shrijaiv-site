import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireStaff } from '@/lib/auth';
import { deliverQuote } from '@/lib/marketplace/quotes';
import { audit } from '@/lib/marketplace/admin-hooks';
import { sendMail } from '@/lib/mail';
import { deliverMessage } from '@/lib/marketplace/chat';
import { forwardInquiry, suggestSellers } from '@/lib/marketplace/forward';

export const dynamic = 'force-dynamic';

/** Forward inquiry queue: inquiries, quotes and chat messages waiting for the admin. ?find=… searches sellers. */
export async function GET(req: Request) {
  const s = await requireStaff();
  if (!s) return fail('Unauthorized', 401);
  const find = new URL(req.url).searchParams.get('find');
  if (find !== null) {
    const q = find.trim();
    const sellers = await prisma.sellerProfile.findMany({ where: { status: 'approved', ...(q ? { OR: [{ companyName: { contains: q } }, { city: { contains: q } }, { state: { contains: q } }, { products: { some: { name: { contains: q } } } }] } : {}) }, orderBy: [{ verified: 'desc' }, { companyName: 'asc' }], take: 20, select: { id: true, companyName: true, city: true, state: true, verified: true } });
    return ok({ sellers });
  }
  const [inquiries, quotes, messages] = await Promise.all([
    prisma.inquiry.findMany({ where: { status: 'review' }, orderBy: { createdAt: 'asc' }, take: 200, include: { seller: { select: { id: true, companyName: true, slug: true } }, product: { select: { name: true, slug: true } } } }),
    prisma.quote.findMany({ where: { status: 'review' }, orderBy: { createdAt: 'asc' }, take: 200, include: { seller: { select: { id: true, companyName: true, slug: true } }, requirement: { select: { id: true, title: true, buyer: { select: { companyName: true, user: { select: { name: true } } } } } } } }),
    prisma.inquiryMessage.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'asc' }, take: 300, include: { inquiry: { select: { id: true, refNo: true, name: true, seller: { select: { id: true, companyName: true } }, product: { select: { name: true } } } } } }),
  ]);
  const withSuggest = await Promise.all(inquiries.map(async (q) => ({ ...q, suggest: await suggestSellers(q) })));
  return ok({ inquiries: withSuggest, quotes, messages });
}

/** Forward (optionally with an edited message) or reject one item */
export async function POST(req: Request) {
  const s = await requireStaff();
  if (!s) return fail('Unauthorized', 401);
  const b = await req.json().catch(() => ({}));
  const kind = b.kind === 'quote' ? 'quote' : b.kind === 'message' ? 'message' : 'inquiry';
  const action = b.action === 'reject' ? 'reject' : b.action === 'forward-more' ? 'forward-more' : 'forward';
  const sellerIds: string[] = Array.isArray(b.sellerIds) ? b.sellerIds.map(String).slice(0, 50) : [];
  const id = String(b.id || '');
  const text = typeof b.message === 'string' ? b.message.trim().slice(0, 4000) : '';
  const who = { id: s.sub, name: s.name };

  if (kind === 'message') {
    const m = await prisma.inquiryMessage.findUnique({ where: { id }, include: { inquiry: { select: { refNo: true } } } });
    if (!m) return fail('Message not found', 404);
    if (m.status !== 'pending') return fail('This message was already handled');
    if (action === 'reject') {
      await prisma.inquiryMessage.update({ where: { id }, data: { status: 'rejected' } });
      await audit(who, 'reject', 'message', id, m.inquiry.refNo);
      return ok({ ok: true });
    }
    await prisma.inquiryMessage.update({ where: { id }, data: { status: 'approved', ...(text ? { body: text } : {}) } });
    await deliverMessage(id);
    await audit(who, 'approve', 'message', id, m.inquiry.refNo);
    return ok({ ok: true });
  }

  if (kind === 'inquiry') {
    const inq = await prisma.inquiry.findUnique({ where: { id }, include: { seller: { select: { userId: true, companyName: true, email: true } }, product: { select: { name: true } }, messages: { orderBy: { createdAt: 'asc' }, take: 1 } } });
    if (!inq) return fail('Inquiry not found', 404);
    if (action === 'forward-more') {
      if (!sellerIds.length) return fail('Choose at least one seller');
      try {
        const delivered = await forwardInquiry(id, sellerIds);
        await audit(who, 'forward', 'inquiry', id, delivered.join(', '));
        return ok({ ok: true, delivered });
      } catch (e) {
        return fail((e as Error).message);
      }
    }
    if (inq.status !== 'review') return fail('This inquiry was already handled');
    if (action === 'reject') {
      await prisma.inquiry.update({ where: { id }, data: { status: 'rejected', seenByAdmin: true, adminNote: b.reason ? String(b.reason).slice(0, 500) : inq.adminNote } });
      if (inq.email && b.notify) sendMail({ to: inq.email, subject: `About your inquiry ${inq.refNo}`, html: `<p>Dear ${inq.name},</p><p>We could not forward your inquiry ${inq.refNo}. ${b.reason ? String(b.reason) : 'Please contact us if you have questions.'}</p><p>— SHRIJAIV Organic</p>` }).catch(() => null);
      await audit(who, 'reject', 'inquiry', id, inq.refNo);
      return ok({ ok: true });
    }
    try {
      const delivered = await forwardInquiry(id, sellerIds, text || undefined);
      await audit(who, 'forward', 'inquiry', id, delivered.join(', '));
      return ok({ ok: true, delivered });
    } catch (e) {
      return fail((e as Error).message);
    }
  }

  const q = await prisma.quote.findUnique({ where: { id }, include: { seller: { select: { companyName: true } } } });
  if (!q) return fail('Quote not found', 404);
  if (q.status !== 'review') return fail('This quote was already handled');
  if (action === 'reject') {
    await prisma.quote.update({ where: { id }, data: { status: 'rejected' } });
    await audit(who, 'reject', 'quote', id, q.seller.companyName);
    return ok({ ok: true });
  }
  await prisma.quote.update({ where: { id }, data: { status: 'sent', seenByBuyer: false, ...(text ? { message: text } : {}) } });
  await prisma.requirement.update({ where: { id: q.requirementId }, data: { quoteCount: { increment: 1 } } });
  await deliverQuote(id);
  await audit(who, 'forward', 'quote', id, q.seller.companyName);
  return ok({ ok: true });
}
