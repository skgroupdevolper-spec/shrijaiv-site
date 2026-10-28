import { ok, fail, refreshSite } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { getMarketplace, saveMarketplace } from '@/lib/marketplace/settings';
import { audit } from '@/lib/marketplace/admin-hooks';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await requireAdmin())) return fail('Admins only', 403);
  return ok({ value: await getMarketplace() });
}

export async function PUT(req: Request) {
  const s = await requireAdmin();
  if (!s) return fail('Admins only', 403);
  const { value } = await req.json().catch(() => ({}));
  if (!value || typeof value !== 'object') return fail('Invalid data');
  const next = await saveMarketplace(value);
  refreshSite();
  await audit({ id: s.sub, name: s.name }, 'update', 'marketplace-settings', null, `paidPlans=${next.paidPlans}`);
  return ok({ value: next });
}
