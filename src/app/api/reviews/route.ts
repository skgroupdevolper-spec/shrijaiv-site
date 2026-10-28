import { prisma } from '@/lib/db';
import { ok, fail, rateLimit, clientIp, isEmail } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { getMarketplace } from '@/lib/marketplace/settings';
import { notifyAdmins, notifyUser } from '@/lib/marketplace/notify';
import { recomputeRating } from '@/lib/marketplace/reviews';

export async function POST(req: Request) {
  if (!rateLimit('review:' + clientIp(req), 5, 10 * 60_000)) return fail('Too many reviews. Please try later.', 429);
  const session = await getSession();
  const b = await req.json().catch(() => ({}));
  const sellerId = String(b.sellerId || '');
  const productId = b.productId ? String(b.productId) : null;
  const rating = Math.min(5, Math.max(1, Math.round(Number(b.rating) || 0)));
  const body = String(b.body || '').trim();
  if (!sellerId || !rating || body.length < 10) return fail('Please give a rating and write at least a few words');
  const mp = await getMarketplace();
  const user = session ? await prisma.user.findUnique({ where: { id: session.sub }, include: { buyer: true, seller: true } }) : null;
  // visitors: name + email instead of an account (Admin → Marketplace settings → Visitors can rate & review)
  const guestName = String(b.name || '').trim().slice(0, 80);
  const guestEmail = String(b.email || '').trim().toLowerCase();
  if (!user) {
    if (!mp.allowGuestReview) return fail('Please sign in to write a review', 401);
    if (!guestName) return fail('Please enter your name');
    if (!isEmail(guestEmail)) return fail('Please enter a valid email');
  }
  if (user?.seller?.id === sellerId) return fail('You cannot review your own company');
  const seller = await prisma.sellerProfile.findFirst({ where: { id: sellerId, status: 'approved' }, select: { id: true, userId: true, companyName: true } });
  if (!seller) return fail('Seller not found');
  // one review per buyer per seller/product (update it when it exists)
  const existing = user?.buyer ? await prisma.review.findFirst({ where: { buyerId: user.buyer.id, sellerId, productId } }) : null;
  // a visitor who already sent an inquiry (same email) counts as a verified buyer too
  const verifiedPurchase = user?.buyer ? (await prisma.inquiry.count({ where: { buyerId: user.buyer.id, sellerId } })) > 0 : guestEmail ? (await prisma.inquiry.count({ where: { email: guestEmail, sellerId } })) > 0 : false;
  const authorName = user ? user.name : guestName;
  const data = { sellerId, productId, buyerId: user?.buyer?.id || null, authorName, rating, title: b.title ? String(b.title).slice(0, 120) : null, body: body.slice(0, 3000), status: mp.approval.reviews ? 'pending' : 'approved', verifiedPurchase, seen: false };
  const review = existing ? await prisma.review.update({ where: { id: existing.id }, data }) : await prisma.review.create({ data });
  if (review.status === 'approved') await recomputeRating(sellerId, productId);
  await notifyAdmins({ type: 'review', title: `${rating}★ review for ${seller.companyName} by ${authorName}${user ? '' : ` (visitor, ${guestEmail})`}`, body: body.slice(0, 140), href: '/admin/reviews' });
  if (review.status === 'approved') await notifyUser(seller.userId, { type: 'review', title: `${rating}★ new review from ${authorName}`, body: body.slice(0, 140), href: '/seller/reviews' });
  return ok({ ok: true, status: review.status });
}
