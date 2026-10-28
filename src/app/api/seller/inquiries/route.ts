import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireSeller } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const ctx = await requireSeller();
  if (!ctx) return fail('Unauthorized', 401);
  const u = new URL(req.url);
  const status = u.searchParams.get('status') || '';
  const q = u.searchParams.get('q') || '';
  const where: any = { sellerId: ctx.seller.id };
  if (status) where.status = status;
  if (q) where.OR = [{ name: { contains: q } }, { message: { contains: q } }, { refNo: { contains: q } }, { product: { name: { contains: q } } }];
  const items = await prisma.inquiry.findMany({ where, orderBy: { lastMessageAt: 'desc' }, take: 300, include: { product: { select: { name: true, slug: true } }, _count: { select: { messages: true } } } });
  const counts = await prisma.inquiry.groupBy({ by: ['status'], where: { sellerId: ctx.seller.id }, _count: { _all: true } });
  return ok({ items: items.map((i) => (i.contactUnlocked ? i : { ...i, email: null, phone: null })), counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])) });
}
