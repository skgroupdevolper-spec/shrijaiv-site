import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireSeller } from '@/lib/auth';
import { entitlements } from '@/lib/marketplace/plans';
import { notifyAdmins } from '@/lib/marketplace/notify';
import { deliverQuote } from '@/lib/marketplace/quotes';
import { inr } from '@/lib/marketplace/format';
import { getMarketplace } from '@/lib/marketplace/settings';

type P = { params: Promise<{ id: string }> };

/** Send (or update) a quote on a buyer requirement */
export async function POST(req: Request, { params }: P) {
  const ctx = await requireSeller();
  if (!ctx) return fail('Unauthorized', 401);
  if (ctx.seller.status !== 'approved') return fail('Your seller account must be approved before quoting');
  const { id } = await params;
  const r = await prisma.requirement.findFirst({ where: { id, status: 'open' }, include: { buyer: { include: { user: { select: { email: true, name: true } } } } } });
  if (!r) return fail('This requirement is closed');
  const existing = await prisma.quote.findUnique({ where: { requirementId_sellerId: { requirementId: id, sellerId: ctx.seller.id } } });
  if (!existing) {
    const e = await entitlements(ctx.seller.id);
    if (e.paidPlans && e.maxQuotes >= 0) {
      const since = new Date();
      since.setDate(1);
      since.setHours(0, 0, 0, 0);
      const used = await prisma.quote.count({ where: { sellerId: ctx.seller.id, createdAt: { gte: since } } });
      if (used >= e.maxQuotes) return fail(`Your plan allows ${e.maxQuotes} quotes per month. Upgrade to send more.`, 403);
    }
  }
  const b = await req.json().catch(() => ({}));
  const held = !!(await getMarketplace()).approval?.quotes;
  const data = {
    price: b.price === '' || b.price == null ? null : Math.max(0, Number(b.price) || 0),
    priceUnit: b.priceUnit ? String(b.priceUnit).slice(0, 40) : null,
    quantity: b.quantity ? String(b.quantity).slice(0, 120) : null,
    deliveryTime: b.deliveryTime ? String(b.deliveryTime).slice(0, 120) : null,
    message: b.message ? String(b.message).slice(0, 3000) : null,
    attachments: JSON.stringify(Array.isArray(b.attachments) ? b.attachments.filter((x: any) => typeof x === 'string').slice(0, 5) : []),
    status: held ? 'review' : 'sent',
    seenByBuyer: false,
  };
  const quote = existing ? await prisma.quote.update({ where: { id: existing.id }, data }) : await prisma.quote.create({ data: { ...data, requirementId: id, sellerId: ctx.seller.id } });
  if (!existing && !held) await prisma.requirement.update({ where: { id }, data: { quoteCount: { increment: 1 } } });
  const rows: [string, string | null | undefined][] = [['Requirement', r.title], ['Seller', ctx.seller.companyName], ['Price', data.price != null ? `${inr(data.price)} ${data.priceUnit || ''}` : 'On request'], ['Delivery', data.deliveryTime], ['Message', data.message]];
  await notifyAdmins({ type: 'quote', title: `${held ? 'Review: ' : ''}Quote: ${ctx.seller.companyName} → ${r.title}`, href: held ? '/admin/review' : `/admin/requirements/${id}` });
  if (!held) await deliverQuote(quote.id);
  return ok({ item: quote, held });
}
