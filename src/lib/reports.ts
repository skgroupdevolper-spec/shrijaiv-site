// Reports for every dashboard (admin, seller, buyer). One engine builds the data; the same report
// is shown on screen, printed / saved as PDF, or downloaded as Excel (.xlsx) or CSV.
import { prisma } from '@/lib/db';

export type Scope = { role: 'admin' } | { role: 'seller'; sellerId: string; name: string } | { role: 'buyer'; buyerId: string; name: string };
export type Cell = string | number | null;
export type Section = { title: string; columns: string[]; rows: Cell[][] };
export type Report = { title: string; subtitle: string; period: string; generatedAt: string; summary: { label: string; value: string }[]; sections: Section[] };
export type ReportType = { key: string; label: string; description: string };

export const REPORT_TYPES: Record<Scope['role'], ReportType[]> = {
  admin: [
    { key: 'overview', label: 'Marketplace overview', description: 'All key numbers, top sellers and categories, activity by day' },
    { key: 'sellers', label: 'Sellers', description: 'Every seller with status, plan, products, inquiries and rating' },
    { key: 'buyers', label: 'Buyers', description: 'Buyer accounts with requirements, inquiries and reviews' },
    { key: 'products', label: 'Products', description: 'Products with seller, category, price, views and inquiries' },
    { key: 'inquiries', label: 'Inquiries', description: 'Buyer → seller inquiries with status' },
    { key: 'requirements', label: 'Buy leads', description: 'Requirements posted by buyers and quotes received' },
    { key: 'quotes', label: 'Quotes', description: 'Seller quotes on buy leads' },
    { key: 'revenue', label: 'Revenue & payments', description: 'Paid invoices, GST and totals per plan' },
    { key: 'subscriptions', label: 'Memberships', description: 'Active, trial and expired plans' },
    { key: 'reviews', label: 'Ratings & reviews', description: 'Reviews with rating and status' },
    { key: 'leads', label: 'Contact messages', description: 'Contact-form and inquiry-page messages' },
  ],
  seller: [
    { key: 'overview', label: 'Business overview', description: 'Views, inquiries, quotes, rating and best products' },
    { key: 'products', label: 'My products', description: 'Every product with price, views and inquiries' },
    { key: 'inquiries', label: 'Inquiries received', description: 'Buyer inquiries with status' },
    { key: 'quotes', label: 'My quotes', description: 'Quotes you sent on buy leads' },
    { key: 'reviews', label: 'My reviews', description: 'Ratings and reviews from buyers' },
    { key: 'payments', label: 'Invoices', description: 'Membership payments and GST invoices' },
  ],
  buyer: [
    { key: 'overview', label: 'Sourcing overview', description: 'Requirements, quotes and inquiries at a glance' },
    { key: 'requirements', label: 'My requirements', description: 'Buy leads you posted and quotes received' },
    { key: 'quotes', label: 'Quotes received', description: 'Every quote with seller, price and delivery' },
    { key: 'inquiries', label: 'My inquiries', description: 'Inquiries you sent to sellers' },
    { key: 'reviews', label: 'My reviews', description: 'Reviews you wrote' },
  ],
};

