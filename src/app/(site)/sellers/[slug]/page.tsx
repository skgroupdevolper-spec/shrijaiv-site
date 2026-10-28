import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BadgeCheck, MapPin, Calendar, Users, ShieldCheck, Globe, Package } from 'lucide-react';
import { getI18n } from '@/lib/i18n/server';
import { getSeller } from '@/lib/marketplace/data';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getMarketplace } from '@/lib/marketplace/settings';
import { absUrl } from '@/lib/seo';
import ListingHeader from '@/components/market/ListingHeader';
import InquiryForm from '@/components/market/InquiryForm';
import ReviewForm from '@/components/market/ReviewForm';
import ProductCard from '@/components/market/ProductCard';
import { Rating } from '@/components/market/Rating';
import FavButton from '@/components/market/FavButton';
import { formatDate, waLink } from '@/lib/utils';
import { safeArticleHtml } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await getSeller(slug);
  if (!s) return { title: 'Seller not found' };
  const desc = (s.metaDescription || s.about?.replace(/<[^>]+>/g, '') || `${s.companyName} — ${s.businessType || 'organic seller'}${s.state ? ` from ${s.state}` : ''} on SHRIJAIV. ${s.products.length} organic products.`).slice(0, 160);
  return { title: s.metaTitle ? { absolute: s.metaTitle } : `${s.companyName} — organic ${s.businessType?.toLowerCase() || 'seller'}${s.state ? ` in ${s.state}` : ''}`, description: desc, openGraph: { type: 'profile', title: s.companyName, description: desc, images: s.logo ? [absUrl(s.logo)!] : undefined } };
}

