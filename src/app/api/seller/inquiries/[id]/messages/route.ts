import { prisma } from '@/lib/db';
import { ok, fail, rateLimit, clientIp } from '@/lib/api';
import { requireSeller } from '@/lib/auth';
import { sendMail } from '@/lib/mail';
import { emailHtml, notifyUser } from '@/lib/marketplace/notify';

type P = { params: Promise<{ id: string }> };

/** Seller replies in the inquiry thread → buyer dashboard + email */
export async function POST(req: Request, { params }: P) {
  const ctx = await requireSeller();
  if (!ctx) return fail('Unauthorized', 401);
  if (!rateLimit('smsg:' + clientIp(req), 60, 10 * 60_000)) return fail('Too many messages', 429);
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const body = String(b.body || '').trim().slice(0, 4000);
  if (!body) return fail('Please write a message');
  const inq = await prisma.inquiry.findFirst({ where: { id, sellerId: ctx.seller.id }, include: { buyer: { select: { userId: true } }, product: { select: { name: true } } } });
  if (!inq) return fail('Not found', 404);
  const attachments = Array.isArray(b.attachments) ? b.attachments.filter((x: any) => typeof x === 'string').slice(0, 5) : [];
  const msg = await prisma.inquiryMessage.create({ data: { inquiryId: id, senderId: ctx.session.sub, senderRole: 'seller', body, attachments: JSON.stringify(attachments) } });
  await prisma.inquiry.update({ where: { id }, data: { status: inq.status === 'new' ? 'replied' : inq.status, lastMessageAt: new Date(), seenByBuyer: false } });
  await notifyUser(inq.buyer?.userId, { type: 'message', title: `${ctx.seller.companyName} replied${inq.product ? ` · ${inq.product.name}` : ''}`, body: body.slice(0, 140), href: `/buyer/inquiries/${id}` });
  if (inq.email) sendMail({ to: inq.email, subject: `Reply from ${ctx.seller.companyName} — ${inq.refNo}`, html: await emailHtml(`${ctx.seller.companyName} replied to your inquiry`, body, [['Reference', inq.refNo], ['Product', inq.product?.name]], inq.buyerId ? { label: 'Open conversation', href: `/buyer/inquiries/${id}` } : undefined), replyTo: ctx.seller.email || ctx.session.email }).catch(() => null);
  return ok({ item: msg });
}