const inr = (n?: number | null) => (n == null ? '' : `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
const d = (x?: Date | string | null) => (x ? new Date(x).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
const num = (n: number) => n.toLocaleString('en-IN');
const HIDE = ['review', 'rejected'];

export function parseRange(from?: string | null, to?: string | null) {
  const start = from ? new Date(from) : null;
  const end = to ? new Date(to) : null;
  if (end) end.setHours(23, 59, 59, 999);
  const ok = (x: Date | null) => (x && !isNaN(+x) ? x : null);
  return { start: ok(start), end: ok(end) };
}

function dateWhere(field: string, start: Date | null, end: Date | null) {
  if (!start && !end) return {};
  return { [field]: { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) } };
}

function byDay(dates: Date[], start: Date | null, end: Date | null): Cell[][] {
  const map = new Map<string, number>();
  for (const x of dates) {
    const k = x.toISOString().slice(0, 10);
    map.set(k, (map.get(k) || 0) + 1);
  }
  const keys = [...map.keys()].sort();
  if (!keys.length) return [];
  const s = start || new Date(keys[0]);
  const e = end || new Date(keys[keys.length - 1]);
  const out: Cell[][] = [];
  const days = Math.min(400, Math.ceil((+e - +s) / 86_400_000) + 1);
  for (let i = 0; i < days; i++) {
    const k = new Date(+s + i * 86_400_000).toISOString().slice(0, 10);
    if (map.get(k)) out.push([d(k), map.get(k) || 0]);
  }
  return out;
}

export async function buildReport(scope: Scope, type: string, from?: string | null, to?: string | null): Promise<Report> {
  const { start, end } = parseRange(from, to);
  const at = (f: string) => dateWhere(f, start, end);
  const types = REPORT_TYPES[scope.role];
  const meta = types.find((t) => t.key === type) || types[0];
  const period = start || end ? `${start ? d(start) : 'Start'} – ${end ? d(end) : 'Today'}` : 'All time';
  const r: Report = { title: meta.label, subtitle: scope.role === 'admin' ? 'SHRIJAIV Organic — admin report' : `${scope.name} — ${scope.role} report`, period, generatedAt: new Date().toLocaleString('en-IN'), summary: [], sections: [] };

  /* ------------------------------------------------------------------ admin */
  if (scope.role === 'admin') {
    switch (meta.key) {
      case 'overview': {
        const [sellers, newSellers, buyers, newBuyers, products, inquiries, requirements, quotes, reviews, paid, inqDates, cats, top] = await Promise.all([
          prisma.sellerProfile.count({ where: { status: 'approved' } }),
          prisma.sellerProfile.count({ where: at('createdAt') }),
          prisma.buyerProfile.count(),
          prisma.buyerProfile.count({ where: at('createdAt') }),
          prisma.product.count({ where: { status: 'approved' } }),
          prisma.inquiry.count({ where: at('createdAt') }),
          prisma.requirement.count({ where: at('createdAt') }),
          prisma.quote.count({ where: at('createdAt') }),
          prisma.review.count({ where: { status: 'approved', ...at('createdAt') } }),
          prisma.payment.aggregate({ where: { status: 'paid', ...at('paidAt') }, _sum: { amount: true, gst: true }, _count: true }),
          prisma.inquiry.findMany({ where: at('createdAt'), select: { createdAt: true } }),
          prisma.category.findMany({ where: { parentId: null }, select: { name: true, children: { select: { id: true } }, id: true } }),
          prisma.sellerProfile.findMany({ where: { status: 'approved' }, orderBy: { views: 'desc' }, take: 10, select: { companyName: true, state: true, views: true, ratingAvg: true, ratingCount: true, _count: { select: { products: true, inquiries: true } } } }),
        ]);
        r.summary = [
          { label: 'Active sellers', value: num(sellers) },
          { label: 'New sellers', value: num(newSellers) },
          { label: 'Buyers', value: num(buyers) },
          { label: 'New buyers', value: num(newBuyers) },
          { label: 'Live products', value: num(products) },
          { label: 'Inquiries', value: num(inquiries) },
          { label: 'Buy leads', value: num(requirements) },
          { label: 'Quotes', value: num(quotes) },
          { label: 'Reviews', value: num(reviews) },
          { label: 'Revenue (excl. GST)', value: inr(paid._sum.amount || 0) },
          { label: 'GST collected', value: inr(paid._sum.gst || 0) },
          { label: 'Paid invoices', value: num(paid._count) },
        ];
        const catRows: Cell[][] = [];
        for (const c of cats) {
          const ids = [c.id, ...c.children.map((x) => x.id)];
          const [p, i, q] = await Promise.all([
            prisma.product.count({ where: { status: 'approved', categoryId: { in: ids } } }),
            prisma.inquiry.count({ where: { product: { categoryId: { in: ids } }, ...at('createdAt') } }),
            prisma.requirement.count({ where: { categoryId: { in: ids }, ...at('createdAt') } }),
          ]);
          catRows.push([c.name, p, i, q]);
        }
        r.sections.push({ title: 'By category', columns: ['Category', 'Live products', 'Inquiries', 'Buy leads'], rows: catRows });
        r.sections.push({ title: 'Top sellers (by showroom views)', columns: ['Seller', 'State', 'Products', 'Inquiries', 'Views', 'Rating'], rows: top.map((s) => [s.companyName, s.state || '', s._count.products, s._count.inquiries, s.views, s.ratingCount ? `${s.ratingAvg.toFixed(1)} (${s.ratingCount})` : '']) });
        r.sections.push({ title: 'Inquiries per day', columns: ['Date', 'Inquiries'], rows: byDay(inqDates.map((x) => x.createdAt), start, end) });
        break;
      }
      case 'sellers': {
        const rows = await prisma.sellerProfile.findMany({ where: at('createdAt'), orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true, phone: true } }, _count: { select: { products: true, inquiries: true, quotes: true } }, subscriptions: { where: { status: { in: ['active', 'trial'] } }, take: 1, include: { plan: { select: { name: true } } } } } });
        r.summary = [{ label: 'Sellers', value: num(rows.length) }, { label: 'Approved', value: num(rows.filter((x) => x.status === 'approved').length) }, { label: 'Pending', value: num(rows.filter((x) => x.status === 'pending').length) }, { label: 'Verified', value: num(rows.filter((x) => x.verified).length) }];
        r.sections.push({ title: 'Sellers', columns: ['Joined', 'Company', 'Owner', 'Email', 'Phone', 'Type', 'City', 'State', 'GST', 'Status', 'Verified', 'Plan', 'Products', 'Inquiries', 'Quotes', 'Rating'], rows: rows.map((s) => [d(s.createdAt), s.companyName, s.user.name, s.user.email, s.user.phone || '', s.businessType || '', s.city || '', s.state || '', s.gstNumber || '', s.status, s.verified ? 'Yes' : 'No', s.subscriptions[0]?.plan.name || 'Free', s._count.products, s._count.inquiries, s._count.quotes, s.ratingCount ? s.ratingAvg.toFixed(1) : '']) });
        break;
      }
      case 'buyers': {
        const rows = await prisma.buyerProfile.findMany({ where: at('createdAt'), orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true, phone: true } }, _count: { select: { requirements: true, inquiries: true, reviews: true } } } });
        r.summary = [{ label: 'Buyers', value: num(rows.length) }, { label: 'Verified', value: num(rows.filter((x) => x.verified).length) }, { label: 'With buy leads', value: num(rows.filter((x) => x._count.requirements > 0).length) }];
        r.sections.push({ title: 'Buyers', columns: ['Joined', 'Name', 'Company', 'Email', 'Phone', 'Type', 'City', 'State', 'Status', 'Buy leads', 'Inquiries', 'Reviews'], rows: rows.map((b) => [d(b.createdAt), b.user.name, b.companyName || '', b.user.email, b.user.phone || '', b.buyerType || '', b.city || '', b.state || '', b.status, b._count.requirements, b._count.inquiries, b._count.reviews]) });
        break;
      }
      case 'products': {
        const rows = await prisma.product.findMany({ where: at('createdAt'), orderBy: { createdAt: 'desc' }, include: { seller: { select: { companyName: true } }, category: { select: { name: true } } } });
        r.summary = [{ label: 'Products', value: num(rows.length) }, { label: 'Approved', value: num(rows.filter((x) => x.status === 'approved').length) }, { label: 'Pending', value: num(rows.filter((x) => x.status === 'pending').length) }, { label: 'Total views', value: num(rows.reduce((a, x) => a + x.views, 0)) }, { label: 'Total inquiries', value: num(rows.reduce((a, x) => a + x.inquiryCount, 0)) }];
        r.sections.push({ title: 'Products', columns: ['Added', 'Product', 'Seller', 'Category', 'Price from', 'Price to', 'Unit', 'MOQ', 'Status', 'Featured', 'Views', 'Inquiries', 'Rating'], rows: rows.map((p) => [d(p.createdAt), p.name, p.seller.companyName, p.category?.name || '', p.priceMin, p.priceMax, p.priceUnit || '', p.moq || '', p.status, p.featured ? 'Yes' : 'No', p.views, p.inquiryCount, p.ratingCount ? p.ratingAvg.toFixed(1) : '']) });
        break;
      }
      case 'inquiries': {
        const rows = await prisma.inquiry.findMany({ where: at('createdAt'), orderBy: { createdAt: 'desc' }, include: { seller: { select: { companyName: true } }, product: { select: { name: true } } } });
        const st = (s: string) => rows.filter((x) => x.status === s).length;
        r.summary = [{ label: 'Inquiries', value: num(rows.length) }, { label: 'Waiting for review', value: num(st('review')) }, { label: 'New', value: num(st('new')) }, { label: 'Replied', value: num(st('replied')) }, { label: 'Closed', value: num(st('closed')) }];
        r.sections.push({ title: 'Inquiries', columns: ['Date', 'Ref', 'Buyer', 'Email', 'Phone', 'City', 'Seller', 'Product', 'Quantity', 'Status', 'Message'], rows: rows.map((q) => [d(q.createdAt), q.refNo, q.name, q.email || '', q.phone || '', q.city || '', q.seller.companyName, q.product?.name || 'General', q.quantity || '', q.status, q.message.slice(0, 300)]) });
        break;
      }
      case 'requirements': {
        const rows = await prisma.requirement.findMany({ where: at('createdAt'), orderBy: { createdAt: 'desc' }, include: { buyer: { include: { user: { select: { name: true, email: true } } } }, category: { select: { name: true } } } });
        r.summary = [{ label: 'Buy leads', value: num(rows.length) }, { label: 'Open', value: num(rows.filter((x) => x.status === 'open').length) }, { label: 'Quotes received', value: num(rows.reduce((a, x) => a + x.quoteCount, 0)) }];
        r.sections.push({ title: 'Buy leads', columns: ['Posted', 'Title', 'Category', 'Quantity', 'Budget', 'Delivery', 'Buyer', 'Email', 'Status', 'Quotes', 'Views'], rows: rows.map((q) => [d(q.createdAt), q.title, q.category?.name || '', [q.quantity, q.unit].filter(Boolean).join(' '), [inr(q.budgetMin), inr(q.budgetMax)].filter(Boolean).join(' – '), [q.deliveryCity, q.deliveryState].filter(Boolean).join(', '), q.buyer.user.name, q.buyer.user.email, q.status, q.quoteCount, q.views]) });
        break;
      }
      case 'quotes': {
        const rows = await prisma.quote.findMany({ where: at('createdAt'), orderBy: { createdAt: 'desc' }, include: { seller: { select: { companyName: true } }, requirement: { select: { title: true } } } });
        r.summary = [{ label: 'Quotes', value: num(rows.length) }, { label: 'Accepted', value: num(rows.filter((x) => x.status === 'accepted').length) }, { label: 'Waiting for review', value: num(rows.filter((x) => x.status === 'review').length) }];
        r.sections.push({ title: 'Quotes', columns: ['Date', 'Buy lead', 'Seller', 'Price', 'Unit', 'Quantity', 'Delivery', 'Status'], rows: rows.map((q) => [d(q.createdAt), q.requirement.title, q.seller.companyName, q.price, q.priceUnit || '', q.quantity || '', q.deliveryTime || '', q.status]) });
        break;
      }
      case 'revenue': {
        const rows = await prisma.payment.findMany({ where: { status: 'paid', ...at('paidAt') }, orderBy: { paidAt: 'desc' }, include: { subscription: { select: { seller: { select: { companyName: true, gstNumber: true } }, plan: { select: { name: true } } } } } });
        const amount = rows.reduce((a, x) => a + x.amount, 0);
        const gst = rows.reduce((a, x) => a + x.gst, 0);
        r.summary = [{ label: 'Paid invoices', value: num(rows.length) }, { label: 'Revenue (excl. GST)', value: inr(amount) }, { label: 'GST', value: inr(gst) }, { label: 'Total collected', value: inr(amount + gst) }];
        const perPlan = new Map<string, { n: number; a: number }>();
        for (const p of rows) {
          const k = p.subscription?.plan.name || 'Other';
          const v = perPlan.get(k) || { n: 0, a: 0 };
          perPlan.set(k, { n: v.n + 1, a: v.a + p.amount });
        }
        r.sections.push({ title: 'By plan', columns: ['Plan', 'Invoices', 'Revenue'], rows: [...perPlan.entries()].map(([k, v]) => [k, v.n, inr(v.a)]) });
        r.sections.push({ title: 'Invoices', columns: ['Paid on', 'Invoice', 'Seller', 'Seller GST', 'Plan', 'Amount', 'GST', 'Total', 'Method'], rows: rows.map((p) => [d(p.paidAt), p.invoiceNo || '', p.subscription?.seller.companyName || '', p.subscription?.seller.gstNumber || '', p.subscription?.plan.name || '', p.amount, p.gst, p.amount + p.gst, p.method || p.provider || '']) });
        break;
      }
      case 'subscriptions': {
        const rows = await prisma.subscription.findMany({ where: at('startsAt'), orderBy: { startsAt: 'desc' }, include: { seller: { select: { companyName: true } }, plan: { select: { name: true, price: true } } } });
        r.summary = [{ label: 'Memberships', value: num(rows.length) }, { label: 'Active', value: num(rows.filter((x) => x.status === 'active').length) }, { label: 'Trial', value: num(rows.filter((x) => x.status === 'trial').length) }, { label: 'Auto-renew on', value: num(rows.filter((x) => x.autoRenew).length) }];
        r.sections.push({ title: 'Memberships', columns: ['Started', 'Ends', 'Seller', 'Plan', 'Price', 'Status', 'Auto-renew', 'Source'], rows: rows.map((x) => [d(x.startsAt), d(x.endsAt), x.seller.companyName, x.plan.name, inr(x.plan.price), x.status, x.autoRenew ? 'Yes' : 'No', x.source]) });
        break;
      }
      case 'reviews': {
        const rows = await prisma.review.findMany({ where: at('createdAt'), orderBy: { createdAt: 'desc' }, include: { seller: { select: { companyName: true } }, product: { select: { name: true } } } });
        const avg = rows.length ? rows.reduce((a, x) => a + x.rating, 0) / rows.length : 0;
        r.summary = [{ label: 'Reviews', value: num(rows.length) }, { label: 'Average rating', value: avg ? avg.toFixed(2) : '—' }, { label: 'Pending', value: num(rows.filter((x) => x.status === 'pending').length) }];
        r.sections.push({ title: 'Reviews', columns: ['Date', 'Author', 'Seller', 'Product', 'Rating', 'Status', 'Verified buyer', 'Review'], rows: rows.map((x) => [d(x.createdAt), x.authorName, x.seller.companyName, x.product?.name || '', x.rating, x.status, x.verifiedPurchase ? 'Yes' : 'No', x.body.slice(0, 300)]) });
        break;
      }
      case 'leads': {
        const rows = await prisma.lead.findMany({ where: at('createdAt'), orderBy: { createdAt: 'desc' } });
        r.summary = [{ label: 'Messages', value: num(rows.length) }, { label: 'New', value: num(rows.filter((x) => x.status === 'new').length) }];
        r.sections.push({ title: 'Contact messages', columns: ['Date', 'Name', 'Email', 'Phone', 'Location', 'Subject', 'Status', 'Message'], rows: rows.map((x) => [d(x.createdAt), x.name, x.email || '', x.phone || '', x.nationality || '', x.service || '', x.status, (x.message || '').slice(0, 300)]) });
        break;
      }
    }
    return r;
  }

  /* ------------------------------------------------------------------ seller */
  if (scope.role === 'seller') {
    const sellerId = scope.sellerId;
    const vis = { status: { notIn: HIDE } };
    switch (meta.key) {
      case 'overview': {
        const [s, products, inq, inqDates, quotes, accepted, reviews, top] = await Promise.all([
          prisma.sellerProfile.findUnique({ where: { id: sellerId }, select: { views: true, ratingAvg: true, ratingCount: true } }),
          prisma.product.findMany({ where: { sellerId }, select: { views: true, status: true } }),
          prisma.inquiry.count({ where: { sellerId, ...vis, ...at('createdAt') } }),
          prisma.inquiry.findMany({ where: { sellerId, ...vis, ...at('createdAt') }, select: { createdAt: true } }),
          prisma.quote.count({ where: { sellerId, ...at('createdAt') } }),
          prisma.quote.count({ where: { sellerId, status: 'accepted', ...at('createdAt') } }),
          prisma.review.count({ where: { sellerId, status: 'approved', ...at('createdAt') } }),
          prisma.product.findMany({ where: { sellerId }, orderBy: { inquiryCount: 'desc' }, take: 10, select: { name: true, views: true, inquiryCount: true, ratingAvg: true, ratingCount: true, status: true } }),
        ]);
        r.summary = [
          { label: 'Showroom views', value: num(s?.views || 0) },
          { label: 'Product views', value: num(products.reduce((a, p) => a + p.views, 0)) },
          { label: 'Live products', value: num(products.filter((p) => p.status === 'approved').length) },
          { label: 'Inquiries', value: num(inq) },
          { label: 'Quotes sent', value: num(quotes) },
          { label: 'Quotes accepted', value: num(accepted) },
          { label: 'New reviews', value: num(reviews) },
          { label: 'Rating', value: s?.ratingCount ? `${s.ratingAvg.toFixed(1)} (${s.ratingCount})` : '—' },
        ];
        r.sections.push({ title: 'Best products', columns: ['Product', 'Status', 'Views', 'Inquiries', 'Rating'], rows: top.map((p) => [p.name, p.status, p.views, p.inquiryCount, p.ratingCount ? p.ratingAvg.toFixed(1) : '']) });
        r.sections.push({ title: 'Inquiries per day', columns: ['Date', 'Inquiries'], rows: byDay(inqDates.map((x) => x.createdAt), start, end) });
        break;
      }
      case 'products': {
        const rows = await prisma.product.findMany({ where: { sellerId, ...at('createdAt') }, orderBy: { createdAt: 'desc' }, include: { category: { select: { name: true } } } });
        r.summary = [{ label: 'Products', value: num(rows.length) }, { label: 'Live', value: num(rows.filter((x) => x.status === 'approved').length) }, { label: 'Views', value: num(rows.reduce((a, x) => a + x.views, 0)) }, { label: 'Inquiries', value: num(rows.reduce((a, x) => a + x.inquiryCount, 0)) }];
        r.sections.push({ title: 'Products', columns: ['Added', 'Product', 'Category', 'Price from', 'Price to', 'Unit', 'MOQ', 'Status', 'Views', 'Inquiries', 'Rating'], rows: rows.map((p) => [d(p.createdAt), p.name, p.category?.name || '', p.priceMin, p.priceMax, p.priceUnit || '', p.moq || '', p.status, p.views, p.inquiryCount, p.ratingCount ? p.ratingAvg.toFixed(1) : '']) });
        break;
      }
      case 'inquiries': {
        const rows = await prisma.inquiry.findMany({ where: { sellerId, ...vis, ...at('createdAt') }, orderBy: { createdAt: 'desc' }, include: { product: { select: { name: true } } } });
        r.summary = [{ label: 'Inquiries', value: num(rows.length) }, { label: 'New', value: num(rows.filter((x) => x.status === 'new').length) }, { label: 'Replied', value: num(rows.filter((x) => x.status === 'replied').length) }];
        r.sections.push({ title: 'Inquiries', columns: ['Date', 'Ref', 'Buyer', 'Email', 'Phone', 'City', 'Product', 'Quantity', 'Status'], rows: rows.map((q) => [d(q.createdAt), q.refNo, q.name, q.contactUnlocked ? q.email || '' : 'hidden', q.contactUnlocked ? q.phone || '' : 'hidden', q.city || '', q.product?.name || 'General', q.quantity || '', q.status]) });
        break;
      }
      case 'quotes': {
        const rows = await prisma.quote.findMany({ where: { sellerId, ...at('createdAt') }, orderBy: { createdAt: 'desc' }, include: { requirement: { select: { title: true, deliveryState: true } } } });
        r.summary = [{ label: 'Quotes', value: num(rows.length) }, { label: 'Accepted', value: num(rows.filter((x) => x.status === 'accepted').length) }, { label: 'Shortlisted', value: num(rows.filter((x) => x.status === 'shortlisted').length) }];
        r.sections.push({ title: 'Quotes', columns: ['Date', 'Buy lead', 'Delivery state', 'Price', 'Unit', 'Quantity', 'Delivery time', 'Status'], rows: rows.map((q) => [d(q.createdAt), q.requirement.title, q.requirement.deliveryState || '', q.price, q.priceUnit || '', q.quantity || '', q.deliveryTime || '', q.status === 'review' ? 'under review' : q.status]) });
        break;
      }
      case 'reviews': {
        const rows = await prisma.review.findMany({ where: { sellerId, ...at('createdAt') }, orderBy: { createdAt: 'desc' }, include: { product: { select: { name: true } } } });
        const avg = rows.length ? rows.reduce((a, x) => a + x.rating, 0) / rows.length : 0;
        r.summary = [{ label: 'Reviews', value: num(rows.length) }, { label: 'Average', value: avg ? avg.toFixed(2) : '—' }];
        r.sections.push({ title: 'Reviews', columns: ['Date', 'Author', 'Product', 'Rating', 'Status', 'Review', 'Your reply'], rows: rows.map((x) => [d(x.createdAt), x.authorName, x.product?.name || '', x.rating, x.status, x.body.slice(0, 300), x.reply || '']) });
        break;
      }
      case 'payments': {
        const rows = await prisma.payment.findMany({ where: { subscription: { sellerId }, ...at('createdAt') }, orderBy: { createdAt: 'desc' }, include: { subscription: { select: { plan: { select: { name: true } } } } } });
        const paid = rows.filter((x) => x.status === 'paid');
        r.summary = [{ label: 'Paid invoices', value: num(paid.length) }, { label: 'Amount', value: inr(paid.reduce((a, x) => a + x.amount, 0)) }, { label: 'GST', value: inr(paid.reduce((a, x) => a + x.gst, 0)) }];
        r.sections.push({ title: 'Invoices', columns: ['Date', 'Invoice', 'Plan', 'Amount', 'GST', 'Total', 'Status'], rows: rows.map((p) => [d(p.paidAt || p.createdAt), p.invoiceNo || '', p.subscription?.plan.name || '', p.amount, p.gst, p.amount + p.gst, p.status]) });
        break;
      }
    }
    return r;
  }

  /* ------------------------------------------------------------------ buyer */
  const buyerId = scope.buyerId;
  const qvis = { status: { notIn: HIDE } };
  switch (meta.key) {
    case 'overview': {
      const [reqs, open, quotes, accepted, inq, reviews] = await Promise.all([
        prisma.requirement.count({ where: { buyerId, ...at('createdAt') } }),
        prisma.requirement.count({ where: { buyerId, status: 'open' } }),
        prisma.quote.count({ where: { ...qvis, requirement: { buyerId }, ...at('createdAt') } }),
        prisma.quote.count({ where: { status: 'accepted', requirement: { buyerId }, ...at('createdAt') } }),
        prisma.inquiry.count({ where: { buyerId, ...at('createdAt') } }),
        prisma.review.count({ where: { buyerId, ...at('createdAt') } }),
      ]);
      r.summary = [{ label: 'Requirements posted', value: num(reqs) }, { label: 'Open now', value: num(open) }, { label: 'Quotes received', value: num(quotes) }, { label: 'Quotes accepted', value: num(accepted) }, { label: 'Inquiries sent', value: num(inq) }, { label: 'Reviews written', value: num(reviews) }];
      const best = await prisma.quote.findMany({ where: { ...qvis, requirement: { buyerId }, ...at('createdAt') }, orderBy: { price: 'asc' }, take: 10, include: { seller: { select: { companyName: true } }, requirement: { select: { title: true } } } });
      r.sections.push({ title: 'Lowest quotes', columns: ['Requirement', 'Seller', 'Price', 'Unit', 'Delivery', 'Status'], rows: best.map((q) => [q.requirement.title, q.seller.companyName, q.price, q.priceUnit || '', q.deliveryTime || '', q.status]) });
      break;
    }
    case 'requirements': {
      const rows = await prisma.requirement.findMany({ where: { buyerId, ...at('createdAt') }, orderBy: { createdAt: 'desc' }, include: { category: { select: { name: true } }, _count: { select: { quotes: { where: qvis } } } } });
      r.summary = [{ label: 'Requirements', value: num(rows.length) }, { label: 'Open', value: num(rows.filter((x) => x.status === 'open').length) }];
      r.sections.push({ title: 'Requirements', columns: ['Posted', 'Title', 'Category', 'Quantity', 'Budget', 'Delivery', 'Status', 'Quotes', 'Views'], rows: rows.map((q) => [d(q.createdAt), q.title, q.category?.name || '', [q.quantity, q.unit].filter(Boolean).join(' '), [inr(q.budgetMin), inr(q.budgetMax)].filter(Boolean).join(' – '), [q.deliveryCity, q.deliveryState].filter(Boolean).join(', '), q.status, q._count.quotes, q.views]) });
      break;
    }
    case 'quotes': {
      const rows = await prisma.quote.findMany({ where: { ...qvis, requirement: { buyerId }, ...at('createdAt') }, orderBy: { createdAt: 'desc' }, include: { seller: { select: { companyName: true, state: true, ratingAvg: true } }, requirement: { select: { title: true } } } });
      r.summary = [{ label: 'Quotes', value: num(rows.length) }, { label: 'Accepted', value: num(rows.filter((x) => x.status === 'accepted').length) }];
      r.sections.push({ title: 'Quotes received', columns: ['Date', 'Requirement', 'Seller', 'Seller state', 'Seller rating', 'Price', 'Unit', 'Quantity', 'Delivery', 'Status'], rows: rows.map((q) => [d(q.createdAt), q.requirement.title, q.seller.companyName, q.seller.state || '', q.seller.ratingAvg ? q.seller.ratingAvg.toFixed(1) : '', q.price, q.priceUnit || '', q.quantity || '', q.deliveryTime || '', q.status]) });
      break;
    }
    case 'inquiries': {
      const rows = await prisma.inquiry.findMany({ where: { buyerId, ...at('createdAt') }, orderBy: { createdAt: 'desc' }, include: { seller: { select: { companyName: true } }, product: { select: { name: true } } } });
      r.summary = [{ label: 'Inquiries', value: num(rows.length) }, { label: 'Replied', value: num(rows.filter((x) => x.status === 'replied').length) }];
      r.sections.push({ title: 'Inquiries', columns: ['Date', 'Ref', 'Seller', 'Product', 'Quantity', 'Status'], rows: rows.map((q) => [d(q.createdAt), q.refNo, q.seller.companyName, q.product?.name || 'General', q.quantity || '', q.status === 'review' ? 'under review' : q.status]) });
      break;
    }
    case 'reviews': {
      const rows = await prisma.review.findMany({ where: { buyerId, ...at('createdAt') }, orderBy: { createdAt: 'desc' }, include: { seller: { select: { companyName: true } }, product: { select: { name: true } } } });
      r.summary = [{ label: 'Reviews', value: num(rows.length) }];
      r.sections.push({ title: 'Reviews', columns: ['Date', 'Seller', 'Product', 'Rating', 'Status', 'Review'], rows: rows.map((x) => [d(x.createdAt), x.seller.companyName, x.product?.name || '', x.rating, x.status, x.body.slice(0, 300)]) });
      break;
    }
  }
  return r;
}

/* ------------------------------------------------------------------ file formats */

export function toCsv(rep: Report) {
  const esc = (v: Cell) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const out: string[] = [esc(rep.title), esc(rep.subtitle), `Period,${esc(rep.period)}`, `Generated,${esc(rep.generatedAt)}`, ''];
  if (rep.summary.length) {
    out.push('Summary');
    for (const s of rep.summary) out.push(`${esc(s.label)},${esc(s.value)}`);
    out.push('');
  }
  for (const sec of rep.sections) {
    out.push(esc(sec.title), sec.columns.map(esc).join(','), ...sec.rows.map((r) => r.map(esc).join(',')), '');
  }
  return '﻿' + out.join('\n');
}

// ---- minimal .xlsx writer (Office Open XML in a stored ZIP) — no extra packages needed
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf: Buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function zip(files: { name: string; data: string }[]) {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const f of files) {
    const name = Buffer.from(f.name, 'utf8');
    const data = Buffer.from(f.data, 'utf8');
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(0, 8); // stored
    local.writeUInt32LE(0, 10);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    parts.push(local, name, data);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0x0800, 8);
    cen.writeUInt16LE(0, 10);
    cen.writeUInt32LE(0, 12);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(data.length, 20);
    cen.writeUInt32LE(data.length, 24);
    cen.writeUInt16LE(name.length, 28);
    cen.writeUInt32LE(offset, 42);
    central.push(cen, name);
    offset += 30 + name.length + data.length;
  }
  const cenBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cenBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, cenBuf, end]);
}
const x = (s: string) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c] as string).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
const colName = (i: number) => {
  let s = '';
  for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
};
function sheetXml(rows: Cell[][], boldRows: Set<number>, widths: number[]) {
  const body = rows
    .map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => {
      const ref = `${colName(ci)}${ri + 1}`;
      const st = boldRows.has(ri) ? ' s="1"' : '';
      if (typeof v === 'number' && isFinite(v)) return `<c r="${ref}"${st}><v>${v}</v></c>`;
      if (v == null || v === '') return '';
      return `<c r="${ref}" t="inlineStr"${st}><is><t xml:space="preserve">${x(String(v))}</t></is></c>`;
    }).join('')}</row>`)
    .join('');
  const cols = widths.length ? `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.min(60, Math.max(10, w))}" customWidth="1"/>`).join('')}</cols>` : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${body}</sheetData></worksheet>`;
}

