import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { getSession, startSession } from '@/lib/auth';

export async function PUT(req: Request) {
  const s = await getSession();
  if (!s) return fail('Unauthorized', 401);
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || '').trim();
  if (!name) return fail('Name is required');
  const user = await prisma.user.update({
    where: { id: s.sub },
    data: { name, phone: b.phone ? String(b.phone) : null, nationality: b.nationality ? String(b.nationality) : null },
  });
  await startSession(user);
  return ok();
}

/** Delete own account (sellers / buyers). Admins cannot delete themselves here. */
export async function DELETE() {
  const s = await getSession();
  if (!s) return fail('Unauthorized', 401);
  if (s.role === 'ADMIN' || s.role === 'EDITOR') return fail('Staff accounts are managed in Admin → Users');
  await prisma.user.delete({ where: { id: s.sub } });
  const { endSession } = await import('@/lib/auth');
  await endSession();
  return ok();
}
