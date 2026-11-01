import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BadgeCheck, MapPin, Megaphone, CalendarDays, ArrowRight, LockKeyhole } from 'lucide-react';
import { getI18n } from '@/lib/i18n/server';
import { listBuyers, INDIAN_STATES } from '@/lib/marketplace/data';
import { getMarketplace } from '@/lib/marketplace/settings';
import ListingHeader from '@/components/market/ListingHeader';
import Filters from '@/components/market/Filters';
import Pagination from '@/components/market/Pagination';
import QuickChips from '@/components/market/QuickChips';
import ListingSwitch from '@/components/market/ListingSwitch';
import SmartLink from '@/components/ui/SmartLink';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
type SP = Promise<Record<string, string | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t('Organic buyers in India'), description: t('Retailers, wholesalers, restaurants, exporters and brands looking for organic products. See what they need and send your quote through SHRIJAIV.') };
}

/** /buyers — every active buyer: company, type, place and open requirements. No personal contact details. */
export default async function BuyersPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { t } = await getI18n();
  const mp = await getMarketplace();
  const res = await listBuyers({ q: sp.q, state: sp.state, type: sp.type, verified: sp.verified === '1', page: Number(sp.page) || 1 });
  return (
    <>
      <ListingHeader
        crumbs={[{ label: t('Buyers') }]}
        eyebrow={t('Marketplace')}
        title={sp.q ? `${t('Buyers for')} “${sp.q}”` : t('All buyers')}
        lead={t('Retailers, wholesalers, restaurants, exporters and brands buying organic products. See what they need and quote — SHRIJAIV shares contact details safely.')}
        right={<SmartLink href="/register?as=buyer" className="btn btn-gold">{t('Register as buyer')}</SmartLink>}
      />
      <section className="section theme-sand !pt-8">
        <div className="container-x">
          <ListingSwitch active="buyer" supplierLabel={t('Sellers')} buyerLabel={t('Buyers')} supplierHref="/sellers" buyerHref="/buyers" />
          <QuickChips
            base="/buyers"
            params={sp}
            chips={[{ label: t('All buyers') }, { label: t('Verified'), key: 'verified', value: '1' }, ...mp.buyerTypes.slice(0, 6).map((s) => ({ label: s, key: 'type', value: s }))]}
          />
          <Suspense>
            <Filters
              total={res.total}
              kindLabel={t('buyers')}
              defs={[
                { key: 'q', label: t('Search'), type: 'text' },
                { key: 'type', label: t('Buyer type'), type: 'select', options: mp.buyerTypes.map((s) => ({ value: s, label: s })) },
                { key: 'state', label: t('State'), type: 'select', options: INDIAN_STATES.map((s) => ({ value: s, label: s })) },
                { key: 'verified', label: t('Verified'), type: 'check', options: [{ value: '1', label: t('Verified buyers only') }] },
              ]}
            >
              {res.items.length === 0 ? (
                <div className="card p-10 text-center">
                  <p className="font-display text-2xl font-semibold text-ink">{t('No buyers found')}</p>
                  <p className="mt-2 text-ink/60">{t('Try fewer filters, or browse the latest buy leads.')}</p>
                  <SmartLink href="/requirements" className="btn btn-gold mt-6">{t('Buy leads')}</SmartLink>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {res.items.map((b) => {
                    const name = b.companyName || `${b.buyerType || t('Buyer')}${b.city ? ` · ${b.city}` : ''}`;
                    return (
                      <div key={b.id} className="card card-lift reveal flex flex-col p-5">
                        <div className="flex items-start gap-3">
                          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#fff4d6,#ffe1a1)] font-display text-lg font-bold text-amber-800 ring-2 ring-white shadow-sm">{name.charAt(0).toUpperCase()}</span>
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1 font-semibold text-ink">
                              <span className="truncate">{name}</span>
                              {b.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />}
                            </p>
                            <p className="text-xs text-ink/55">{b.buyerType || t('Buyer')}</p>
                            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.72rem] text-ink/50">
                              {(b.city || b.state) && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {[b.city, b.state].filter(Boolean).join(', ')}</span>}
                              <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {t('since')} {formatDate(b.createdAt)}</span>
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex-1 border-t border-ink/5 pt-3">
                          <p className="mb-2 inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-ink/45">
                            <Megaphone className="h-3.5 w-3.5 text-amber-600" /> {b.requirements.length ? t('Looking for') : `${b._count.requirements} ${t('requirements posted')}`}
                          </p>
                          {b.requirements.length > 0 && (
                            <ul className="space-y-1.5">
                              {b.requirements.map((r) => (
                                <li key={r.id}>
                                  <SmartLink href={`/requirements/${r.id}`} className="group flex items-center justify-between gap-2 rounded-xl bg-amber-50/60 px-3 py-2 text-sm ring-1 ring-amber-100 hover:ring-amber-300">
                                    <span className="min-w-0">
                                      <span className="block truncate font-semibold text-ink">{r.title}</span>
                                      {r.quantity && <span className="text-[0.7rem] text-ink/50">{r.quantity} {r.unit || ''}</span>}
                                    </span>
                                    <ArrowRight className="h-4 w-4 shrink-0 text-amber-600 transition group-hover:translate-x-0.5" />
                                  </SmartLink>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <p className="mt-3 inline-flex items-center gap-1.5 text-[0.7rem] text-ink/45">
                          <LockKeyhole className="h-3 w-3" /> {t('Contact details are shared through SHRIJAIV')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
              <Pagination page={res.page} pages={res.pages} base="/buyers" params={sp} />
            </Filters>
          </Suspense>
        </div>
      </section>
    </>
  );
}
