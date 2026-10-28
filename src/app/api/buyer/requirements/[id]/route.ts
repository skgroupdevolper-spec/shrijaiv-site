import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireBuyer } from '@/lib/auth';
import { normalizeRequirement } from '@/lib/marketplace/requirements';

type P = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: P) {
  const ctx = await requireBuyer();
  if (!ctx) return fail('Unauthorized', 401);
  const { id } = await params;
  const r = await prisma.requirement.findFirst({ where: { id, buyerId: ctx.buyer.id } });
  if (!r) return fail('Not found', 404);
  const b = await req.json().catch(() => ({}));
  if (b.action === 'close') return ok({ item: await prisma.requirement.update({ where: { id }, data: { status: 'closed' } }) });
  if (b.action === 'reopen') return ok({ item: await prisma.requirement.update({ where: { id }, data: { status: 'open', expiresAt: new Date(Date.now() + 45 * 86_400_000) } }) });
  try {
    const data = await normalizeRequirement(b);
    return ok({ item: await prisma.requirement.update({ where: { id }, data }) });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(_: Request, { params }: P) {
  const ctx = await requireBuyer();
  if (!ctx) return fail('Unauthorized', 401);
  const { id } = await params;
  const r = await prisma.requirement.deleteMany({ where: { id, buyerId: ctx.buyer.id } });
  if (!r.count) return fail('Not found', 404);
  return ok({ ok: true });
}
