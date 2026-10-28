import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { LIVE_PRODUCT, LIVE_SELLER } from '@/lib/marketplace/data';
import { localizeMany } from '@/lib/i18n/overlay';

/** Visitors' saved items (ids kept in their browser): returns the live products / sellers for /saved */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const pids = Array.isArray(b.products) ? b.products.map(String).slice(0, 100) : [];
  const sids = Array.isArray(b.sellers) ? b.sellers.map(String).slice(0, 100) : [];
  if (!pids.length && !sids.length) return ok({ products: [], sellers: [] });
  try {
    const [products, sellers] = await Promise.all([
      pids.length ? prisma.product.findMany({ where: { id: { in: pids }, ...LIVE_PRODUCT }, include: { seller: { select: { slug: true, companyName: true, verified: true, city: true, state: true, logo: true } }, category: { select: { slug: true, name: true } } } }) : [],
      sids.length ? prisma.sellerProfile.findMany({ where: { id: { in: sids }, ...LIVE_SELLER }, include: { _count: { select: { products: { where: { status: 'approved' } } } }, products: { where: { status: 'approved' }, take: 3, select: { slug: true, name: true, images: true } } } }) : [],
    ]);
    return ok({ products: await localizeMany('product', products), sellers: await localizeMany('seller', sellers) });
  } catch {
    return fail('Could not load saved items', 500);
  }
}
