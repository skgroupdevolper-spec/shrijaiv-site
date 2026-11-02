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
import { prisma } from '@/lib/db';
import { WantedCards } from '@/components/blocks/ShopBlocks';
import { Users, Store } from 'lucide-react';

export const dynamic = 'force-dynamic';
const BOX_IMAGES = ['/images/demo/box-fruits.webp', '/images/demo/box-vegetables.webp', '/images/demo/box-grains.webp', '/images/demo/box-dairy.webp', '/images/demo/wide-spices.webp', '/images/demo/wide-honey.webp', '/images/demo/wide-tea.webp'];
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
  const [openLeads, buyerStates] = await Promise.all([
    prisma.requirement.count({ where: { status: 'open' } }),
    prisma.buyerProfile.findMany({ where: { status: 'approved', state: { not: null } }, select: { state: true }, distinct: ['state'] }),
  ]);
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
          <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-4">
            {[
              [Users, res.total, t('buyers')],
              [Megaphone, openLeads, t('open buy leads')],
              [MapPin, buyerStates.length, t('states')],
            ].map(([I, n, l]: any) => (
              <div key={l} className="card flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
                <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 sm:grid"><I className="h-5 w-5" /></span>
                <span className="min-w-0">
                  <b className="block font-display text-xl text-ink sm:text-2xl">{n}</b>
                  <span className="block truncate text-[0.7rem] text-ink/55 sm:text-xs">{l}</span>
                </span>
              </div>
            ))}
          </div>
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
                  {res.items.map((b, idx) => {
                    const name = b.companyName || `${b.buyerType || t('Buyer')}${b.city ? ` · ${b.city}` : ''}`;
                    const first = b.requirements[0];
                    return (
                      <div key={b.id} className="card card-lift reveal group relative flex min-h-[430px] flex-col overflow-hidden !rounded-[22px] bg-[#f7f6f1] p-6">
                        <div className="relative z-[1]">
                          <p className="flex flex-wrap items-center gap-2 text-[0.72rem] text-ink/60">
                            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {t('since')} {formatDate(b.createdAt)}</span>
                            <span className="inline-flex items-center gap-1 font-bold uppercase text-emerald-600"><BadgeCheck className="h-3.5 w-3.5" /> {b.verified ? t('Verified') : t('Buyer')}</span>
                          </p>
                          {first ? (
                            <p className="mt-2 line-clamp-1 text-sm font-semibold text-rose-600">{t('WANTED')}: {first.title}</p>
                          ) : (
                            <p className="mt-2 text-sm font-semibold text-ink/50">{b._count.requirements} {t('requirements posted')}</p>
                          )}
                          <p className="mt-1 line-clamp-2 font-display text-[1.45rem] font-semibold leading-tight text-ink">{name}</p>
                          <p className="mt-1 flex flex-wrap gap-x-3 text-[0.78rem] text-ink/60">
                            <span>{b.buyerType || t('Buyer')}</span>
                            {(b.city || b.state) && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {[b.city, b.state].filter(Boolean).join(', ')}</span>}
                          </p>
                          {b.requirements.length > 1 && (
                            <ul className="mt-3 space-y-1">
                              {b.requirements.slice(1).map((r) => (
                                <li key={r.id}>
                                  <SmartLink href={`/requirements/${r.id}`} className="flex items-center gap-1.5 text-[0.8rem] font-semibold text-ink/75 hover:text-gold-deep">
                                    <Megaphone className="h-3.5 w-3.5 shrink-0 text-amber-600" /> <span className="truncate">{r.title}</span>
                                  </SmartLink>
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {first ? (
                              <SmartLink href={`/requirements/${first.id}`} className="btn btn-outline btn-sm bg-white transition group-hover:border-gold group-hover:bg-gold group-hover:text-white">
                                {t('Send quote')} <ArrowRight className="h-3.5 w-3.5" />
                              </SmartLink>
                            ) : (
                              <SmartLink href="/requirements" className="btn btn-outline btn-sm bg-white">{t('Buy leads')} <ArrowRight className="h-3.5 w-3.5" /></SmartLink>
                            )}
                            <span className="inline-flex items-center gap-1 self-center text-[0.68rem] text-ink/45"><LockKeyhole className="h-3 w-3" /> {t('Contact via SHRIJAIV')}</span>
                          </div>
                        </div>
                        {/* picture at the bottom of the box, like the buyer boxes on the home page */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={BOX_IMAGES[idx % BOX_IMAGES.length]} alt="" loading="lazy" className="pointer-events-none absolute bottom-0 left-0 h-[42%] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <span className="pointer-events-none absolute inset-x-0 top-[58%] h-12 -translate-y-full bg-gradient-to-b from-[#f7f6f1] to-transparent" />
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
      <WantedCards data={{ theme: 'light', heading: t('Latest buy leads'), layout: 'wide', limit: 2, samples: false, cta: { label: t('View all'), href: '/requirements' }, images: '/images/demo/wide-honey.webp\n/images/demo/wide-tea.webp' }} site={undefined as any} />
      <section className="theme-light pb-14">
        <div className="container-x">
          <div className="relative overflow-hidden rounded-[26px] bg-[linear-gradient(120deg,#0f3d22,#1d6b3a)] p-7 text-white sm:p-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/demo/cta-produce.webp" alt="" className="pointer-events-none absolute -bottom-4 right-4 hidden h-[110%] w-auto object-contain md:block" />
            <div className="relative max-w-xl">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-amber-300">{t('For sellers')}</p>
              <p className="mt-2 font-display text-2xl font-semibold leading-tight sm:text-3xl">{t('Sell to these buyers')}</p>
              <p className="mt-2 text-sm text-white/80">{t('Create a free seller account, list your products and quote on buy leads. Our team forwards every inquiry to you.')}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <SmartLink href="/register?as=seller" className="btn btn-gold"><Store className="h-4 w-4" /> {t('Register as seller')}</SmartLink>
                <SmartLink href="/requirements" className="btn bg-white/10 text-white ring-1 ring-white/30 hover:bg-white/20">{t('See buy leads')}</SmartLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
