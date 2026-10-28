// What a seller is allowed to do right now (plan limits), honouring the admin's "Paid plans" master switch.
import { prisma } from '@/lib/db';
import { getMarketplace } from './settings';

export type Entitlements = {
  paidPlans: boolean;
  planName: string;
  status: 'free' | 'trial' | 'active' | 'expired' | 'none';
  endsAt: Date | null;
  autoRenew: boolean;
  maxProducts: number; // -1 = unlimited
  maxInquiries: number;
  maxQuotes: number;
  maxImages: number;
  featuredSlots: number;
  verifiedBadge: boolean;
  priorityRank: number;
  analytics: boolean;
  aiTools: boolean;
  canAddProducts: boolean;
};

const UNLIMITED = { maxProducts: -1, maxInquiries: -1, maxQuotes: -1, maxImages: -1 };

export async function entitlements(sellerId: string): Promise<Entitlements> {
  const mp = await getMarketplace();
  const now = new Date();
  // the newest subscription that is still running (grace days included)
  const sub = await prisma.subscription.findFirst({
    where: { sellerId, status: { in: ['trial', 'active', 'past_due'] } },
    orderBy: { createdAt: 'desc' },
    include: { plan: true },
  });
  const graceMs = (mp.graceDays || 0) * 86_400_000;
  const live = sub && (!sub.endsAt || sub.endsAt.getTime() + graceMs > now.getTime());

  if (!mp.paidPlans) {
    // Everything free and unlimited; a plan (if any) only adds badges/featured slots
    return {
      paidPlans: false,
      planName: live ? sub!.plan.name : 'Free (unlimited)',
      status: 'free',
      endsAt: live ? sub!.endsAt : null,
      autoRenew: live ? sub!.autoRenew : false,
      ...UNLIMITED,
      featuredSlots: live ? sub!.plan.featuredSlots : 0,
      verifiedBadge: live ? sub!.plan.verifiedBadge : false,
      priorityRank: live ? sub!.plan.priorityRank : 0,
      analytics: true,
      aiTools: true,
      canAddProducts: true,
    };
  }

  if (live) {
    const p = sub!.plan;
    return {
      paidPlans: true,
      planName: p.name,
      status: sub!.status === 'trial' ? 'trial' : 'active',
      endsAt: sub!.endsAt,
      autoRenew: sub!.autoRenew,
      maxProducts: p.maxProducts,
      maxInquiries: p.maxInquiries,
      maxQuotes: p.maxQuotes,
      maxImages: p.maxImages,
      featuredSlots: p.featuredSlots,
      verifiedBadge: p.verifiedBadge,
      priorityRank: p.priorityRank,
      analytics: p.analytics,
      aiTools: p.aiTools,
      canAddProducts: true,
    };
  }

  // Paid plans are on and the seller has no running plan: free tier limits from the settings
  return {
    paidPlans: true,
    planName: sub ? `${sub.plan.name} (expired)` : 'No plan',
    status: sub ? 'expired' : 'none',
    endsAt: sub?.endsAt || null,
    autoRenew: false,
    maxProducts: mp.freeTier.maxProducts,
    maxInquiries: mp.freeTier.maxInquiries,
    maxQuotes: mp.freeTier.maxQuotes,
    maxImages: 3,
    featuredSlots: 0,
    verifiedBadge: false,
    priorityRank: 0,
    analytics: false,
    aiTools: false,
    canAddProducts: mp.freeTier.maxProducts !== 0,
  };
}

/** true when the seller may add one more product */
export async function canAddProduct(sellerId: string) {
  const e = await entitlements(sellerId);
  if (!e.canAddProducts) return { ok: false, reason: 'Please choose a plan to add products.', e };
  if (e.maxProducts < 0) return { ok: true, e };
  const n = await prisma.product.count({ where: { sellerId, status: { not: 'hidden' } } });
  return n < e.maxProducts ? { ok: true, e } : { ok: false, reason: `Your plan allows ${e.maxProducts} products. Upgrade to add more.`, e };
}

/** Plan period → end date */
export function periodEnd(start: Date, period: string, periodDays?: number | null): Date | null {
  const d = new Date(start);
  if (period === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (period === 'quarterly') d.setMonth(d.getMonth() + 3);
  else if (period === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else if (period === 'lifetime') return null;
  else d.setDate(d.getDate() + (periodDays || 30));
  return d;
}
