// Read helpers for the public marketplace pages and blocks.
import { prisma } from '@/lib/db';
import { cache } from 'react';
import { localizeMany, localizeOne } from '@/lib/i18n/overlay';

export const LIVE_SELLER = { status: 'approved' } as const;
export const LIVE_PRODUCT = { status: 'approved', seller: { status: 'approved' } } as const;
/** One card per catalogue product: other sellers' offers of the same product are listed on its page.
 *  (An offer whose catalogue product is no longer live shows on its own.) */
export const CATALOGUE_ONLY = { OR: [{ masterId: null }, { master: { is: { OR: [{ status: { not: 'approved' } }, { seller: { status: { not: 'approved' } } }] } } }] };

export type CategoryNode = { id: string; slug: string; name: string; icon: string | null; image: string | null; description: string | null; featured: boolean; order: number; parentId: string | null; children: CategoryNode[]; count?: number };

/** Whole category tree (active only), with live product counts */
export const getCategoryTree = cache(async (): Promise<CategoryNode[]> => {
  const rows = await localizeMany('category', await prisma.category.findMany({ where: { active: true }, orderBy: [{ order: 'asc' }, { name: 'asc' }] }));
  const live = await prisma.product.findMany({ where: { ...LIVE_PRODUCT, ...CATALOGUE_ONLY }, select: { categoryId: true } }).catch(() => [] as { categoryId: string | null }[]);
  const cmap = new Map<string | null, number>();
  for (const p of live) cmap.set(p.categoryId, (cmap.get(p.categoryId) || 0) + 1);
  const nodes = new Map<string, CategoryNode>();
  for (const r of rows) nodes.set(r.id, { id: r.id, slug: r.slug, name: r.name, icon: r.icon, image: r.image, description: r.description, featured: r.featured, order: r.order, parentId: r.parentId, children: [], count: cmap.get(r.id) || 0 });
  const roots: CategoryNode[] = [];
  for (const n of nodes.values()) {
    if (n.parentId && nodes.has(n.parentId)) nodes.get(n.parentId)!.children.push(n);
    else roots.push(n);
  }
  // parents count their children too
  const sum = (n: CategoryNode): number => (n.count = (n.count || 0) + n.children.reduce((a, c) => a + sum(c), 0));
  roots.forEach(sum);
  return roots;
});

export function flattenTree(tree: CategoryNode[]): CategoryNode[] {
  const out: CategoryNode[] = [];
  const walk = (n: CategoryNode) => {
    out.push(n);
    n.children.forEach(walk);
  };
  tree.forEach(walk);
  return out;
}

export async function getCategory(slug: string) {
  const tree = await getCategoryTree();
  const all = flattenTree(tree);
  const node = all.find((c) => c.slug === slug);
  if (!node) return null;
  const trail: CategoryNode[] = [];
  let cur: CategoryNode | undefined = node;
  while (cur) {
    trail.unshift(cur);
    cur = cur.parentId ? all.find((c) => c.id === cur!.parentId) : undefined;
  }
  const ids = flattenTree([node]).map((c) => c.id);
  return { node, trail, ids };
}

export type ProductFilters = { q?: string; categoryIds?: string[]; state?: string; verified?: boolean; minPrice?: number; maxPrice?: number; sellerId?: string; sort?: 'new' | 'price_asc' | 'price_desc' | 'rating' | 'popular'; page?: number; take?: number; featured?: boolean };

