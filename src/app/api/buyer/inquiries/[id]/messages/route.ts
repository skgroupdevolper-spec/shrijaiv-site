import { prisma } from '@/lib/db';
import { ok, fail, rateLimit, clientIp } from '@/lib/api';
import { requireBuyer } from '@/lib/auth';
import { sendMail } from '@/lib/mail';
import { emailHtml, notifyUser } from '@/lib/marketplace/notify';

type P = { params: Promise<{ id: string }> };

/** Buyer writes in the inquiry thread → seller dashboard + email */
export async function POST(req: Request, { params }: P) {
  const ctx = await requireBuyer();
  if (!ctx) return fail('Unauthorized', 401);
  if (!rateLimit('bmsg:' + clientIp(req), 60, 10 * 60_000)) return fail('Too many messages', 429);
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const body = String(b.body || '').trim().slice(0, 4000);
  if (!body) return fail('Please write a message');
  const inq = await prisma.inquiry.findFirst({ where: { id, buyerId: ctx.buyer.id }, include: { seller: { select: { userId: true, companyName: true, email: true, user: { select: { email: true } } } }, product: { select: { name: true } } } });
  if (!inq) return fail('Not found', 404);
  const attachments = Array.isArray(b.attachments) ? b.attachments.filter((x: any) => typeof x === 'string').slice(0, 5) : [];
  const msg = await prisma.inquiryMessage.create({ data: { inquiryId: id, senderId: ctx.session.sub, senderRole: 'buyer', body, attachments: JSON.stringify(attachments) } });
  await prisma.inquiry.update({ where: { id }, data: { lastMessageAt: new Date(), seenBySeller: false, seenByBuyer: true } });
  await notifyUser(inq.seller.userId, { type: 'message', title: `${ctx.session.name} replied${inq.product ? ` · ${inq.product.name}` : ''}`, body: body.slice(0, 140), href: `/seller/inquiries/${id}` });
  const to = inq.seller.email || inq.seller.user.email;
  if (to) sendMail({ to, subject: `New message on inquiry ${inq.refNo}`, html: await emailHtml(`${ctx.session.name} sent a message`, body, [['Reference', inq.refNo], ['Product', inq.product?.name]], { label: 'Reply', href: `/seller/inquiries/${id}` }) }).catch(() => null);
  return ok({ item: msg });
}
