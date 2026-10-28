import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireSeller } from '@/lib/auth';
import { cancelRazorpaySubscription } from '@/lib/marketplace/payments';

/** Switch auto-renewal off (the plan stays active until it ends) */
export async function POST(req: Request) {
  const ctx = await requireSeller();
  if (!ctx) return fail('Unauthorized', 401);
  const b = await req.json().catch(() => ({}));
  const sub = await prisma.subscription.findFirst({ where: { sellerId: ctx.seller.id, status: { in: ['active', 'trial', 'past_due'] } }, orderBy: { createdAt: 'desc' } });
  if (!sub) return fail('No active plan');
  const autoRenew = b.autoRenew === true;
  if (!autoRenew && sub.razorpaySubscriptionId) await cancelRazorpaySubscription(sub.razorpaySubscriptionId);
  await prisma.subscription.update({ where: { id: sub.id }, data: { autoRenew, cancelledAt: autoRenew ? null : new Date(), razorpaySubscriptionId: autoRenew ? sub.razorpaySubscriptionId : null } });
  return ok({ ok: true, autoRenew });
}
