import { prisma } from '@/lib/db';
import { ok, fail, rateLimit, clientIp } from '@/lib/api';
import { requireBuyer } from '@/lib/auth';
import { getMarketplace } from '@/lib/marketplace/settings';
import { notifyAdmins } from '@/lib/marketplace/notify';
import { normalizeRequirement } from '@/lib/marketplace/requirements';
import { translateLater } from '@/lib/i18n/overlay';

export const dynamic = 'force-dynamic';
export async function GET() {
  const ctx = await requireBuyer();
  if (!ctx) return fail('Unauthorized', 401);
  const items = await prisma.requirement.findMany({ where: { buyerId: ctx.buyer.id }, orderBy: { createdAt: 'desc' }, include: { category: { select: { name: true } }, _count: { select: { quotes: { where: { status: { notIn: ['review', 'rejected'] } } } } } } });
  return ok({ items });
}

export async function POST(req: Request) {
  const ctx = await requireBuyer();
  if (!ctx) return fail('Unauthorized', 401);
  if (!rateLimit('req:' + clientIp(req), 10, 60 * 60_000)) return fail('Too many requirements posted. Please try later.', 429);
  const b = await req.json().catch(() => ({}));
  let data;
  try {
    data = await normalizeRequirement(b);
  } catch (e) {
    return fail((e as Error).message);
  }
  const mp = await getMarketplace();
  const expiresAt = new Date(Date.now() + 45 * 86_400_000);
  const r = await prisma.requirement.create({ data: { ...data, buyerId: ctx.buyer.id, status: mp.approval.requirements ? 'pending' : 'open', expiresAt } });
  translateLater('requirement', r.id);
  await notifyAdmins({ type: 'requirement', title: `${r.status === 'pending' ? 'Requirement to approve' : 'New requirement'}: ${r.title}`, body: ctx.session.name, href: `/admin/requirements/${r.id}` });
  return ok({ item: r });
}
