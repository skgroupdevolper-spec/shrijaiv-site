// Validation + normalisation of product data sent by sellers (and admins).
import { prisma } from '@/lib/db';
import { uniqueSlug } from './settings';

export type ProductInput = Partial<{
  name: string; summary: string; description: string; images: string[]; video: string; catalogFile: string;
  priceMin: number | null; priceMax: number | null; priceUnit: string; moq: string; stock: string;
  specs: { label: string; value: string }[]; certifications: string[]; tags: string; origin: string; brand: string;
  packaging: string; shelfLife: string; leadTime: string; categoryId: string | null; metaTitle: string; metaDescription: string; status: string;
}>;

const str = (v: any, max = 200) => (v == null ? null : String(v).trim().slice(0, max) || null);
const num = (v: any) => (v === '' || v == null || isNaN(Number(v)) ? null : Math.max(0, Number(v)));

export async function normalizeProduct(b: ProductInput, opts: { maxImages: number; existingSlug?: string; forAdmin?: boolean }) {
  const name = str(b.name, 160);
  if (!name || name.length < 3) throw new Error('Please enter a product name (at least 3 characters)');
  const images = Array.isArray(b.images) ? b.images.filter((x) => typeof x === 'string' && x.trim()).slice(0, opts.maxImages < 0 ? 15 : Math.max(1, Math.min(15, opts.maxImages))) : [];
  const specs = Array.isArray(b.specs) ? b.specs.filter((s) => s && str(s.label, 80) && str(s.value, 300)).map((s) => ({ label: str(s.label, 80)!, value: str(s.value, 300)! })).slice(0, 40) : [];
  const certs = Array.isArray(b.certifications) ? b.certifications.map((c) => str(c, 80)).filter(Boolean).slice(0, 12) : [];
  let categoryId: string | null = null;
  if (b.categoryId) {
    const c = await prisma.category.findUnique({ where: { id: String(b.categoryId) }, select: { id: true } });
    categoryId = c?.id || null;
  }
  const priceMin = num(b.priceMin);
  const priceMax = num(b.priceMax);
  const data: any = {
    name,
    summary: str(b.summary, 400),
    description: b.description == null ? null : String(b.description).slice(0, 20000),
    images: JSON.stringify(images),
    video: str(b.video, 500),
    catalogFile: str(b.catalogFile, 500),
    priceMin: priceMin != null && priceMax != null ? Math.min(priceMin, priceMax) : priceMin ?? priceMax,
    priceMax: priceMin != null && priceMax != null ? Math.max(priceMin, priceMax) : priceMax ?? priceMin,
    priceUnit: str(b.priceUnit, 40),
    moq: str(b.moq, 80),
    stock: str(b.stock, 60),
    specs: JSON.stringify(specs),
    certifications: JSON.stringify(certs),
    tags: str(b.tags, 300),
    origin: str(b.origin, 120),
    brand: str(b.brand, 120),
    packaging: str(b.packaging, 200),
    shelfLife: str(b.shelfLife, 80),
    leadTime: str(b.leadTime, 80),
    categoryId,
    metaTitle: str(b.metaTitle, 120),
    metaDescription: str(b.metaDescription, 200),
  };
  if (!opts.existingSlug) data.slug = await uniqueSlug(name, async (s) => !!(await prisma.product.findUnique({ where: { slug: s }, select: { id: true } })));
  return data;
}
