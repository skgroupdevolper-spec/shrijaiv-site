import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { SELLER_VISIBLE } from '@/lib/marketplace/moderation';
import type { UnlockKind } from '@/lib/marketplace/unlocks';

/** Checks that the signed-in user may unlock this contact; returns who they are and what it is */
export async function unlockTarget(kind: string, id: string) {
  const s = await getSession();
  if (!s) return { error: 'Please sign in first', status: 401 };
  if (kind === 'inquiry' || kind === 'requirement') {
    if (s.role !== 'SELLER') return { error: 'Only sellers can unlock buyer contacts', status: 403 };
    const seller = await prisma.sellerProfile.findUnique({ where: { userId: s.sub }, select: { id: true, companyName: true, phone: true, status: true } });
    if (!seller) return { error: 'Seller profile not found', status: 403 };
    if (kind === 'inquiry') {
      const q = await prisma.inquiry.findFirst({ where: { id, sellerId: seller.id, ...SELLER_VISIBLE }, select: { id: true, refNo: true, contactUnlocked: true } });
      if (!q) return { error: 'Inquiry not found', status: 404 };
      return { session: s, sellerId: seller.id, kind: kind as UnlockKind, id, label: `buyer contact for inquiry ${q.refNo}`, already: q.contactUnlocked, phone: seller.phone || '' };
    }
    const r = await prisma.requirement.findFirst({ where: { id, status: { in: ['open', 'closed', 'expired'] } }, select: { id: true, title: true } });
    if (!r) return { error: 'Buy lead not found', status: 404 };
    return { session: s, sellerId: seller.id, kind: kind as UnlockKind, id, label: `buyer contact for "${r.title.slice(0, 60)}"`, already: false, phone: seller.phone || '' };
  }
  if (kind === 'seller') {
    if (s.role !== 'BUYER') return { error: 'Please sign in with a buyer account to see seller contact details', status: 403 };
    const seller = await prisma.sellerProfile.findFirst({ where: { id, status: 'approved' }, select: { id: true, companyName: true } });
    if (!seller) return { error: 'Seller not found', status: 404 };
    const buyer = await prisma.buyerProfile.findUnique({ where: { userId: s.sub }, select: { phone: true } });
    return { session: s, sellerId: null, kind: 'seller' as UnlockKind, id, label: `contact details of ${seller.companyName}`, already: false, phone: buyer?.phone || '' };
  }
  return { error: 'Unknown contact type', status: 400 };
}
