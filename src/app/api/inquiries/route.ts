import { prisma } from '@/lib/db';
import { ok, fail, rateLimit, clientIp, isEmail } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { makeRef } from '@/lib/utils';
import { getMarketplace } from '@/lib/marketplace/settings';
import { entitlements } from '@/lib/marketplace/plans';
import { onNewInquiry } from '@/lib/marketplace/notify';

/** Buyer (or guest) → seller inquiry, optionally about one product */
export async function POST(req: Request) {
  if (!rateLimit('inquiry:' + clientIp(req), 8, 10 * 60_000)) return fail('Too many inquiries. Please try again later.', 429);
  const b = await req.json().catch(() => ({}));
  const sellerId = String(b.sellerId || '');
  const productId = b.productId ? String(b.productId) : null;
  const message = String(b.message || '').trim();
  if (!sellerId || !message) return fail('Please write a message');
  const seller = await prisma.sellerProfile.findFirst({ where: { id: sellerId, status: 'approved' }, select: { id: true, userId: true, companyName: true, email: true } });
  if (!seller) return fail('Seller not found');
  const product = productId ? await prisma.product.findFirst({ where: { id: productId, sellerId, status: 'approved' }, select: { id: true, name: true } }) : null;

  const session = await getSession();
  const mp = await getMarketplace();
  let name = String(b.name || '').trim();
  let email = String(b.email || '').toLowerCase().trim();
  let phone = String(b.phone || '').trim();
  let buyerId: string | null = null;
  if (session) {
    const user = await prisma.user.findUnique({ where: { id: session.sub }, include: { buyer: true } });
    if (user) {
      name = name || user.name;
      email = email || user.email;
      phone = phone || user.phone || '';
      buyerId = user.buyer?.id || null;
      if (user.seller && !user.buyer && user.role === 'SELLER' && user.seller.id === sellerId) return fail('You cannot send an inquiry to yourself');
    }
  } else if (!mp.allowGuestInquiry) {
    return fail('Please sign in to send an inquiry', 401);
  }
  if (!name) return fail('Please enter your name');
  if (!isEmail(email)) return fail('Please enter a valid email');
  if (!phone || phone.replace(/\D/g, '').length < 10) return fail('Please enter a valid mobile number');

  // seller plan: buyer contact unlocked?
  const e = await entitlements(seller.id);
  let contactUnlocked = true;
  if (e.paidPlans && e.maxInquiries >= 0) {
    const since = new Date();
    since.setDate(1);
    since.setHours(0, 0, 0, 0);
    const used = await prisma.inquiry.count({ where: { sellerId: seller.id, contactUnlocked: true, createdAt: { gte: since } } });
    contactUnlocked = used < e.maxInquiries;
  }
  if (!mp.showBuyerContactToSeller && e.paidPlans && e.status !== 'active' && e.status !== 'trial') contactUnlocked = false;

  const inq = await prisma.inquiry.create({
    data: {
      refNo: makeRef(),
      sellerId: seller.id,
      buyerId,
      productId: product?.id || null,
      name,
      email,
      phone,
      company: b.company ? String(b.company).slice(0, 120) : null,
      city: b.city ? String(b.city).slice(0, 80) : null,
      quantity: b.quantity ? String(b.quantity).slice(0, 120) : null,
      message: message.slice(0, 4000),
      contactUnlocked,
      seenByBuyer: true,
      messages: { create: { senderId: session?.sub || null, senderRole: 'buyer', body: message.slice(0, 4000) } },
    },
  });
  if (product) prisma.product.update({ where: { id: product.id }, data: { inquiryCount: { increment: 1 } } }).catch(() => null);
  onNewInquiry(inq, seller, product?.name).catch((err) => console.error('[inquiry] notify failed:', err?.message));
  return ok({ ok: true, refNo: inq.refNo, href: buyerId ? `/buyer/inquiries/${inq.id}` : undefined });
}
