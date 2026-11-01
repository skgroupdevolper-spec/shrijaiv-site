// Private contacts. A seller never sees a buyer's mobile / email (inquiry or buy lead) and a buyer never sees
// a seller's mobile / email / address until it is unlocked: a few for free (Admin → Marketplace settings →
// Private contacts & paid leads), more after paying per contact, or when the admin unlocks it.
import { prisma } from '@/lib/db';
import { getMarketplace } from './settings';
import { entitlements } from './plans';

export type UnlockKind = 'inquiry' | 'requirement' | 'seller';
export type Side = 'seller' | 'buyer';

export const sideOf = (kind: UnlockKind): Side => (kind === 'seller' ? 'buyer' : 'seller');

function periodStart(period: 'month' | 'total') {
  if (period === 'total') return new Date(0);
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Free unlocks left for this user, the price of one more, and whether privacy is on at all */
export async function allowance(userId: string, side: Side, sellerId?: string | null) {
  const mp = await getMarketplace();
  const L = mp.leads;
  let free = side === 'seller' ? L.sellerFree : L.buyerFree;
  let unlimited = false;
  // a paid seller plan can include more (or unlimited) buyer contacts
  if (side === 'seller' && sellerId && mp.paidPlans) {
    const e = await entitlements(sellerId).catch(() => null);
    if (e && (e.status === 'active' || e.status === 'trial')) {
      if (e.maxInquiries < 0) unlimited = true;
      else free = Math.max(free, e.maxInquiries);
    }
  }
  const used = await prisma.unlock.count({ where: { userId, source: 'free', createdAt: { gte: periodStart(L.period) }, kind: side === 'seller' ? { in: ['inquiry', 'requirement'] } : 'seller' } });
  return {
    enabled: L.enabled,
    unlimited,
    free,
    used,
    left: unlimited ? Infinity : Math.max(0, free - used),
    price: side === 'seller' ? L.sellerPrice : L.buyerPrice,
    period: L.period,
    note: L.note,
  };
}

export async function isUnlocked(userId: string | null | undefined, kind: UnlockKind, targetId: string) {
  const mp = await getMarketplace();
  if (!mp.leads.enabled) return true;
  if (!userId) return false;
  return !!(await prisma.unlock.findUnique({ where: { userId_kind_targetId: { userId, kind, targetId } }, select: { id: true } }));
}

export async function unlockedIds(userId: string | null | undefined, kind: UnlockKind, ids: string[]) {
  const mp = await getMarketplace();
  if (!mp.leads.enabled) return new Set(ids);
  if (!userId || !ids.length) return new Set<string>();
  const rows = await prisma.unlock.findMany({ where: { userId, kind, targetId: { in: ids } }, select: { targetId: true } });
  return new Set(rows.map((r) => r.targetId));
}

async function record(userId: string, kind: UnlockKind, targetId: string, source: string, amount = 0, paymentId: string | null = null) {
  await prisma.unlock.upsert({ where: { userId_kind_targetId: { userId, kind, targetId } }, update: {}, create: { userId, kind, targetId, source, amount, paymentId } });
  if (kind === 'inquiry') await prisma.inquiry.update({ where: { id: targetId }, data: { contactUnlocked: true } }).catch(() => null);
}

/** Uses a free unlock when one is left. Returns what the client should do next. */
export async function tryUnlock(userId: string, kind: UnlockKind, targetId: string, sellerId?: string | null) {
  if (await isUnlocked(userId, kind, targetId)) return { unlocked: true as const };
  const a = await allowance(userId, sideOf(kind), sellerId);
  if (a.unlimited) {
    await record(userId, kind, targetId, 'plan');
    return { unlocked: true as const };
  }
  if (a.left > 0) {
    await record(userId, kind, targetId, 'free');
    return { unlocked: true as const, left: a.left - 1 };
  }
  return { unlocked: false as const, price: a.price };
}

export async function grantUnlock(userId: string, kind: UnlockKind, targetId: string, source: 'paid' | 'admin', amount = 0, paymentId: string | null = null) {
  await record(userId, kind, targetId, source, amount, paymentId);
}

/** Hides mobile numbers, e-mail addresses and links inside chat messages while contacts are private */
export function maskContacts(text: string) {
  return String(text || '')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '•••@•••')
    .replace(/(?:\+?\d[\s-]?){8,}\d/g, (m) => m.slice(0, 2) + '•'.repeat(Math.max(4, m.length - 2)))
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, '[link hidden]')
    .replace(/\b(?:wa\.me|t\.me)\/\S+/gi, '[link hidden]');
}

/** Public pages: may this visitor see a seller's mobile / WhatsApp / e-mail / website? */
export async function sellerContactAccess(user: { id: string; role: string } | null | undefined, sellerId: string, back: string) {
  const mp = await getMarketplace();
  if (!mp.leads.enabled) return { open: true, signIn: null as string | null };
  if (user && (user.role === 'ADMIN' || user.role === 'EDITOR')) return { open: true, signIn: null };
  if (user?.role === 'BUYER') return { open: await isUnlocked(user.id, 'seller', sellerId), signIn: null };
  if (user?.role === 'SELLER') {
    const own = await prisma.sellerProfile.findFirst({ where: { id: sellerId, userId: user.id }, select: { id: true } });
    return { open: !!own, signIn: own ? null : '/register?as=buyer' };
  }
  return { open: false, signIn: `/login?next=${encodeURIComponent(back)}` };
}
