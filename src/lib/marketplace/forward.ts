// Admin → Forward inquiry: one buyer inquiry can be sent to several sellers. The original inquiry goes to the
// first chosen seller; every other seller gets an own copy (own reference, own chat) of the same request.
import { prisma } from '@/lib/db';
import { makeRef } from '@/lib/utils';
import { deliverInquiry } from './notify';
import { getMarketplace } from './settings';

/** Sellers worth suggesting for an inquiry: those who offer the same catalogue product, then the same category */
export async function suggestSellers(inq: { sellerId: string; productId: string | null }) {
  const out: { id: string; companyName: string; city: string | null; state: string | null; verified: boolean; why: string }[] = [];
  const seen = new Set<string>([inq.sellerId]);
  const p = inq.productId ? await prisma.product.findUnique({ where: { id: inq.productId }, select: { id: true, masterId: true, categoryId: true } }) : null;
  if (p) {
    const root = p.masterId || p.id;
    const same = await prisma.product.findMany({ where: { status: 'approved', OR: [{ id: root }, { masterId: root }], seller: { status: 'approved' } }, select: { seller: { select: { id: true, companyName: true, city: true, state: true, verified: true } } } });
    for (const x of same) if (!seen.has(x.seller.id)) (seen.add(x.seller.id), out.push({ ...x.seller, why: 'sells this product' }));
    if (p.categoryId) {
      const cat = await prisma.product.findMany({ where: { status: 'approved', categoryId: p.categoryId, seller: { status: 'approved' } }, take: 60, select: { seller: { select: { id: true, companyName: true, city: true, state: true, verified: true } } } });
      for (const x of cat) if (!seen.has(x.seller.id)) (seen.add(x.seller.id), out.push({ ...x.seller, why: 'same category' }));
    }
  }
  return out.slice(0, 20);
}

/** The product a seller would be asked about: their own offer of the same catalogue product, else the original */
async function productFor(sellerId: string, productId: string | null) {
  if (!productId) return null;
  const p = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, masterId: true, sellerId: true } });
  if (!p) return null;
  if (p.sellerId === sellerId) return p.id;
  const root = p.masterId || p.id;
  const own = await prisma.product.findFirst({ where: { sellerId, OR: [{ id: root }, { masterId: root }] }, select: { id: true } });
  return own?.id || p.id;
}

/**
 * Forwards an inquiry. `sellerIds` empty → only its own seller. Returns the references that were delivered.
 * Works for inquiries still waiting for review (they are released) and for ones already forwarded (copies only).
 */
export async function forwardInquiry(id: string, sellerIds: string[], text?: string) {
  const inq = await prisma.inquiry.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: 'asc' }, take: 1 } } });
  if (!inq) throw new Error('Inquiry not found');
  const mp = await getMarketplace();
  const message = text || inq.message;
  const wanted = Array.from(new Set(sellerIds.length ? sellerIds : [inq.sellerId]));
  const sellers = await prisma.sellerProfile.findMany({ where: { id: { in: wanted }, status: 'approved' }, select: { id: true, userId: true, companyName: true, email: true } });
  if (!sellers.length) throw new Error('Choose at least one approved seller');
  const byId = new Map(sellers.map((s) => [s.id, s]));
  const order = wanted.filter((x) => byId.has(x));
  const delivered: string[] = [];
  const pending = inq.status === 'review';

  // 1) the original inquiry: released to its own seller, or moved to the first chosen seller
  let rest = order;
  if (pending) {
    const first = order.includes(inq.sellerId) ? inq.sellerId : order[0];
    const productId = first === inq.sellerId ? inq.productId : await productFor(first, inq.productId);
    const upd = await prisma.inquiry.update({ where: { id }, data: { status: 'new', sellerId: first, productId, message, seenByAdmin: true, seenBySeller: false, lastMessageAt: new Date() }, include: { product: { select: { name: true } } } });
    if (text && inq.messages[0]) await prisma.inquiryMessage.update({ where: { id: inq.messages[0].id }, data: { body: message } });
    await deliverInquiry(upd, byId.get(first)!, upd.product?.name);
    delivered.push(`${upd.refNo} → ${byId.get(first)!.companyName}`);
    rest = order.filter((x) => x !== first);
  } else {
    rest = order.filter((x) => x !== inq.sellerId);
  }

  // 2) an own copy for every other seller (skip sellers who already have a copy of this request)
  for (const sid of rest) {
    const exists = await prisma.inquiry.findFirst({ where: { sellerId: sid, adminNote: { contains: `copy of ${inq.refNo}` } }, select: { id: true } });
    if (exists) continue;
    const productId = await productFor(sid, inq.productId);
    const copy = await prisma.inquiry.create({
      data: {
        refNo: makeRef(),
        status: 'new',
        sellerId: sid,
        buyerId: inq.buyerId,
        productId,
        name: inq.name,
        email: inq.email,
        phone: inq.phone,
        company: inq.company,
        city: inq.city,
        quantity: inq.quantity,
        message,
        contactUnlocked: !mp.leads.enabled,
        seenByAdmin: true,
        seenBySeller: false,
        seenByBuyer: true,
        adminNote: `copy of ${inq.refNo} (forwarded by the admin)`,
        messages: { create: { senderId: inq.messages[0]?.senderId || null, senderRole: 'buyer', body: message } },
      },
      include: { product: { select: { name: true } } },
    });
    if (productId) prisma.product.update({ where: { id: productId }, data: { inquiryCount: { increment: 1 } } }).catch(() => null);
    await deliverInquiry(copy, byId.get(sid)!, copy.product?.name);
    delivered.push(`${copy.refNo} → ${byId.get(sid)!.companyName}`);
  }
  return delivered;
}
