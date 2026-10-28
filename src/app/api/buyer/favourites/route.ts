import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireBuyer } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Toggle a favourite product or seller */
export async function POST(req: Request) {
  const ctx = await requireBuyer();
  if (!ctx) return fail('Please sign in as a buyer', 401);
  const b = await req.json().catch(() => ({}));
  const productId = b.productId ? String(b.productId) : null;
  const sellerId = b.sellerId ? String(b.sellerId) : null;
  if (!productId && !sellerId) return fail('Nothing to save');
  const where = productId ? { buyerId_productId: { buyerId: ctx.buyer.id, productId } } : { buyerId_sellerId: { buyerId: ctx.buyer.id, sellerId: sellerId! } };
  const existing = await prisma.favourite.findUnique({ where: where as any });
  if (existing) {
    await prisma.favourite.delete({ where: { id: existing.id } });
    return ok({ saved: false });
  }
  await prisma.favourite.create({ data: { buyerId: ctx.buyer.id, productId, sellerId } });
  return ok({ saved: true });
}

export async function GET() {
  const ctx = await requireBuyer();
  if (!ctx) return fail('Unauthorized', 401);
  const items = await prisma.favourite.findMany({ where: { buyerId: ctx.buyer.id }, select: { productId: true, sellerId: true } });
  return ok({ products: items.map((i) => i.productId).filter(Boolean), sellers: items.map((i) => i.sellerId).filter(Boolean) });
}