export async function listProducts(f: ProductFilters = {}) {
  const take = Math.min(60, Math.max(1, f.take || 24));
  const page = Math.max(1, f.page || 1);
  const where: any = { ...LIVE_PRODUCT, AND: [] as any[] };
  if (f.categoryIds?.length) where.categoryId = { in: f.categoryIds };
  if (f.sellerId) where.sellerId = f.sellerId;
  else where.AND.push(CATALOGUE_ONLY);
  if (f.featured) where.featured = true;
  if (f.verified) where.seller = { ...where.seller, verified: true };
  if (f.state) where.seller = { ...where.seller, state: f.state };
  if (f.minPrice != null) where.priceMin = { gte: f.minPrice };
  if (f.maxPrice != null) where.priceMax = { lte: f.maxPrice };
  if (f.q) {
    const q = f.q.trim();
    where.AND.push({ OR: [{ name: { contains: q } }, { summary: { contains: q } }, { tags: { contains: q } }, { brand: { contains: q } }, { seller: { companyName: { contains: q } } }, { offers: { some: { ...LIVE_PRODUCT, seller: { status: 'approved', companyName: { contains: q } } } } }] });
  }
  if (!where.AND.length) delete where.AND;
  const orderBy: any[] =
    f.sort === 'price_asc' ? [{ priceMin: 'asc' }] : f.sort === 'price_desc' ? [{ priceMax: 'desc' }] : f.sort === 'rating' ? [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }] : f.sort === 'popular' ? [{ views: 'desc' }] : [{ featured: 'desc' }, { createdAt: 'desc' }];
  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, take, skip: (page - 1) * take, include: { seller: { select: { slug: true, companyName: true, verified: true, city: true, state: true, logo: true } }, category: { select: { slug: true, name: true } }, offers: { where: LIVE_PRODUCT, select: { priceMin: true } } } }),
    prisma.product.count({ where }),
  ]);
  return { items: await localizeMany('product', items), total, page, pages: Math.max(1, Math.ceil(total / take)), take };
}

/** Every live seller offer of one catalogue product (the catalogue product itself first) */
export async function productSellers(p: { id: string; masterId: string | null }) {
  const root = p.masterId || p.id;
  const rows = await prisma.product.findMany({
    where: { ...LIVE_PRODUCT, OR: [{ id: root }, { masterId: root }] },
    orderBy: { createdAt: 'asc' },
    select: { id: true, slug: true, priceMin: true, priceMax: true, priceUnit: true, currency: true, moq: true, stock: true, availableQty: true, leadTime: true, masterId: true, seller: { select: { id: true, slug: true, companyName: true, verified: true, city: true, state: true, ratingAvg: true, ratingCount: true, logo: true } } },
  });
  // cheapest first, "price on request" last
  return rows.sort((a, b) => (a.priceMin ?? Infinity) - (b.priceMin ?? Infinity));
}

export type BuyerFilters = { q?: string; state?: string; type?: string; verified?: boolean; page?: number; take?: number };

/** Public list of buyers — company, type and place only (contact details stay private) */
export async function listBuyers(f: BuyerFilters = {}) {
  const take = Math.min(60, Math.max(1, f.take || 24));
  const page = Math.max(1, f.page || 1);
  const where: any = { status: 'approved', user: { active: true } };
  if (f.state) where.state = f.state;
  if (f.type) where.buyerType = f.type;
  if (f.verified) where.verified = true;
  if (f.q) where.OR = [{ companyName: { contains: f.q } }, { city: { contains: f.q } }, { requirements: { some: { title: { contains: f.q }, status: 'open' } } }];
  const [items, total] = await Promise.all([
    prisma.buyerProfile.findMany({
      where,
      orderBy: [{ verified: 'desc' }, { createdAt: 'desc' }],
      take,
      skip: (page - 1) * take,
      select: { id: true, companyName: true, buyerType: true, city: true, state: true, verified: true, createdAt: true, interests: true, requirements: { where: { status: 'open' }, orderBy: { createdAt: 'desc' }, take: 3, select: { id: true, title: true, quantity: true, unit: true } }, _count: { select: { requirements: true } } },
    }),
    prisma.buyerProfile.count({ where }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / take)), take };
}

export async function getProduct(slug: string) {
  const p = await prisma.product.findFirst({
    where: { slug, ...LIVE_PRODUCT },
    include: { seller: true, category: { select: { id: true, slug: true, name: true, parentId: true } }, reviews: { where: { status: 'approved' }, orderBy: { createdAt: 'desc' }, take: 10 } },
  });
  if (!p) return null;
  const lp = await localizeOne('product', p);
  if (!lp) return null;
  lp.seller = (await localizeOne('seller', lp.seller))!;
  if (lp.category) lp.category = (await localizeOne('category', lp.category))!;
  return lp;
}

