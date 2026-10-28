// Marketplace settings (Setting key "marketplace"), edited in Admin → Marketplace settings.
import { prisma } from '@/lib/db';

export type MarketplaceSettings = {
  /** Master switch. false = every seller gets unlimited everything for free. true = a seller needs an active plan. */
  paidPlans: boolean;
  /** What a seller may do without an active plan when paidPlans is on */
  freeTier: { maxProducts: number; maxInquiries: number; maxQuotes: number };
  approval: { sellers: boolean; products: boolean; requirements: boolean; reviews: boolean }; // true = admin approves first
  allowGuestInquiry: boolean; // visitors can send an inquiry without an account
  allowGuestRequirement: boolean; // visitors can post a requirement (creates a buyer account)
  showBuyerContactToSeller: boolean; // when false, contact details are hidden until the seller has a plan with inquiries
  currency: string;
  gstPercent: number; // GST added on plan invoices
  renewalReminderDays: number; // email X days before a plan ends
  graceDays: number; // days after expiry before products are hidden
  sellerTypes: string[];
  buyerTypes: string[];
  units: string[];
};

export const defaultMarketplace: MarketplaceSettings = {
  paidPlans: false,
  freeTier: { maxProducts: 3, maxInquiries: 5, maxQuotes: 5 },
  approval: { sellers: true, products: true, requirements: false, reviews: true },
  allowGuestInquiry: true,
  allowGuestRequirement: true,
  showBuyerContactToSeller: true,
  currency: 'INR',
  gstPercent: 18,
  renewalReminderDays: 7,
  graceDays: 3,
  sellerTypes: ['Manufacturer', 'Farmer / FPO', 'Wholesaler', 'Exporter', 'Trader', 'Brand owner'],
  buyerTypes: ['Retailer', 'Wholesaler', 'Restaurant / Hotel', 'Exporter', 'Brand / Private label', 'Individual'],
  units: ['kg', 'quintal', 'ton', 'litre', 'piece', 'box', 'bag', 'dozen'],
};

function deepMerge<T>(base: T, over: any): T {
  if (Array.isArray(base)) return (Array.isArray(over) ? over : base) as T;
  if (base && typeof base === 'object') {
    const out: any = { ...base };
    if (over && typeof over === 'object') for (const k of Object.keys(over)) out[k] = typeof (base as any)[k] === 'object' && !Array.isArray((base as any)[k]) && (base as any)[k] !== null ? deepMerge((base as any)[k], over[k]) : over[k];
    return out;
  }
  return (over === undefined ? base : over) as T;
}

export async function getMarketplace(): Promise<MarketplaceSettings> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: 'marketplace' } });
    return deepMerge(defaultMarketplace, row ? JSON.parse(row.value) : {});
  } catch {
    return defaultMarketplace;
  }
}

export async function saveMarketplace(patch: Partial<MarketplaceSettings>) {
  const next = deepMerge(await getMarketplace(), patch);
  await prisma.setting.upsert({ where: { key: 'marketplace' }, update: { value: JSON.stringify(next) }, create: { key: 'marketplace', value: JSON.stringify(next) } });
  return next;
}

/** Unique slug for sellers / products / categories */
export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>) {
  const root = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'item';
  let slug = root;
  for (let i = 2; await exists(slug); i++) slug = `${root}-${i}`;
  return slug;
}
