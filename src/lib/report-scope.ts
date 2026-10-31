import { prisma } from '@/lib/db';
import { getSession, isStaff } from '@/lib/auth';
import type { Scope } from '@/lib/reports';

/** Who is asking for a report decides which data it may contain */
export async function reportScope(): Promise<Scope | null> {
  const s = await getSession();
  if (!s) return null;
  if (isStaff(s.role)) return { role: 'admin' };
  if (s.role === 'SELLER') {
    const p = await prisma.sellerProfile.findUnique({ where: { userId: s.sub }, select: { id: true, companyName: true } });
    return p ? { role: 'seller', sellerId: p.id, name: p.companyName } : null;
  }
  if (s.role === 'BUYER') {
    const p = await prisma.buyerProfile.findUnique({ where: { userId: s.sub }, select: { id: true, companyName: true } });
    return p ? { role: 'buyer', buyerId: p.id, name: p.companyName || s.name } : null;
  }
  return null;
}
