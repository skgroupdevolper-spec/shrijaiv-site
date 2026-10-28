import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireSeller } from '@/lib/auth';
import { getMarketplace } from '@/lib/marketplace/settings';
import { getPayments, hmac, totalPaise, applyCoupon, activatePlan } from '@/lib/marketplace/payments';

/** Razorpay Checkout success → verify the signature and activate the plan */
export async function POST(req: Request) {
  const ctx = await requireSeller();
  if (!ctx) return fail('Unauthorized', 401);
  const b = await req.json().catch(() => ({}));
  const pay = await getPayments();
  const plan = await prisma.plan.findUnique({ where: { id: String(b.planId || '') } });
  if (!plan) return fail('Plan not found');
  const paymentId = String(b.razorpay_payment_id || '');
  if (!paymentId) return fail('Missing payment id');
  if (await prisma.payment.findFirst({ where: { providerPaymentId: paymentId } })) return ok({ activated: true, duplicate: true });
  const mp = await getMarketplace();
  let discount = 0;
  try {
    ({ discount } = await applyCoupon(b.coupon, plan.id, plan.price));
  } catch {}
  const amt = totalPaise(plan.price, mp.gstPercent, discount);
  if (b.razorpay_subscription_id) {
    const sig = hmac(pay.razorpayKeySecret, `${paymentId}|${b.razorpay_subscription_id}`);
    if (sig !== b.razorpay_signature) return fail('Payment signature does not match', 400);
    await activatePlan({ sellerId: ctx.seller.id, planId: plan.id, autoRenew: true, source: 'razorpay', razorpaySubscriptionId: String(b.razorpay_subscription_id), payment: { amount: amt.base, gst: amt.gst, providerPaymentId: paymentId, method: 'razorpay', raw: b } });
    return ok({ activated: true });
  }
  const sig = hmac(pay.razorpayKeySecret, `${b.razorpay_order_id}|${paymentId}`);
  if (sig !== b.razorpay_signature) return fail('Payment signature does not match', 400);
  await activatePlan({ sellerId: ctx.seller.id, planId: plan.id, autoRenew: false, source: 'razorpay', payment: { amount: amt.base, gst: amt.gst, providerOrderId: String(b.razorpay_order_id), providerPaymentId: paymentId, method: 'razorpay', couponCode: b.coupon ? String(b.coupon).toUpperCase() : undefined, raw: b } });
  return ok({ activated: true });
}
