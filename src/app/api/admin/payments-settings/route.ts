import { ok, fail } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { getPayments, savePayments, maskPayments } from '@/lib/marketplace/payments';
import { audit } from '@/lib/marketplace/admin-hooks';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await requireAdmin())) return fail('Admins only', 403);
  return ok({ value: maskPayments(await getPayments()) });
}

export async function PUT(req: Request) {
  const s = await requireAdmin();
  if (!s) return fail('Admins only', 403);
  const { value } = await req.json().catch(() => ({}));
  if (!value || typeof value !== 'object') return fail('Invalid data');
  const next = await savePayments(value);
  await audit({ id: s.sub, name: s.name }, 'update', 'payment-settings', null, `provider=${next.provider}`);
  return ok({ value: maskPayments(next) });
}

/** Test the Razorpay keys with a tiny API call */
export async function POST() {
  if (!(await requireAdmin())) return fail('Admins only', 403);
  const p = await getPayments();
  if (!p.razorpayKeyId || !p.razorpayKeySecret) return fail('Enter the Razorpay key id and secret first');
  try {
    const res = await fetch('https://api.razorpay.com/v1/orders?count=1', { headers: { Authorization: 'Basic ' + Buffer.from(`${p.razorpayKeyId}:${p.razorpayKeySecret}`).toString('base64') }, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return fail(`Razorpay answered ${res.status} — check the keys`);
    return ok({ ok: true, message: `Connected (${p.razorpayKeyId.startsWith('rzp_test') ? 'TEST mode' : 'LIVE mode'})` });
  } catch (e) {
    return fail((e as Error).message);
  }
}
