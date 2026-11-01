import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireSeller } from '@/lib/auth';
import { canAddProduct } from '@/lib/marketplace/plans';
import { getMarketplace, uniqueSlug } from '@/lib/marketplace/settings';
import { normalizeProduct } from '@/lib/marketplace/products';
import { notifyAdmins } from '@/lib/marketplace/notify';
import { translateLater } from '@/lib/i18n/overlay';

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
  const items = await prisma.product.findMany({ where, orderBy: { updatedAt: 'desc' }, include: { category: { select: { name: true, slug: true } }, master: { select: { name: true, slug: true } } }, take: 500 });
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
  if (b.masterId) b.name = 'catalogue product'; // the catalogue name is used (below)
  let data;
  try {
    data = await normalizeProduct(b, { maxImages: gate.e.maxImages });
  } catch (e) {
    return fail((e as Error).message);
  }
  const mp = await getMarketplace();
  const draft = b.status === 'draft';
  // a product that is already in the catalogue: the seller adds an own offer (price, quantity, details)
  let master: { id: string; name: string; categoryId: string | null; images: string } | null = null;
  if (b.masterId) {
    master = await prisma.product.findFirst({ where: { id: String(b.masterId), masterId: null, status: 'approved' }, select: { id: true, name: true, categoryId: true, images: true, sellerId: true } });
    if (!master) return fail('This catalogue product is not available');
    if ((master as any).sellerId === ctx.seller.id) return fail('This is already your product — edit it instead');
    const mine = await prisma.product.findFirst({ where: { sellerId: ctx.seller.id, masterId: master.id }, select: { id: true } });
    if (mine) return fail('You already sell this product — open it from My products to change price or quantity');
    data.name = master.name;
    data.categoryId = master.categoryId;
    if (data.images === '[]') data.images = master.images;
    data.slug = await uniqueSlug(master.name, async (s) => !!(await prisma.product.findUnique({ where: { slug: s }, select: { id: true } })));
  }
  const needsApproval = master ? mp.approval.offers : mp.approval.products;
  const status = draft ? 'draft' : needsApproval ? 'pending' : 'approved';
  const p = await prisma.product.create({ data: { ...data, sellerId: ctx.seller.id, status, masterId: master?.id || null } });
  translateLater('product', p.id);
  if (status === 'pending') await notifyAdmins({ type: 'product', title: `${master ? 'Seller offer' : 'Product'} to approve: ${p.name}`, body: ctx.seller.companyName, href: `/admin/products/${p.id}` });
  return ok({ item: p });
}
