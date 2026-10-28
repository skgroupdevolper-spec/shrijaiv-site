import { prisma } from '@/lib/db';
import { requireSeller } from '@/lib/auth';
import { entitlements } from '@/lib/marketplace/plans';
import { PageTitle, Card } from '@/components/admin/ui';
import { Stat } from '@/components/dashboard/Stat';
import { Eye, Inbox, Package, Percent, Star, Lock } from 'lucide-react';
import Link from 'next/link';

export default async function SellerAnalytics() {
  const { seller } = (await requireSeller())!;
  const e = await entitlements(seller.id);
  const since30 = new Date(Date.now() - 30 * 86_400_000);
  const [products, inquiries30, inquiriesAll, quotes30, byStatus] = await Promise.all([
    prisma.product.findMany({ where: { sellerId: seller.id }, orderBy: { views: 'desc' }, select: { id: true, name: true, views: true, inquiryCount: true, status: true, ratingAvg: true, ratingCount: true } }),
    prisma.inquiry.count({ where: { sellerId: seller.id, createdAt: { gte: since30 } } }),
    prisma.inquiry.count({ where: { sellerId: seller.id } }),
    prisma.quote.count({ where: { sellerId: seller.id, createdAt: { gte: since30 } } }),
    prisma.inquiry.groupBy({ by: ['status'], where: { sellerId: seller.id }, _count: { _all: true } }),
  ]);
  const views = products.reduce((a, p) => a + p.views, 0) + seller.views;
  const conv = views ? ((inquiriesAll / views) * 100).toFixed(1) : '0';
  // daily inquiries for the last 14 days
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (13 - i));
    return d;
  });
  const recent = await prisma.inquiry.findMany({ where: { sellerId: seller.id, createdAt: { gte: days[0] } }, select: { createdAt: true } });
  const series = days.map((d) => recent.filter((r) => r.createdAt >= d && r.createdAt < new Date(d.getTime() + 86_400_000)).length);
  const max = Math.max(1, ...series);
  return (
    <>
      <PageTitle title="Analytics" subtitle="Views, inquiries and conversion — what buyers look at and what makes them write." />
      {!e.analytics && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-100"><Lock className="h-4 w-4" /> Detailed analytics are part of paid plans. <Link href="/seller/membership" className="font-bold underline">Upgrade</Link></div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total views" value={views} icon={Eye} tone="blue" />
        <Stat label="Inquiries (30 days)" value={inquiries30} hint={`${inquiriesAll} all time`} icon={Inbox} tone="amber" />
        <Stat label="Quotes sent (30 days)" value={quotes30} icon={Package} />
        <Stat label="View → inquiry" value={`${conv}%`} icon={Percent} tone="rose" />
      </div>
      <div className={`mt-6 grid gap-6 lg:grid-cols-2 ${!e.analytics ? 'pointer-events-none select-none blur-[3px]' : ''}`}>
        <Card title="Inquiries — last 14 days">
          <div className="flex h-44 items-end gap-1.5 p-5">
            {series.map((v, i) => (
              <div key={i} className="group relative flex-1">
                <div className="w-full rounded-t-md bg-emerald-500/80 transition group-hover:bg-emerald-600" style={{ height: `${(v / max) * 140 + 4}px` }} />
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[0.6rem] text-gray-500 opacity-0 group-hover:opacity-100">{v}</span>
              </div>
            ))}
          </div>
          <p className="px-5 pb-4 text-xs text-gray-400">{days[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → today</p>
        </Card>
        <Card title="Inquiry status">
          <ul className="divide-y divide-gray-100">
            {byStatus.map((s) => (
              <li key={s.status} className="flex items-center justify-between px-5 py-2.5 text-sm"><span className="capitalize text-gray-600">{s.status}</span><b>{s._count._all}</b></li>
            ))}
            {!byStatus.length && <li className="px-5 py-8 text-center text-sm text-gray-400">No inquiries yet</li>}
          </ul>
        </Card>
        <Card title="Top products" className="lg:col-span-2">
          {products.length === 0 ? <p className="p-8 text-center text-sm text-gray-400">Add products to see their performance.</p> : (
            <table className="w-full text-sm">
              <thead className="text-left text-[0.65rem] uppercase tracking-wider text-gray-400"><tr><th className="px-5 py-2">Product</th><th className="px-3 py-2 text-right">Views</th><th className="px-3 py-2 text-right">Inquiries</th><th className="px-3 py-2 text-right">Conv.</th><th className="px-5 py-2 text-right"><Star className="inline h-3 w-3" /></th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {products.slice(0, 25).map((p) => (
                  <tr key={p.id}><td className="px-5 py-2.5"><Link href={`/seller/products/${p.id}`} className="font-semibold text-gray-900 hover:text-gold-deep">{p.name}</Link> <span className="text-xs text-gray-400">{p.status}</span></td><td className="px-3 py-2.5 text-right">{p.views}</td><td className="px-3 py-2.5 text-right">{p.inquiryCount}</td><td className="px-3 py-2.5 text-right">{p.views ? ((p.inquiryCount / p.views) * 100).toFixed(1) : '0'}%</td><td className="px-5 py-2.5 text-right">{p.ratingCount ? p.ratingAvg.toFixed(1) : '—'}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