export default async function SellerPage({ params }: Props) {
  const { slug } = await params;
  const { t } = await getI18n();
  const s = await getSeller(slug);
  if (!s) notFound();
  prisma.sellerProfile.update({ where: { id: s.id }, data: { views: { increment: 1 } } }).catch(() => null);
  const user = await getCurrentUser();
  const buyer = user?.role === 'BUYER' ? await prisma.buyerProfile.findUnique({ where: { userId: user.id }, select: { id: true } }) : null;
  const fav = buyer ? !!(await prisma.favourite.findFirst({ where: { buyerId: buyer.id, sellerId: s.id } })) : false;
  const certs: { name: string; number?: string }[] = (() => {
    try {
      const v = JSON.parse(s.certifications || '[]');
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  })();
  const cats = Array.from(new Map(s.products.filter((p) => p.category).map((p) => [p.category!.slug, p.category!])).values());
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Organization', name: s.companyName, url: absUrl(`/sellers/${s.slug}`), logo: s.logo ? absUrl(s.logo) : undefined, address: s.city || s.state ? { '@type': 'PostalAddress', addressLocality: s.city, addressRegion: s.state, addressCountry: 'IN' } : undefined, aggregateRating: s.ratingCount ? { '@type': 'AggregateRating', ratingValue: s.ratingAvg.toFixed(1), reviewCount: s.ratingCount } : undefined };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ListingHeader compact crumbs={[{ label: t('Sellers'), href: '/sellers' }, { label: s.companyName }]} eyebrow={s.businessType || t('Seller')} title={s.companyName} />
      <section className="theme-sand pb-16 pt-2 sm:pb-24">
        <div className="container-x">
          <div className="card relative overflow-hidden !rounded-[28px]">
            <div className="h-44 bg-[linear-gradient(135deg,#0f6b2f,#009a35_60%,#8fdba6)] sm:h-56">
              {s.banner && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.banner} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:p-7">
              <div className="-mt-16 grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-3xl bg-white font-display text-4xl font-bold text-gold-deep shadow-xl ring-4 ring-white">
                {s.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logo} alt={s.companyName} className="h-full w-full object-cover" />
                ) : (
                  s.companyName.charAt(0)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="flex flex-wrap items-center gap-2 font-display text-2xl font-semibold text-ink">
                  {s.companyName}
                  {s.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                      <BadgeCheck className="h-3.5 w-3.5" /> {t('Verified')}
                    </span>
                  )}
                </h2>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink/65">
                  {(s.city || s.state) && (
                    <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-gold-deep" /> {[s.city, s.state].filter(Boolean).join(', ')}</span>
                  )}
                  {s.yearEstablished && <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4 text-gold-deep" /> {t('Since')} {s.yearEstablished}</span>}
                  {s.employees && <span className="inline-flex items-center gap-1"><Users className="h-4 w-4 text-gold-deep" /> {s.employees} {t('employees')}</span>}
                  <span className="inline-flex items-center gap-1"><Package className="h-4 w-4 text-gold-deep" /> {s.products.length} {t('products')}</span>
                  {s.website && (
                    <a href={s.website} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 hover:text-gold-deep"><Globe className="h-4 w-4 text-gold-deep" /> {t('Website')}</a>
                  )}
                </div>
                <Rating value={s.ratingAvg} count={s.ratingCount} size="md" className="mt-2" />
              </div>
              <div className="flex flex-wrap gap-2">
                <FavButton sellerId={s.id} initial={fav} canSave={!!buyer} className="self-center" />
                <a href="#inquiry" className="btn btn-gold">{t('Send inquiry')}</a>
                {s.whatsapp && (
                  <a href={waLink(s.whatsapp, `Hello ${s.companyName}, I found you on SHRIJAIV.`)} target="_blank" rel="noopener noreferrer" className="btn btn-outline">WhatsApp</a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-8">
              {s.about && (
                <div className="card p-6 md:p-8">
                  <h3 className="font-display text-2xl font-semibold text-ink">{t('About')} {s.companyName}</h3>
                  <div className="rte mt-4" dangerouslySetInnerHTML={{ __html: safeArticleHtml(s.about) }} />
                </div>
              )}
              <div id="products">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-display text-2xl font-semibold text-ink">{t('Products')}</h3>
                  {cats.length > 1 && (
                    <div className="flex flex-wrap gap-1.5">
                      {cats.map((c) => (
                        <a key={c.slug} href={`#cat-${c.slug}`} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink/70 ring-1 ring-ink/10 hover:text-gold-deep">{c.name}</a>
                      ))}
                    </div>
                  )}
                </div>
                {s.products.length === 0 ? (
                  <p className="card mt-4 p-8 text-center text-sm text-ink/55">{t('This seller has not listed products yet. Send an inquiry to ask what they offer.')}</p>
                ) : (
                  <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {s.products.map((p, i) => (
                      <div key={p.id} id={p.category ? `cat-${p.category.slug}` : undefined}>
                        <ProductCard p={{ ...p, seller: { slug: s.slug, companyName: s.companyName, verified: s.verified, city: s.city, state: s.state } }} priority={i < 3} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="card p-6 md:p-8" id="reviews">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-display text-2xl font-semibold text-ink">{t('Buyer reviews')}</h3>
                  <Rating value={s.ratingAvg} count={s.ratingCount} size="md" />
                </div>
                {s.reviews.length === 0 ? <p className="mt-3 text-sm text-ink/55">{t('No reviews yet.')}</p> : (
                  <ul className="mt-5 divide-y divide-ink/5">
                    {s.reviews.map((r) => (
                      <li key={r.id} className="py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-ink">{r.authorName} {r.verifiedPurchase && <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.6rem] font-bold text-emerald-700">{t('Verified buyer')}</span>}</p>
                          <span className="text-xs text-ink/45">{formatDate(r.createdAt)}</span>
                        </div>
                        <Rating value={r.rating} className="mt-1" />
                        {r.title && <p className="mt-2 font-semibold text-ink">{r.title}</p>}
                        <p className="mt-1 text-sm leading-relaxed text-ink/75">{r.body}</p>
                        {r.reply && (
                          <div className="mt-3 rounded-2xl bg-ink/5 p-3 text-sm">
                            <p className="text-xs font-bold text-ink/50">{t('Reply from')} {s.companyName}</p>
                            <p className="mt-1 text-ink/75">{r.reply}</p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-6 border-t border-ink/5 pt-6">
                  <h4 className="mb-3 font-semibold text-ink">{t('Rate this seller')}</h4>
                  <ReviewForm sellerId={s.id} user={user && user.role === 'BUYER' ? { name: user.name } : null} guests={(await getMarketplace()).allowGuestReview} />
                </div>
              </div>
            </div>
            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="card p-5 md:p-6" id="inquiry">
                <p className="font-display text-xl font-semibold text-ink">{t('Contact')} {s.companyName}</p>
                <p className="mb-4 mt-1 text-sm text-ink/60">{t('Ask for a catalogue, prices or samples.')}</p>
                <InquiryForm sellerId={s.id} sellerName={s.companyName} user={user ? { name: user.name, email: user.email, phone: user.phone } : null} />
              </div>
              {certs.length > 0 && (
                <div className="card p-5 md:p-6">
                  <p className="font-display text-lg font-semibold text-ink">{t('Certifications')}</p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {certs.map((c, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" /> {c.name}{c.number ? <span className="text-ink/45"> · {c.number}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="card p-5 md:p-6 text-sm text-ink/70">
                <p className="font-display text-lg font-semibold text-ink">{t('Company details')}</p>
                <dl className="mt-3 space-y-2">
                  {s.businessType && <div className="flex justify-between gap-3"><dt className="text-ink/50">{t('Type')}</dt><dd className="font-semibold text-ink">{s.businessType}</dd></div>}
                  {s.gstNumber && <div className="flex justify-between gap-3"><dt className="text-ink/50">GST</dt><dd className="font-semibold text-ink">{s.verified ? s.gstNumber : t('Verified on request')}</dd></div>}
                  {s.fssaiNumber && <div className="flex justify-between gap-3"><dt className="text-ink/50">FSSAI</dt><dd className="font-semibold text-ink">{s.verified ? s.fssaiNumber : t('Verified on request')}</dd></div>}
                  {s.annualTurnover && <div className="flex justify-between gap-3"><dt className="text-ink/50">{t('Turnover')}</dt><dd className="font-semibold text-ink">{s.annualTurnover}</dd></div>}
                  <div className="flex justify-between gap-3"><dt className="text-ink/50">{t('Member since')}</dt><dd className="font-semibold text-ink">{formatDate(s.createdAt)}</dd></div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
