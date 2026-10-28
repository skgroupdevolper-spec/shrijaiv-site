// Razorpay (all-India payments: UPI, cards, net banking, wallets, EMI) — orders, subscriptions, signatures.
// Keys come from Admin → Plans & payments (Setting "payments") or the environment.
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { periodEnd } from './plans';
import { getMarketplace } from './settings';
import { notifyAdmins, notifyUser, emailHtml } from './notify';
import { sendMail } from '@/lib/mail';

export type PaymentSettings = {
  provider: 'razorpay' | 'manual';
  razorpayKeyId: string;
  razorpayKeySecret: string;
  razorpayWebhookSecret: string;
  manualInstructions: string; // bank transfer text shown when provider = manual
  invoicePrefix: string;
  companyName: string;
  companyAddress: string;
  companyGstin: string;
};

export const defaultPayments: PaymentSettings = {
  provider: 'razorpay',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  manualInstructions: '',
  invoicePrefix: 'SJV',
  companyName: 'SHRIJAIV Organic',
  companyAddress: '',
  companyGstin: '',
};

export async function getPayments(): Promise<PaymentSettings> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: 'payments' } });
    return { ...defaultPayments, ...(row ? JSON.parse(row.value) : {}) };
  } catch {
    return defaultPayments;
  }
}

export async function savePayments(patch: Partial<PaymentSettings>) {
  const cur = await getPayments();
  const next = { ...cur, ...patch };
  for (const k of ['razorpayKeySecret', 'razorpayWebhookSecret'] as const) if (String((patch as any)[k] || '').includes('••••')) next[k] = cur[k];
  await prisma.setting.upsert({ where: { key: 'payments' }, update: { value: JSON.stringify(next) }, create: { key: 'payments', value: JSON.stringify(next) } });
  return next;
}

export function maskPayments(p: PaymentSettings) {
  const m = (v: string) => (v ? `••••${v.slice(-4)}` : '');
  return { ...p, razorpayKeySecret: m(p.razorpayKeySecret), razorpayWebhookSecret: m(p.razorpayWebhookSecret) };
}

async function rz(path: string, method: 'GET' | 'POST', body?: any) {
  const p = await getPayments();
  if (!p.razorpayKeyId || !p.razorpayKeySecret) throw new Error('Razorpay keys are not configured (Admin → Plans & payments)');
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: { Authorization: 'Basic ' + Buffer.from(`${p.razorpayKeyId}:${p.razorpayKeySecret}`).toString('base64'), 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j?.error?.description || `Razorpay error ${res.status}`);
  return j;
}

export function hmac(secret: string, payload: string) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/** Amount incl. GST in paise */
export function totalPaise(price: number, gstPercent: number, discount = 0) {
  const base = Math.max(0, price - discount);
  const gst = Math.round(base * gstPercent) / 100;
  return { base, gst, total: Math.round((base + gst) * 100) / 100, paise: Math.round((base + gst) * 100) };
}

export async function applyCoupon(code: string | undefined, planId: string, price: number) {
  if (!code) return { discount: 0, coupon: null };
  const c = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  const now = new Date();
  if (!c || !c.active || (c.startsAt && c.startsAt > now) || (c.endsAt && c.endsAt < now) || (c.maxUses && c.used >= c.maxUses)) throw new Error('This coupon is not valid');
  const plans: string[] = JSON.parse(c.planIds || '[]');
  if (plans.length && !plans.includes(planId)) throw new Error('This coupon does not apply to this plan');
  const discount = c.type === 'percent' ? Math.round(price * c.value) / 100 : Math.min(price, c.value);
  return { discount, coupon: c };
}

/** Razorpay plan id for auto-renewal (created once per plan + price) */
export async function ensureRazorpayPlan(plan: { id: string; name: string; price: number; period: string; periodDays: number | null; razorpayPlanId: string | null }, amountPaise: number) {
  if (plan.razorpayPlanId) return plan.razorpayPlanId;
  const map: Record<string, { period: string; interval: number }> = { monthly: { period: 'monthly', interval: 1 }, quarterly: { period: 'monthly', interval: 3 }, yearly: { period: 'yearly', interval: 1 }, custom: { period: 'daily', interval: plan.periodDays || 30 } };
  const cfg = map[plan.period];
  if (!cfg) throw new Error('Lifetime plans cannot auto-renew');
  const j = await rz('/plans', 'POST', { period: cfg.period, interval: cfg.interval, item: { name: `SHRIJAIV ${plan.name}`, amount: amountPaise, currency: 'INR' } });
  await prisma.plan.update({ where: { id: plan.id }, data: { razorpayPlanId: j.id } });
  return j.id as string;
}

