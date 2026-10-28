import Link from 'next/link';
import { Store, ShoppingBag, Package, Megaphone, Inbox, Star, Crown, Settings, ArrowRight, AlertTriangle, IndianRupee, Users, FileText } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getMarketplace } from '@/lib/marketplace/settings';
import { formatDateTime, formatDate } from '@/lib/utils';
import AutoRefresh from '@/components/portal/AutoRefresh';

const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN');

export default async function Dashboard() {
  const since = new Date(Date.now() - 13 * 24 * 3600 * 1000);
  since.setHours(0, 0, 0, 0);
  const month = new Date();
  month.setDate(1);
  month.setHours(0, 0, 0, 0);
  const [mp, sellers, pendingSellers, buyers, products, pendingProducts, requirements, inquiries, newInquiries, reviewsPending, reportsOpen, activeSubs, revenueMonth, inqRange, recentInq, recentSellers, recentProducts, leadsNew, topSellers] = await Promise.all([
    getMarketplace(),
    prisma.sellerProfile.count(),
    prisma.sellerProfile.count({ where: { status: 'pending' } }),
    prisma.buyerProfile.count(),
    prisma.product.count({ where: { status: 'approved' } }),
    prisma.product.count({ where: { status: 'pending' } }),
    prisma.requirement.count({ where: { status: 'open' } }),
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { seenByAdmin: false } }),
    prisma.review.count({ where: { status: 'pending' } }),
    prisma.report.count({ where: { status: 'open' } }),
    prisma.subscription.count({ where: { status: { in: ['active', 'trial'] } } }),
    prisma.payment.aggregate({ where: { status: 'paid', paidAt: { gte: month } }, _sum: { amount: true, gst: true } }),
    prisma.inquiry.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.inquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { seller: { select: { companyName: true } }, product: { select: { name: true } } } }),
    prisma.sellerProfile.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, companyName: true, status: true, state: true, createdAt: true } }),
    prisma.product.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, createdAt: true, seller: { select: { companyName: true } } } }),
    prisma.lead.count({ where: { seen: false } }),
    prisma.sellerProfile.findMany({ where: { status: 'approved' }, orderBy: { views: 'desc' }, take: 5, select: { id: true, companyName: true, views: true, ratingAvg: true, ratingCount: true, _count: { select: { inquiries: true } } } }),
  ]);
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(since.getTime() + i * 24 * 3600 * 1000);
    const key = d.toISOString().slice(0, 10);
    return { key, label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), count: inqRange.filter((l) => l.createdAt.toISOString().slice(0, 10) === key).length };
  });
  const max = Math.max(1, ...days.map((d) => d.count));
  const todo = [
    pendingSellers && { n: pendingSellers, label: 'sellers waiting for approval', href: '/admin/sellers?status=pending' },
    pendingProducts && { n: pendingProducts, label: 'products waiting for approval', href: '/admin/products?status=pending' },
    reviewsPending && { n: reviewsPending, label: 'reviews to moderate', href: '/admin/reviews' },
    reportsOpen && { n: reportsOpen, label: 'open reports', href: '/admin/reports' },
    newInquiries && { n: newInquiries, label: 'new inquiries', href: '/admin/inquiries' },
    leadsNew && { n: leadsNew, label: 'new contact-form messages', href: '/admin/leads' },
  ].filter(Boolean) as { n: number; label: string; href: string }[];
  const cards = [
    { label: 'Sellers', value: sellers, sub: `${pendingSellers} pending`, icon: Store, href: '/admin/sellers' },
    { label: 'Buyers', value: buyers, sub: 'registered', icon: ShoppingBag, href: '/admin/buyers' },
    { label: 'Live products', value: products, sub: `${pendingProducts} pending`, icon: Package, href: '/admin/products' },
    { label: 'Open buy leads', value: requirements, sub: 'requirements', icon: Megaphone, href: '/admin/requirements' },
    { label: 'Inquiries', value: inquiries, sub: `${newInquiries} new`, icon: Inbox, href: '/admin/inquiries' },
    { label: 'Active plans', value: activeSubs, sub: mp.paidPlans ? 'paid plans ON' : 'paid plans OFF', icon: Crown, href: '/admin/subscriptions' },
    { label: 'Revenue this month', value: inr((revenueMonth._sum.amount || 0) + (revenueMonth._sum.gst || 0)), sub: 'incl. GST', icon: IndianRupee, href: '/admin/payments' },
    { label: 'Reviews pending', value: reviewsPending, sub: 'to moderate', icon: Star, href: '/admin/reviews' },
  ];
  return (
    <div className="space-y-6">
      <AutoRefresh seconds={30} />
      <div className="ink-panel admin-hero relative overflow-hidden rounded-3xl p-7 md:p-9">
        <div className="absolute inset-0 bg-pattern opacity-[0.07]" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/25 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold">Marketplace dashboard</p>
            <h1 className="mt-2 text-3xl font-extrabold">Namaste 👋</h1>
            <p className="mt-1 text-sm text-white/60">{todo.length ? `${todo.reduce((a, t) => a + t.n, 0)} things need your attention.` : 'All caught up — nothing waiting for approval.'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/marketplace" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/20"><Crown className="h-4 w-4" /> Paid plans: {mp.paidPlans ? 'ON' : 'OFF'}</Link>
            <Link href="/admin/pages" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/20"><FileText className="h-4 w-4" /> Pages</Link>
            <Link href="/admin/settings" className="btn btn-gold btn-sm !rounded-xl !font-bold"><Settings className="h-4 w-4" /> Settings</Link>
          </div>
        </div>
      </div>

      {todo.length > 0 && (
        <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-900"><AlertTriangle className="h-4 w-4" /> To do</p>
          <div className="flex flex-wrap gap-2">
            {todo.map((t) => <Link key={t.href} href={t.href} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"><span className="rounded-full bg-amber-500 px-1.5 text-white">{t.n}</span> {t.label} <ArrowRight className="h-3 w-3" /></Link>)}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="group rounded-2xl bg-white p-5 ring-1 ring-gray-200/70 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><c.icon className="h-5 w-5" /></span><ArrowRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-1 group-hover:text-gray-600" /></div>
            <p className="mt-4 text-2xl font-extrabold tracking-tight text-gray-900">{c.value}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{c.label}</p>
            <p className="text-xs text-gray-500">{c.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200/70 lg:col-span-2">
          <p className="text-sm font-bold text-gray-900">Inquiries — last 14 days</p>
          <div className="mt-4 flex h-40 items-end gap-1.5">
            {days.map((d) => (
              <div key={d.key} className="group relative flex-1"><div className="w-full rounded-t-md bg-emerald-500/80 transition group-hover:bg-emerald-600" style={{ height: `${(d.count / max) * 130 + 4}px` }} /><span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[0.6rem] text-gray-500 opacity-0 group-hover:opacity-100">{d.count}</span></div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">{days[0].label} → {days[13].label}</p>
        </div>
        <div className="rounded-2xl bg-white ring-1 ring-gray-200/70">
          <p className="border-b border-gray-100 px-5 py-3 text-sm font-bold text-gray-900">Top sellers</p>
          <ul className="divide-y divide-gray-100">
            {topSellers.map((s) => <li key={s.id} className="flex items-center justify-between px-5 py-2.5 text-sm"><Link href={`/admin/sellers/${s.id}`} className="truncate font-semibold text-gray-900 hover:text-gold-deep">{s.companyName}</Link><span className="shrink-0 text-xs text-gray-400">{s.views} views · {s._count.inquiries} inq · {s.ratingCount ? `${s.ratingAvg.toFixed(1)}★` : '—'}</span></li>)}
            {!topSellers.length && <li className="px-5 py-8 text-center text-xs text-gray-400">No approved sellers yet</li>}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white ring-1 ring-gray-200/70">
          <p className="flex items-center justify-between border-b border-gray-100 px-5 py-3 text-sm font-bold text-gray-900">Latest inquiries <Link href="/admin/inquiries" className="text-xs text-gold-deep">All →</Link></p>
          <ul className="divide-y divide-gray-100">
            {recentInq.map((q) => <li key={q.id}><Link href={`/admin/inquiries/${q.id}`} className="block px-5 py-2.5 text-sm hover:bg-gray-50"><p className="truncate font-semibold text-gray-900">{q.name} → {q.seller.companyName}</p><p className="truncate text-xs text-gray-400">{q.product?.name || 'General'} · {formatDateTime(q.createdAt)}</p></Link></li>)}
            {!recentInq.length && <li className="px-5 py-8 text-center text-xs text-gray-400">No inquiries yet</li>}
          </ul>
        </div>
        <div className="rounded-2xl bg-white ring-1 ring-gray-200/70">
          <p className="flex items-center justify-between border-b border-gray-100 px-5 py-3 text-sm font-bold text-gray-900">New sellers <Link href="/admin/sellers" className="text-xs text-gold-deep">All →</Link></p>
          <ul className="divide-y divide-gray-100">
            {recentSellers.map((s) => <li key={s.id}><Link href={`/admin/sellers/${s.id}`} className="flex items-center gap-2 px-5 py-2.5 text-sm hover:bg-gray-50"><span className="min-w-0 flex-1"><span className="block truncate font-semibold text-gray-900">{s.companyName}</span><span className="block text-xs text-gray-400">{s.state || '—'} · {formatDate(s.createdAt)}</span></span><span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase ${s.status === 'pending' ? 'bg-amber-100 text-amber-700' : s.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{s.status}</span></Link></li>)}
            {!recentSellers.length && <li className="px-5 py-8 text-center text-xs text-gray-400">No sellers yet</li>}
          </ul>
        </div>
        <div className="rounded-2xl bg-white ring-1 ring-gray-200/70">
          <p className="flex items-center justify-between border-b border-gray-100 px-5 py-3 text-sm font-bold text-gray-900">Products to approve <Link href="/admin/products?status=pending" className="text-xs text-gold-deep">All →</Link></p>
          <ul className="divide-y divide-gray-100">
            {recentProducts.map((p) => <li key={p.id} className="px-5 py-2.5 text-sm"><p className="truncate font-semibold text-gray-900">{p.name}</p><p className="truncate text-xs text-gray-400">{p.seller.companyName} · {formatDate(p.createdAt)}</p></li>)}
            {!recentProducts.length && <li className="px-5 py-8 text-center text-xs text-gray-400">Nothing waiting</li>}
          </ul>
        </div>
      </div>
      <p className="text-xs text-gray-400"><Users className="inline h-3 w-3" /> Members: {sellers} sellers · {buyers} buyers. Contact-form messages are under Leads.</p>
    </div>
  );
}
