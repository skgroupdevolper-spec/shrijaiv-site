import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { getMarketplace } from '@/lib/marketplace/settings';
import { grantUnlock, allowance, sideOf } from '@/lib/marketplace/unlocks';
import { getPayments, hmac, totalPaise, nextInvoiceNo } from '@/lib/marketplace/payments';
import { unlockTarget } from '../target';

/** Razorpay Checkout success for a contact unlock → verify the signature, record the payment, unlock */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const t = await unlockTarget(String(b.kind || ''), String(b.id || ''));
  if ('error' in t) return fail(t.error!, t.status);
  const paymentId = String(b.razorpay_payment_id || '');
  if (!paymentId) return fail('Missing payment id');
  const pay = await getPayments();
  if (hmac(pay.razorpayKeySecret, `${b.razorpay_order_id}|${paymentId}`) !== b.razorpay_signature) return fail('Payment signature does not match', 400);
  if (await prisma.payment.findFirst({ where: { providerPaymentId: paymentId } })) return ok({ unlocked: true, duplicate: true });
  const mp = await getMarketplace();
  const a = await allowance(t.session.sub, sideOf(t.kind), t.sellerId);
  const amt = totalPaise(a.price, mp.gstPercent);
  const p = await prisma.payment.create({ data: { userId: t.session.sub, amount: amt.base, gst: amt.gst, status: 'paid', provider: 'razorpay', providerOrderId: String(b.razorpay_order_id), providerPaymentId: paymentId, method: 'razorpay', invoiceNo: await nextInvoiceNo(), notes: `unlock:${t.kind}:${t.id}:${t.session.sub}`, paidAt: new Date() } });
  await grantUnlock(t.session.sub, t.kind, t.id, 'paid', amt.base, p.id);
  return ok({ unlocked: true });
}