export async function createOrder(amountPaise: number, receipt: string, notes: Record<string, string>) {
  return rz('/orders', 'POST', { amount: amountPaise, currency: 'INR', receipt, notes });
}

export async function createSubscription(razorpayPlanId: string, notes: Record<string, string>, totalCount = 120) {
  return rz('/subscriptions', 'POST', { plan_id: razorpayPlanId, total_count: totalCount, customer_notify: 1, notes });
}

export async function cancelRazorpaySubscription(id: string) {
  try {
    await rz(`/subscriptions/${id}/cancel`, 'POST', { cancel_at_cycle_end: 1 });
  } catch (e) {
    console.error('[razorpay] cancel failed', (e as Error).message);
  }
}

export async function nextInvoiceNo() {
  const p = await getPayments();
  const y = new Date().getFullYear();
  const count = await prisma.payment.count({ where: { invoiceNo: { startsWith: `${p.invoicePrefix}-${y}` } } });
  return `${p.invoicePrefix}-${y}-${String(count + 1).padStart(5, '0')}`;
}

/** Activates (or renews) a seller's plan after a successful payment or a free/manual activation */
export async function activatePlan(opts: { sellerId: string; planId: string; autoRenew: boolean; source: 'razorpay' | 'manual' | 'free'; razorpaySubscriptionId?: string | null; payment?: { amount: number; gst: number; providerOrderId?: string; providerPaymentId?: string; method?: string; couponCode?: string; raw?: any } }) {
  const plan = await prisma.plan.findUnique({ where: { id: opts.planId } });
  if (!plan) throw new Error('Plan not found');
  const now = new Date();
  // extend an existing running subscription of the same plan, otherwise start fresh
  const current = await prisma.subscription.findFirst({ where: { sellerId: opts.sellerId, status: { in: ['active', 'trial', 'past_due'] } }, orderBy: { createdAt: 'desc' } });
  const start = current && current.planId === plan.id && current.endsAt && current.endsAt > now ? current.endsAt : now;
  const endsAt = periodEnd(start, plan.period, plan.periodDays);
  let sub;
  if (current && current.planId === plan.id) {
    sub = await prisma.subscription.update({ where: { id: current.id }, data: { status: 'active', endsAt, autoRenew: opts.autoRenew, razorpaySubscriptionId: opts.razorpaySubscriptionId ?? current.razorpaySubscriptionId, source: opts.source, cancelledAt: null, renewalReminderAt: null } });
  } else {
    if (current) await prisma.subscription.update({ where: { id: current.id }, data: { status: 'cancelled', cancelledAt: now } });
    sub = await prisma.subscription.create({ data: { sellerId: opts.sellerId, planId: plan.id, status: plan.trialDays && !opts.payment ? 'trial' : 'active', autoRenew: opts.autoRenew, startsAt: now, endsAt: plan.trialDays && !opts.payment && plan.price > 0 ? new Date(now.getTime() + plan.trialDays * 86_400_000) : endsAt, razorpaySubscriptionId: opts.razorpaySubscriptionId || null, source: opts.source } });
  }
  let payment = null;
  if (opts.payment) {
    payment = await prisma.payment.create({ data: { subscriptionId: sub.id, amount: opts.payment.amount, gst: opts.payment.gst, status: 'paid', provider: opts.source === 'manual' ? 'manual' : 'razorpay', providerOrderId: opts.payment.providerOrderId || null, providerPaymentId: opts.payment.providerPaymentId || null, method: opts.payment.method || null, invoiceNo: await nextInvoiceNo(), couponCode: opts.payment.couponCode || null, raw: opts.payment.raw ? JSON.stringify(opts.payment.raw).slice(0, 20000) : null, paidAt: now } });
    if (opts.payment.couponCode) prisma.coupon.update({ where: { code: opts.payment.couponCode }, data: { used: { increment: 1 } } }).catch(() => null);
  }
  // badges that come with the plan
  if (plan.verifiedBadge) {
    const seller = await prisma.sellerProfile.findUnique({ where: { id: opts.sellerId }, select: { verified: true, certifications: true } });
    if (seller && !seller.verified && JSON.parse(seller.certifications || '[]').length) await notifyAdmins({ type: 'seller', title: 'Paid seller waiting for verification', href: `/admin/sellers/${opts.sellerId}` });
  }
  const seller = await prisma.sellerProfile.findUnique({ where: { id: opts.sellerId }, include: { user: { select: { email: true, id: true } } } });
  if (seller) {
    await notifyUser(seller.user.id, { type: 'plan', title: `${plan.name} plan is active${sub.endsAt ? ` until ${sub.endsAt.toLocaleDateString('en-IN')}` : ''}`, href: '/seller/membership' });
    await notifyAdmins({ type: 'payment', title: `${seller.companyName} → ${plan.name}${payment ? ` · ₹${(payment.amount + payment.gst).toLocaleString('en-IN')}` : ''}`, href: `/admin/sellers/${opts.sellerId}` });
    if (payment && seller.user.email) sendMail({ to: seller.user.email, subject: `Invoice ${payment.invoiceNo} — ${plan.name} plan`, html: await emailHtml('Payment received — thank you!', `Your ${plan.name} plan is active${sub.endsAt ? ` until ${sub.endsAt.toLocaleDateString('en-IN')}` : ''}.`, [['Invoice', payment.invoiceNo], ['Plan', plan.name], ['Amount', `₹${payment.amount.toLocaleString('en-IN')}`], ['GST', `₹${payment.gst.toLocaleString('en-IN')}`], ['Total', `₹${(payment.amount + payment.gst).toLocaleString('en-IN')}`], ['Auto-renewal', opts.autoRenew ? 'On' : 'Off']], { label: 'View invoice', href: `/seller/membership/invoice/${payment.id}` }) }).catch(() => null);
  }
  return { sub, payment, plan };
}

