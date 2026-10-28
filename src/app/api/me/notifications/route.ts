import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** The signed-in user's latest in-app notifications (seller / buyer bell) */
export async function GET() {
  const s = await getSession();
  if (!s) return fail('Please log in', 401);
  const items = await prisma.notification.findMany({ where: { userId: s.sub }, orderBy: { createdAt: 'desc' }, take: 30 });
  return ok({ items, unread: items.filter((n) => !n.read).length });
}

/** Mark all as read */
export async function PUT() {
  const s = await getSession();
  if (!s) return fail('Please log in', 401);
  await prisma.notification.updateMany({ where: { userId: s.sub, read: false }, data: { read: true } });
  return ok({ ok: true });
}
