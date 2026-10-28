// Read helpers for the public marketplace pages and blocks.
import { prisma } from '@/lib/db';
import { cache } from 'react';

export const LIVE_SELLER = { status: 'approved' } as const;
export const LIVE_PRODUCT = { status: 'approved', seller: { status: 'approved' } } as const;

export type CategoryNode = { id: string; slug: string; name: string; icon: string | null; image: string | null; description: string | null; featured: boolean; order: number; parentId: string | null; children: CategoryNode[]; count?: number };

/** Whole category tree (active only), with live product counts */
export const getCategoryTree = cache(async (): Promise<CategoryNode[]> => {
  const rows = await prisma.category.findMany({ where: { active: true }, orderBy: [{ order: 'asc' }, { name: 'asc' }] });
  const counts = await prisma.product.groupBy({ by: ['categoryId'], where: LIVE_PRODUCT, _count: { _all: true } }).catch(() => []);
  const cmap = new Map(counts.map((c) => [c.categoryId, c._count._all]));
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
  const where: any = { ...LIVE_PRODUCT };
  if (f.categoryIds?.length) where.categoryId = { in: f.categoryIds };
  if (f.sellerId) where.sellerId = f.sellerId;
  if (f.featured) where.featured = true;
  if (f.verified) where.seller = { ...where.seller, verified: true };
  if (f.state) where.seller = { ...where.seller, state: f.state };
  if (f.minPrice != null) where.priceMin = { gte: f.minPrice };
  if (f.maxPrice != null) where.priceMax = { lte: f.maxPrice };
  if (f.q) {
    const q = f.q.trim();
    where.OR = [{ name: { contains: q } }, { summary: { contains: q } }, { tags: { contains: q } }, { brand: { contains: q } }, { seller: { companyName: { contains: q } } }];
  }
  const orderBy: any[] =
    f.sort === 'price_asc' ? [{ priceMin: 'asc' }] : f.sort === 'price_desc' ? [{ priceMax: 'desc' }] : f.sort === 'rating' ? [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }] : f.sort === 'popular' ? [{ views: 'desc' }] : [{ featured: 'desc' }, { createdAt: 'desc' }];
  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, take, skip: (page - 1) * take, include: { seller: { select: { slug: true, companyName: true, verified: true, city: true, state: true, logo: true } }, category: { select: { slug: true, name: true } } } }),
    prisma.product.count({ where }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / take)), take };
}

export async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, ...LIVE_PRODUCT },
    include: { seller: true, category: { select: { id: true, slug: true, name: true, parentId: true } }, reviews: { where: { status: 'approved' }, orderBy: { createdAt: 'desc' }, take: 10 } },
  });
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
  return { items, total, page, pages: Math.max(1, Math.ceil(total / take)), take };
}

export async function getSeller(slug: string) {
  return prisma.sellerProfile.findFirst({
    where: { slug, ...LIVE_SELLER },
    include: { products: { where: { status: 'approved' }, orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }], include: { category: { select: { slug: true, name: true } } } }, reviews: { where: { status: 'approved' }, orderBy: { createdAt: 'desc' }, take: 20 } },
  });
}

export async function listRequirements(f: { q?: string; categoryIds?: string[]; state?: string; page?: number; take?: number } = {}) {
  const take = Math.min(60, Math.max(1, f.take || 20));
  const page = Math.max(1, f.page || 1);
  const where: any = { status: 'open' };
  if (f.categoryIds?.length) where.categoryId = { in: f.categoryIds };
  if (f.state) where.deliveryState = f.state;
  if (f.q) where.OR = [{ title: { contains: f.q } }, { details: { contains: f.q } }];
  const [items, total] = await Promise.all([
    prisma.requirement.findMany({ where, orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }], take, skip: (page - 1) * take, include: { category: { select: { slug: true, name: true } }, buyer: { select: { buyerType: true, city: true, state: true, verified: true, companyName: true } } } }),
    prisma.requirement.count({ where }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / take)), take };
}

export async function getRequirement(id: string) {
  return prisma.requirement.findFirst({ where: { id, status: { in: ['open', 'closed', 'expired'] } }, include: { category: { select: { slug: true, name: true } }, buyer: { select: { buyerType: true, city: true, state: true, verified: true, companyName: true, createdAt: true } }, _count: { select: { quotes: true } } } });
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

export const INDIAN_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman & Nicobar', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];

export function images(json?: string | null): string[] {
  try {
    const v = JSON.parse(json || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function inr(n?: number | null) {
  if (n == null) return '';
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export function priceLabel(p: { priceMin?: number | null; priceMax?: number | null; priceUnit?: string | null }) {
  if (p.priceMin == null && p.priceMax == null) return 'Price on request';
  const unit = p.priceUnit ? ` ${p.priceUnit}` : '';
  if (p.priceMin != null && p.priceMax != null && p.priceMax !== p.priceMin) return `${inr(p.priceMin)} – ${inr(p.priceMax)}${unit}`;
  return `${inr(p.priceMin ?? p.priceMax)}${unit}`;
}
