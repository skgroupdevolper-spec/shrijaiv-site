import { ok, fail } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { activatePlan } from '@/lib/marketplace/payments';
import { audit } from '@/lib/marketplace/admin-hooks';

export async function POST(req: Request) {
  const s = await requireAdmin();
  if (!s) return fail('Admins only', 403);
  const b = await req.json().catch(() => ({}));
  if (!b.sellerId || !b.planId) return fail('sellerId and planId are required');
  try {
    const r = await activatePlan({ sellerId: String(b.sellerId), planId: String(b.planId), autoRenew: false, source: 'manual', payment: b.amount ? { amount: Number(b.amount), gst: Number(b.gst || 0), method: 'bank_transfer' } : undefined });
    await audit({ id: s.sub, name: s.name }, 'activate-plan', 'sellers', String(b.sellerId), r.plan.name);
    return ok({ ok: true });
  } catch (e) {
    return fail((e as Error).message);
  }
}
