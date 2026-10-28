import { prisma } from '@/lib/db';

/** Recomputes a seller's (and product's) average rating from approved reviews */
export async function recomputeRating(sellerId: string, productId?: string | null) {
  const s = await prisma.review.aggregate({ where: { sellerId, status: 'approved' }, _avg: { rating: true }, _count: { _all: true } });
  await prisma.sellerProfile.update({ where: { id: sellerId }, data: { ratingAvg: s._avg.rating || 0, ratingCount: s._count._all } });
  if (productId) {
    const p = await prisma.review.aggregate({ where: { productId, status: 'approved' }, _avg: { rating: true }, _count: { _all: true } });
    await prisma.product.update({ where: { id: productId }, data: { ratingAvg: p._avg.rating || 0, ratingCount: p._count._all } }).catch(() => null);
  }
}

