import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireSeller } from '@/lib/auth';
import { SELLER_VISIBLE } from '@/lib/marketplace/moderation';

type P = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: P) {
  const ctx = await requireSeller();
  if (!ctx) return fail('Unauthorized', 401);
  const { id } = await params;
  const item = await prisma.inquiry.findFirst({ where: { id, sellerId: ctx.seller.id, ...SELLER_VISIBLE }, include: { product: { select: { name: true, slug: true, images: true } }, messages: { orderBy: { createdAt: 'asc' } }, buyer: { select: { companyName: true, buyerType: true, city: true, state: true, verified: true } } } });
  if (!item) return fail('Not found', 404);
  if (!item.seenBySeller) await prisma.inquiry.update({ where: { id }, data: { seenBySeller: true } });
  await prisma.inquiryMessage.updateMany({ where: { inquiryId: id, senderRole: { in: ['buyer', 'admin'] }, read: false }, data: { read: true } });
  const safe = item.contactUnlocked ? item : { ...item, email: null, phone: null };
  return ok({ item: safe });
}

/** Update status (replied | quoted | closed | spam) */
export async function PUT(req: Request, { params }: P) {
  const ctx = await requireSeller();
  if (!ctx) return fail('Unauthorized', 401);
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const status = ['new', 'replied', 'quoted', 'closed', 'spam'].includes(b.status) ? b.status : null;
  if (!status) return fail('Invalid status');
  const r = await prisma.inquiry.updateMany({ where: { id, sellerId: ctx.seller.id, ...SELLER_VISIBLE }, data: { status } });
  if (!r.count) return fail('Not found', 404);
  return ok({ ok: true });
}