/** Daily: expire ended plans (after grace days), send renewal reminders. Called by /api/cron/plans and on server start. */
export async function planMaintenance() {
  const mp = await getMarketplace();
  const now = new Date();
  const reminderAt = new Date(now.getTime() + mp.renewalReminderDays * 86_400_000);
  const ending = await prisma.subscription.findMany({ where: { status: { in: ['active', 'trial'] }, endsAt: { lte: reminderAt, gt: now }, renewalReminderAt: null }, include: { plan: true, seller: { include: { user: { select: { email: true, id: true } } } } } });
  for (const s of ending) {
    await prisma.subscription.update({ where: { id: s.id }, data: { renewalReminderAt: now } });
    await notifyUser(s.seller.user.id, { type: 'plan', title: `${s.plan.name} plan ends on ${s.endsAt!.toLocaleDateString('en-IN')}`, body: s.autoRenew ? 'It will renew automatically.' : 'Renew now to keep your products live.', href: '/seller/membership' });
    if (!s.autoRenew && s.seller.user.email) sendMail({ to: s.seller.user.email, subject: `Your ${s.plan.name} plan ends on ${s.endsAt!.toLocaleDateString('en-IN')}`, html: await emailHtml('Your plan is ending soon', `Renew now to keep all your products, buyer contacts and the Verified badge.`, [['Plan', s.plan.name], ['Ends', s.endsAt!.toLocaleDateString('en-IN')]], { label: 'Renew plan', href: '/seller/membership' }) }).catch(() => null);
  }
  const grace = new Date(now.getTime() - mp.graceDays * 86_400_000);
  const expired = await prisma.subscription.findMany({ where: { status: { in: ['active', 'trial', 'past_due'] }, endsAt: { lt: grace } }, include: { plan: true, seller: { include: { user: { select: { email: true, id: true } } } } } });
  for (const s of expired) {
    await prisma.subscription.update({ where: { id: s.id }, data: { status: 'expired' } });
    await notifyUser(s.seller.user.id, { type: 'plan', title: `${s.plan.name} plan expired`, body: 'Choose a plan to restore all features.', href: '/seller/membership' });
  }
  return { reminded: ending.length, expired: expired.length };
}