export function toXlsx(rep: Report): Buffer {
  const sheets: { name: string; rows: Cell[][]; bold: Set<number> }[] = [];
  const sum: Cell[][] = [[rep.title], [rep.subtitle], ['Period', rep.period], ['Generated', rep.generatedAt], [], ['Summary'], ...rep.summary.map((s) => [s.label, s.value] as Cell[])];
  sheets.push({ name: 'Summary', rows: sum, bold: new Set([0, 5]) });
  const used = new Set(['Summary']);
  for (const sec of rep.sections) {
    let name = sec.title.replace(/[\\/?*[\]:]/g, ' ').slice(0, 28) || 'Sheet';
    while (used.has(name)) name = name.slice(0, 26) + ' ' + used.size;
    used.add(name);
    sheets.push({ name, rows: [sec.columns, ...sec.rows], bold: new Set([0]) });
  }
  const files = [
    { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>` },
    { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${x(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: 'xl/styles.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF0B6B2C"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8F5EC"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf fontId="0" fillId="0" borderId="0"/><xf fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>` },
    ...sheets.map((s, i) => {
      const widths = (s.rows[0] || []).map((_, ci) => Math.max(...s.rows.slice(0, 200).map((r) => String(r[ci] ?? '').length)) + 2);
      return { name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(s.rows, s.bold, widths) };
    }),
  ];
  return zip(files);
}

export function fileName(rep: Report, ext: string) {
  const slug = rep.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `shrijaiv-${slug}-${new Date().toISOString().slice(0, 10)}.${ext}`;
}
