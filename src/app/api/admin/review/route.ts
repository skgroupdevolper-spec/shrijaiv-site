import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireStaff } from '@/lib/auth';
import { deliverInquiry } from '@/lib/marketplace/notify';
import { deliverQuote } from '@/lib/marketplace/quotes';
import { audit } from '@/lib/marketplace/admin-hooks';
import { sendMail } from '@/lib/mail';

export const dynamic = 'force-dynamic';

/** Review queue: inquiries and quotes waiting for the admin */
export async function GET() {
  const s = await requireStaff();
  if (!s) return fail('Unauthorized', 401);
  const [inquiries, quotes] = await Promise.all([
    prisma.inquiry.findMany({ where: { status: 'review' }, orderBy: { createdAt: 'asc' }, take: 200, include: { seller: { select: { id: true, companyName: true, slug: true } }, product: { select: { name: true, slug: true } } } }),
    prisma.quote.findMany({ where: { status: 'review' }, orderBy: { createdAt: 'asc' }, take: 200, include: { seller: { select: { id: true, companyName: true, slug: true } }, requirement: { select: { id: true, title: true, buyer: { select: { companyName: true, user: { select: { name: true } } } } } } } }),
  ]);
  return ok({ inquiries, quotes });
}

/** Forward (optionally with an edited message) or reject one item */
export async function POST(req: Request) {
  const s = await requireStaff();
  if (!s) return fail('Unauthorized', 401);
  const b = await req.json().catch(() => ({}));
  const kind = b.kind === 'quote' ? 'quote' : 'inquiry';
  const action = b.action === 'reject' ? 'reject' : 'forward';
  const id = String(b.id || '');
  const text = typeof b.message === 'string' ? b.message.trim().slice(0, 4000) : '';
  const who = { id: s.sub, name: s.name };

  if (kind === 'inquiry') {
    const inq = await prisma.inquiry.findUnique({ where: { id }, include: { seller: { select: { userId: true, companyName: true, email: true } }, product: { select: { name: true } }, messages: { orderBy: { createdAt: 'asc' }, take: 1 } } });
    if (!inq) return fail('Inquiry not found', 404);
    if (inq.status !== 'review') return fail('This inquiry was already handled');
    if (action === 'reject') {
      await prisma.inquiry.update({ where: { id }, data: { status: 'rejected', seenByAdmin: true, adminNote: b.reason ? String(b.reason).slice(0, 500) : inq.adminNote } });
      if (inq.email && b.notify) sendMail({ to: inq.email, subject: `About your inquiry ${inq.refNo}`, html: `<p>Dear ${inq.name},</p><p>We could not forward your inquiry ${inq.refNo}. ${b.reason ? String(b.reason) : 'Please contact us if you have questions.'}</p><p>— SHRIJAIV Organic</p>` }).catch(() => null);
      await audit(who, 'reject', 'inquiry', id, inq.refNo);
      return ok({ ok: true });
    }
    const message = text || inq.message;
    await prisma.inquiry.update({ where: { id }, data: { status: 'new', message, seenByAdmin: true, seenBySeller: false, lastMessageAt: new Date() } });
    if (text && inq.messages[0]) await prisma.inquiryMessage.update({ where: { id: inq.messages[0].id }, data: { body: message } });
    await deliverInquiry({ ...inq, message }, inq.seller, inq.product?.name);
    await audit(who, 'forward', 'inquiry', id, `${inq.refNo} → ${inq.seller.companyName}`);
    return ok({ ok: true });
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
