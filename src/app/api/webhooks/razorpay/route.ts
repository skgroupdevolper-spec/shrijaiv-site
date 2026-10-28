import { prisma } from '@/lib/db';
import { getPayments, hmac, activatePlan, totalPaise } from '@/lib/marketplace/payments';
import { getMarketplace } from '@/lib/marketplace/settings';

export const dynamic = 'force-dynamic';

/** Razorpay webhook: subscription renewals (subscription.charged) and payment failures */
export async function POST(req: Request) {
  const raw = await req.text();
  const pay = await getPayments();
  const sig = req.headers.get('x-razorpay-signature') || '';
  if (!pay.razorpayWebhookSecret || hmac(pay.razorpayWebhookSecret, raw) !== sig) return new Response('bad signature', { status: 400 });
  let ev: any;
  try {
    ev = JSON.parse(raw);
  } catch {
    return new Response('bad json', { status: 400 });
  }
  const type = ev.event as string;
  try {
    if (type === 'subscription.charged') {
      const sub = ev.payload?.subscription?.entity;
      const payment = ev.payload?.payment?.entity;
      const notes = sub?.notes || {};
      const existing = await prisma.payment.findFirst({ where: { providerPaymentId: payment?.id } });
      if (!existing && notes.sellerId && notes.planId) {
        const plan = await prisma.plan.findUnique({ where: { id: notes.planId } });
        const mp = await getMarketplace();
        if (plan) {
          const amt = totalPaise(plan.price, mp.gstPercent);
          await activatePlan({ sellerId: notes.sellerId, planId: plan.id, autoRenew: true, source: 'razorpay', razorpaySubscriptionId: sub.id, payment: { amount: amt.base, gst: amt.gst, providerPaymentId: payment?.id, method: payment?.method, raw: { event: type, subscription: sub?.id } } });
        }
      }
    } else if (type === 'subscription.halted' || type === 'subscription.cancelled' || type === 'subscription.completed') {
      const sub = ev.payload?.subscription?.entity;
      if (sub?.id) await prisma.subscription.updateMany({ where: { razorpaySubscriptionId: sub.id }, data: { autoRenew: false, ...(type === 'subscription.halted' ? { status: 'past_due' } : {}) } });
    } else if (type === 'payment.failed') {
      const p = ev.payload?.payment?.entity;
      await prisma.notification.create({ data: { userId: null, type: 'payment', title: `Payment failed: ${p?.email || ''} ₹${(p?.amount || 0) / 100}`, body: p?.error_description || '', href: '/admin/payments' } }).catch(() => null);
    }
  } catch (e) {
    console.error('[razorpay webhook]', (e as Error).message);
  }
  return new Response('ok');
}