export type SellerFilters = { q?: string; state?: string; verified?: boolean; businessType?: string; categoryIds?: string[]; page?: number; take?: number; featured?: boolean };

export async function listSellers(f: SellerFilters = {}) {
  const take = Math.min(60, Math.max(1, f.take || 24));
  const page = Math.max(1, f.page || 1);
  const where: any = { ...LIVE_SELLER };
  if (f.verified) where.verified = true;
  if (f.featured) where.featured = true;
  if (f.state) where.state = f.state;
  if (f.businessType) where.businessType = f.businessType;
  if (f.categoryIds?.length) where.products = { some: { categoryId: { in: f.categoryIds }, status: 'approved' } };
  if (f.q) where.OR = [{ companyName: { contains: f.q } }, { about: { contains: f.q } }, { city: { contains: f.q } }, { products: { some: { name: { contains: f.q }, status: 'approved' } } }];
  const [items, total] = await Promise.all([
    prisma.sellerProfile.findMany({ where, orderBy: [{ featured: 'desc' }, { verified: 'desc' }, { ratingAvg: 'desc' }, { createdAt: 'desc' }], take, skip: (page - 1) * take, include: { _count: { select: { products: { where: { status: 'approved' } } } }, products: { where: { status: 'approved' }, take: 3, select: { slug: true, name: true, images: true } } } }),
    prisma.sellerProfile.count({ where }),
  ]);
  return { items: await localizeMany('seller', items), total, page, pages: Math.max(1, Math.ceil(total / take)), take };
}

export async function getSeller(slug: string) {
  const s = await prisma.sellerProfile.findFirst({
    where: { slug, ...LIVE_SELLER },
    include: { products: { where: { status: 'approved' }, orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }], include: { category: { select: { slug: true, name: true } } } }, reviews: { where: { status: 'approved' }, orderBy: { createdAt: 'desc' }, take: 20 } },
  });
  if (!s) return null;
  const ls = await localizeOne('seller', s);
  if (!ls) return null;
  ls.products = await localizeMany('product', ls.products);
  return ls;
}

export async function listRequirements(f: { q?: string; categoryIds?: string[]; state?: string; featured?: boolean; page?: number; take?: number } = {}) {
  const take = Math.min(60, Math.max(1, f.take || 20));
  const page = Math.max(1, f.page || 1);
  const where: any = { status: 'open' };
  if (f.categoryIds?.length) where.categoryId = { in: f.categoryIds };
  if (f.state) where.deliveryState = f.state;
  if (f.featured) where.featured = true;
  if (f.q) where.OR = [{ title: { contains: f.q } }, { details: { contains: f.q } }];
  const [items, total] = await Promise.all([
    prisma.requirement.findMany({ where, orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }], take, skip: (page - 1) * take, include: { category: { select: { slug: true, name: true } }, buyer: { select: { buyerType: true, city: true, state: true, verified: true, companyName: true } } } }),
    prisma.requirement.count({ where }),
  ]);
  return { items: await localizeMany('requirement', items), total, page, pages: Math.max(1, Math.ceil(total / take)), take };
}

export async function getRequirement(id: string) {
  return localizeOne('requirement', await prisma.requirement.findFirst({ where: { id, status: { in: ['open', 'closed', 'expired'] } }, include: { category: { select: { slug: true, name: true } }, buyer: { select: { buyerType: true, city: true, state: true, verified: true, companyName: true, createdAt: true } }, _count: { select: { quotes: true } } } }));
}

export async function getPlans(audience = 'seller') {
  return prisma.plan.findMany({ where: { active: true, audience }, orderBy: [{ order: 'asc' }, { price: 'asc' }] });
}

export async function marketStats() {
  const [sellers, buyers, products, requirements] = await Promise.all([
    prisma.sellerProfile.count({ where: LIVE_SELLER }),
    prisma.buyerProfile.count(),
    prisma.product.count({ where: LIVE_PRODUCT }),
    prisma.requirement.count({ where: { status: 'open' } }),
  ]);
  return { sellers, buyers, products, requirements };
}

export { INDIAN_STATES, images, inr, priceLabel } from './format';
