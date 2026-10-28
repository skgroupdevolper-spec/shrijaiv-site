import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireSeller } from '@/lib/auth';
import { entitlements } from '@/lib/marketplace/plans';
import { getMarketplace } from '@/lib/marketplace/settings';
import { normalizeProduct } from '@/lib/marketplace/products';
import { notifyAdmins } from '@/lib/marketplace/notify';
import { translateLater } from '@/lib/i18n/overlay';

type P = { params: Promise<{ id: string }> };

async function own(id: string) {
  const ctx = await requireSeller();
  if (!ctx) return null;
  const item = await prisma.product.findFirst({ where: { id, sellerId: ctx.seller.id } });
  return item ? { ctx, item } : null;
}

export async function GET(_: Request, { params }: P) {
  const { id } = await params;
  const r = await own(id);
  if (!r) return fail('Not found', 404);
  return ok({ item: r.item });
}

export async function PUT(req: Request, { params }: P) {
  const { id } = await params;
  const r = await own(id);
  if (!r) return fail('Not found', 404);
  const b = await req.json().catch(() => ({}));
  const e = await entitlements(r.ctx.seller.id);
  let data;
  try {
    data = await normalizeProduct(b, { maxImages: e.maxImages, existingSlug: r.item.slug });
  } catch (err) {
    return fail((err as Error).message);
  }
  const mp = await getMarketplace();
  // status handling: a seller can set draft / hidden / (re)submit; approval resets when content changes and approval is on
  let status = r.item.status;
  if (b.status === 'draft' || b.status === 'hidden') status = b.status;
  else if (['draft', 'hidden', 'rejected'].includes(r.item.status) || mp.approval.products === false) status = mp.approval.products ? 'pending' : 'approved';
  else if (mp.approval.products && r.item.status === 'approved' && (data.name !== r.item.name || data.description !== r.item.description || data.images !== r.item.images)) status = 'pending';
  const item = await prisma.product.update({ where: { id }, data: { ...data, status, seen: status === 'pending' ? false : r.item.seen } });
  translateLater('product', item.id);
  if (status === 'pending' && r.item.status !== 'pending') await notifyAdmins({ type: 'product', title: `Product to approve: ${item.name}`, body: r.ctx.seller.companyName, href: `/admin/products/${item.id}` });
  return ok({ item });
}

export async function DELETE(_: Request, { params }: P) {
  const { id } = await params;
  const r = await own(id);
  if (!r) return fail('Not found', 404);
  await prisma.product.delete({ where: { id } });
  return ok({ ok: true });
}
