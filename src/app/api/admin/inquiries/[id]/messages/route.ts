import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireStaff } from '@/lib/auth';
import { notifyUser } from '@/lib/marketplace/notify';

type P = { params: Promise<{ id: string }> };

/** Admin writes into an inquiry thread (both sides see it) */
export async function POST(req: Request, { params }: P) {
  const s = await requireStaff();
  if (!s) return fail('Unauthorized', 401);
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const body = String(b.body || '').trim().slice(0, 4000);
  if (!body) return fail('Please write a message');
  const inq = await prisma.inquiry.findUnique({ where: { id }, include: { seller: { select: { userId: true } }, buyer: { select: { userId: true } } } });
  if (!inq) return fail('Not found', 404);
  const msg = await prisma.inquiryMessage.create({ data: { inquiryId: id, senderId: s.sub, senderRole: 'admin', body, attachments: JSON.stringify(Array.isArray(b.attachments) ? b.attachments.slice(0, 5) : []) } });
  await prisma.inquiry.update({ where: { id }, data: { lastMessageAt: new Date(), seenBySeller: false, seenByBuyer: false, seenByAdmin: true } });
  await notifyUser(inq.seller.userId, { type: 'message', title: 'SHRIJAIV team wrote in an inquiry', body: body.slice(0, 140), href: `/seller/inquiries/${id}` });
  await notifyUser(inq.buyer?.userId, { type: 'message', title: 'SHRIJAIV team wrote in your inquiry', body: body.slice(0, 140), href: `/buyer/inquiries/${id}` });
  return ok({ item: msg });
}
