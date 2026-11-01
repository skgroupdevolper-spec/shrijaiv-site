import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { getMarketplace } from '@/lib/marketplace/settings';
import { tryUnlock, allowance, sideOf } from '@/lib/marketplace/unlocks';
import { getPayments, totalPaise, createOrder } from '@/lib/marketplace/payments';
import { notifyAdmins } from '@/lib/marketplace/notify';
import { unlockTarget } from './target';

export const dynamic = 'force-dynamic';

/** GET ?side=seller|buyer → free unlocks left and the price of one more */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const t = await unlockTarget(u.searchParams.get('kind') || '', u.searchParams.get('id') || '');
  if ('error' in t) return fail(t.error!, t.status);
  const a = await allowance(t.session.sub, sideOf(t.kind), t.sellerId);
  return ok({ ...a, left: a.left === Infinity ? -1 : a.left });
}

/**
 * Unlock a contact: free while the allowance lasts, otherwise
 *  provider = manual   → a pending payment; the admin unlocks it after the bank transfer
 *  Razorpay            → an order for Checkout.js; /api/unlock/verify finishes it
 */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const t = await unlockTarget(String(b.kind || ''), String(b.id || ''));
  if ('error' in t) return fail(t.error!, t.status);
  if (t.already) return ok({ unlocked: true });
  const r = await tryUnlock(t.session.sub, t.kind, t.id, t.sellerId);
  if (r.unlocked) return ok(r);
  if (!r.price) return fail('You have used all free contacts. Please contact the SHRIJAIV team to get more.', 402);
  const mp = await getMarketplace();
  const amt = totalPaise(r.price, mp.gstPercent);
  const pay = await getPayments();
  const notes = `unlock:${t.kind}:${t.id}:${t.session.sub}`;
  if (pay.provider === 'manual' || !pay.razorpayKeyId || !pay.razorpayKeySecret) {
    const exists = await prisma.payment.findFirst({ where: { notes, status: 'created' } });
    if (!exists) {
      await prisma.payment.create({ data: { userId: t.session.sub, amount: amt.base, gst: amt.gst, status: 'created', provider: 'manual', notes } });
      await notifyAdmins({ type: 'payment', title: `Contact unlock requested (${t.kind})`, body: `${t.session.name || t.session.email} wants the ${t.label} — ₹${amt.total}`, href: '/admin/payments' }).catch(() => null);
    }
    return ok({ manual: true, instructions: pay.manualInstructions || 'Our team will contact you with the payment details. The contact is unlocked as soon as the payment is received.', amount: amt });
  }
  try {
    const order = await createOrder(amt.paise, `unl_${Date.now()}`, { kind: t.kind, id: t.id, userId: t.session.sub });
    return ok({ pay: true, keyId: pay.razorpayKeyId, orderId: order.id, amount: amt, label: t.label, prefill: { name: t.session.name, email: t.session.email, contact: t.phone } });
  } catch (e) {
    return fail((e as Error).message);
  }
}
