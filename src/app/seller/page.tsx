import Link from 'next/link';
import { Package, Inbox, Eye, Star, Crown, PlusCircle, Building2, Megaphone, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireSeller } from '@/lib/auth';
import { entitlements } from '@/lib/marketplace/plans';
import { Stat } from '@/components/dashboard/Stat';
import { Card, PageTitle } from '@/components/admin/ui';
import { formatDate } from '@/lib/utils';
import { SELLER_VISIBLE } from '@/lib/marketplace/moderation';

export default async function SellerOverview() {
  const { seller } = (await requireSeller())!;
  const [products, approved, inquiries, newInquiries, openLeads, e, latest] = await Promise.all([
    prisma.product.count({ where: { sellerId: seller.id } }),
    prisma.product.count({ where: { sellerId: seller.id, status: 'approved' } }),
    prisma.inquiry.count({ where: { sellerId: seller.id, ...SELLER_VISIBLE } }),
    prisma.inquiry.count({ where: { sellerId: seller.id, ...SELLER_VISIBLE, status: 'new' } }),
    prisma.requirement.count({ where: { status: 'open' } }),
    entitlements(seller.id),
    prisma.inquiry.findMany({ where: { sellerId: seller.id, ...SELLER_VISIBLE }, orderBy: { createdAt: 'desc' }, take: 6, include: { product: { select: { name: true } } } }),
  ]);
  const profileSteps = [
    { ok: !!seller.about, label: 'Write about your company', href: '/seller/profile' },
    { ok: !!seller.logo, label: 'Upload your logo', href: '/seller/profile' },
    { ok: !!seller.city && !!seller.state, label: 'Add your location', href: '/seller/profile' },
    { ok: products > 0, label: 'Add your first product', href: '/seller/products/new' },
    { ok: JSON.parse(seller.certifications || '[]').length > 0, label: 'Upload organic certificates (for the Verified badge)', href: '/seller/profile#certifications' },
  ];
  const done = profileSteps.filter((s) => s.ok).length;

  return (
    <>
      <PageTitle
        title={`Namaste, ${seller.companyName}`}
        subtitle={e.paidPlans ? `Plan: ${e.planName}${e.endsAt ? ` · until ${formatDate(e.endsAt)}` : ''}` : 'All features are free and unlimited right now.'}
        actions={
          <>
            <Link href="/seller/products/new" className="btn btn-gold"><PlusCircle className="h-4 w-4" /> Add product</Link>
            <Link href={`/sellers/${seller.slug}`} className="btn btn-outline" target="_blank">View my showroom</Link>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Products" value={products} hint={`${approved} live`} icon={Package} href="/seller/products" />
        <Stat label="Inquiries" value={inquiries} hint={newInquiries ? `${newInquiries} new` : undefined} icon={Inbox} href="/seller/inquiries" tone={newInquiries ? 'amber' : 'green'} />
        <Stat label="Showroom views" value={seller.views} icon={Eye} href="/seller/analytics" tone="blue" />
        <Stat label="Rating" value={seller.ratingCount ? `${seller.ratingAvg.toFixed(1)} ★` : '—'} hint={seller.ratingCount ? `${seller.ratingCount} reviews` : 'No reviews yet'} icon={Star} href="/seller/reviews" tone="rose" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Latest inquiries" className="lg:col-span-2" actions={<Link href="/seller/inquiries" className="text-xs font-bold text-gold-deep">All inquiries →</Link>}>
          {latest.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">No inquiries yet. Add products with good photos and details — buyers find you through search and categories.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {latest.map((q) => (
                <li key={q.id}>
                  <Link href={`/seller/inquiries/${q.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${q.status === 'new' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{q.name}{q.product ? ` · ${q.product.name}` : ''}</p>
                      <p className="truncate text-xs text-gray-500">{q.message}</p>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(q.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card title={`Profile strength ${Math.round((done / profileSteps.length) * 100)}%`}>
            <div className="px-5 pt-4">
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full" style={{ width: `${(done / profileSteps.length) * 100}%`, background: 'var(--gold-grad)' }} />
              </div>
            </div>
            <ul className="p-5 pt-3 space-y-2">
              {profileSteps.map((s) => (
                <li key={s.label}>
                  <Link href={s.href} className={`flex items-center gap-2 text-sm ${s.ok ? 'text-gray-400 line-through' : 'text-gray-800 hover:text-gold-deep'}`}>
                    <span className={`grid h-5 w-5 place-items-center rounded-full text-[0.6rem] font-bold ${s.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>✓</span>
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Buy leads">
            <div className="p-5">
              <p className="text-sm text-gray-600"><b>{openLeads}</b> open requirements from buyers are waiting for quotes.</p>
              <Link href="/seller/leads" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-gold-deep"><Megaphone className="h-4 w-4" /> Browse buy leads <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </Card>

          {e.paidPlans && (
            <Card title="Membership">
              <div className="p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-900"><Crown className="h-4 w-4 text-amber-500" /> {e.planName}</p>
                <p className="mt-1 text-xs text-gray-500">{e.maxProducts < 0 ? 'Unlimited products' : `${products}/${e.maxProducts} products used`}{e.endsAt ? ` · renews ${formatDate(e.endsAt)}` : ''}</p>
                <Link href="/seller/membership" className="btn btn-gold mt-3 w-full">Manage plan</Link>
              </div>
            </Card>
          )}
          {!seller.about && (
            <Link href="/seller/profile" className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-100 hover:bg-emerald-100">
              <Building2 className="h-5 w-5" /> Complete your company profile to appear in search.
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
