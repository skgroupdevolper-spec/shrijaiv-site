import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireSeller } from '@/lib/auth';
import { canAddProduct } from '@/lib/marketplace/plans';
import { getMarketplace } from '@/lib/marketplace/settings';
import { normalizeProduct } from '@/lib/marketplace/products';
import { notifyAdmins } from '@/lib/marketplace/notify';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const ctx = await requireSeller();
  if (!ctx) return fail('Unauthorized', 401);
  const u = new URL(req.url);
  const q = u.searchParams.get('q') || '';
  const status = u.searchParams.get('status') || '';
  const where: any = { sellerId: ctx.seller.id };
  if (q) where.name = { contains: q };
  if (status) where.status = status;
  const items = await prisma.product.findMany({ where, orderBy: { updatedAt: 'desc' }, include: { category: { select: { name: true, slug: true } } }, take: 500 });
  const counts = await prisma.product.groupBy({ by: ['status'], where: { sellerId: ctx.seller.id }, _count: { _all: true } });
  return ok({ items, counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])) });
}

export async function POST(req: Request) {
  const ctx = await requireSeller();
  if (!ctx) return fail('Unauthorized', 401);
  if (['suspended', 'rejected'].includes(ctx.seller.status)) return fail('Your seller account is not active');
  const gate = await canAddProduct(ctx.seller.id);
  if (!gate.ok) return fail(gate.reason || 'Limit reached', 403);
  const b = await req.json().catch(() => ({}));
  let data;
  try {
    data = await normalizeProduct(b, { maxImages: gate.e.maxImages });
  } catch (e) {
    return fail((e as Error).message);
  }
  const mp = await getMarketplace();
  const draft = b.status === 'draft';
  const status = draft ? 'draft' : mp.approval.products ? 'pending' : 'approved';
  const p = await prisma.product.create({ data: { ...data, sellerId: ctx.seller.id, status } });
  if (status === 'pending') await notifyAdmins({ type: 'product', title: `Product to approve: ${p.name}`, body: ctx.seller.companyName, href: `/admin/products/${p.id}` });
  return ok({ item: p });
}
