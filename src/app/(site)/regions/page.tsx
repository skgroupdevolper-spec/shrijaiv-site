import type { Metadata } from 'next';
import { MapPin, Store, Package, ArrowRight } from 'lucide-react';
import { getI18n } from '@/lib/i18n/server';
import { prisma } from '@/lib/db';
import { INDIAN_STATES, LIVE_SELLER } from '@/lib/marketplace/data';
import { stateCode } from '@/lib/marketplace/format';
import ListingHeader from '@/components/market/ListingHeader';
import SmartLink from '@/components/ui/SmartLink';

export const dynamic = 'force-dynamic';
const FLAG = '/images/site/india.png';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t('Organic suppliers by state — all India'), description: t('Find verified organic sellers in every Indian state and union territory: agriculture, beauty and processed food.') };
}

/** /regions — every state with its seller and product counts (Suppliers By Region → All states) */
export default async function RegionsPage() {
  const { t } = await getI18n();
  const sellers = await prisma.sellerProfile.findMany({ where: LIVE_SELLER, select: { state: true, _count: { select: { products: { where: { status: 'approved' } } } } } });
  const stats = new Map<string, { sellers: number; products: number }>();
  for (const s of sellers) {
    if (!s.state) continue;
    const row = stats.get(s.state) || { sellers: 0, products: 0 };
    row.sellers += 1;
    row.products += s._count.products;
    stats.set(s.state, row);
  }
  const list = [...INDIAN_STATES].sort((a, b) => (stats.get(b)?.sellers || 0) - (stats.get(a)?.sellers || 0) || a.localeCompare(b));
  const total = sellers.length;
  return (
    <>
      <ListingHeader crumbs={[{ label: t('Suppliers by region') }]} eyebrow={t('All India')} title={t('Suppliers by region')} lead={t('Verified organic sellers from every state and union territory. Pick a state to see its sellers, or post a requirement and let them come to you.')} right={<SmartLink href="/post-requirement" className="btn btn-gold">{t('Post a requirement')}</SmartLink>} />
      <section className="section theme-sand !pt-8">
        <div className="container-x">
          <p className="mb-5 text-sm text-ink/60"><b className="text-ink">{total}</b> {t('verified sellers across')} <b className="text-ink">{stats.size}</b> {t('states')}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {list.map((s) => {
              const st = stats.get(s);
              return (
                <SmartLink key={s} href={`/sellers?state=${encodeURIComponent(s)}`} className="card card-lift tilt reveal group flex items-center gap-3 p-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#eaf7ee,#cdeed6)] font-display text-[1.05rem] font-bold text-gold-deep ring-2 ring-white shadow-sm transition group-hover:scale-110">{stateCode(s)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 font-semibold text-ink">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={FLAG} alt="" className="h-3.5 w-3.5" /> <span className="truncate">{s}</span>
                    </span>
                    <span className="mt-0.5 flex flex-wrap gap-x-2 text-[0.72rem] text-ink/50">
                      <span className="inline-flex items-center gap-1"><Store className="h-3 w-3" /> {st?.sellers || 0} {t('sellers')}</span>
                      <span className="inline-flex items-center gap-1"><Package className="h-3 w-3" /> {st?.products || 0} {t('products')}</span>
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink/30 transition group-hover:translate-x-1 group-hover:text-gold-deep" />
                </SmartLink>
              );
            })}
          </div>
          <div className="card mt-10 flex flex-col items-center gap-3 p-8 text-center sm:flex-row sm:text-start">
            <MapPin className="h-8 w-8 shrink-0 text-gold-deep" />
            <div className="flex-1">
              <p className="font-display text-xl font-semibold text-ink">{t('Selling from a state that is not listed yet?')}</p>
              <p className="text-sm text-ink/60">{t('Create a free seller account — your showroom appears under your state automatically.')}</p>
            </div>
            <SmartLink href="/register?as=seller" className="btn btn-dark">{t('Become a seller')}</SmartLink>
          </div>
        </div>
      </section>
    </>
  );
}
