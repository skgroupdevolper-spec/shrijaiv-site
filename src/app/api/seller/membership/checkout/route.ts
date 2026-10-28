import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireSeller } from '@/lib/auth';
import { getMarketplace } from '@/lib/marketplace/settings';
import { getPayments, totalPaise, applyCoupon, createOrder, createSubscription, ensureRazorpayPlan, activatePlan } from '@/lib/marketplace/payments';

/**
 * Starts a plan purchase.
 *  free plan                → activated at once
 *  provider = manual        → "pending" instructions (admin activates after bank transfer)
 *  Razorpay, one-time       → Razorpay order (Checkout.js on the client)
 *  Razorpay, auto-renew     → Razorpay subscription (Checkout.js with subscription_id)
 */
export async function POST(req: Request) {
  const ctx = await requireSeller();
  if (!ctx) return fail('Unauthorized', 401);
  const b = await req.json().catch(() => ({}));
  const plan = await prisma.plan.findFirst({ where: { id: String(b.planId || ''), active: true } });
  if (!plan) return fail('Plan not found');
  const mp = await getMarketplace();
  if (!mp.paidPlans) return fail('Paid plans are switched off — every feature is free right now.');
  const autoRenew = !!b.autoRenew && plan.autoRenew && plan.period !== 'lifetime';
  if (plan.price <= 0) {
    await activatePlan({ sellerId: ctx.seller.id, planId: plan.id, autoRenew: false, source: 'free' });
    return ok({ activated: true });
  }
  let discount = 0;
  let coupon = null;
  try {
    ({ discount, coupon } = await applyCoupon(b.coupon, plan.id, plan.price));
  } catch (e) {
    return fail((e as Error).message);
  }
  const amt = totalPaise(plan.price, mp.gstPercent, discount);
  const pay = await getPayments();
  if (pay.provider === 'manual') {
    await prisma.payment.create({ data: { userId: ctx.session.sub, amount: amt.base, gst: amt.gst, status: 'created', provider: 'manual', couponCode: coupon?.code || null, notes: `Plan ${plan.name} (${plan.id}) · seller ${ctx.seller.id} · autoRenew=${autoRenew}` } });
    await prisma.notification.create({ data: { userId: null, type: 'payment', title: `Manual payment pending: ${ctx.seller.companyName} → ${plan.name}`, href: `/admin/payments` } }).catch(() => null);
    return ok({ manual: true, instructions: pay.manualInstructions, amount: amt });
  }
  const notes = { sellerId: ctx.seller.id, planId: plan.id, autoRenew: String(autoRenew), coupon: coupon?.code || '' };
  try {
    if (autoRenew) {
      if (discount) return fail('Coupons cannot be combined with auto-renewal. Untick auto-renew or remove the coupon.');
      const rzPlan = await ensureRazorpayPlan(plan, amt.paise);
      const sub = await createSubscription(rzPlan, notes);
      return ok({ keyId: pay.razorpayKeyId, subscriptionId: sub.id, amount: amt, plan: { id: plan.id, name: plan.name }, autoRenew: true, prefill: { name: ctx.session.name, email: ctx.session.email, contact: ctx.seller.phone || '' } });
    }
    const order = await createOrder(amt.paise, `plan_${plan.id.slice(-8)}_${Date.now()}`.slice(0, 40), notes);
    return ok({ keyId: pay.razorpayKeyId, orderId: order.id, amount: amt, plan: { id: plan.id, name: plan.name }, autoRenew: false, prefill: { name: ctx.session.name, email: ctx.session.email, contact: ctx.seller.phone || '' } });
  } catch (e) {
    return fail((e as Error).message);
  }
}
