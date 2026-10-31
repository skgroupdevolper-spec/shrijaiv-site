import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BadgeCheck, MapPin, Package, Truck, ShieldCheck, Clock, Tag, Building2, FileCheck2, Users, CalendarDays, ChevronLeft, MessageCircle, Send, ChevronRight } from 'lucide-react';
import { getI18n } from '@/lib/i18n/server';
import { getProduct, listProducts, images, priceLabel } from '@/lib/marketplace/data';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getMarketplace } from '@/lib/marketplace/settings';
import { absUrl } from '@/lib/seo';
import Gallery from '@/components/market/Gallery';
import InquiryForm from '@/components/market/InquiryForm';
import ReviewForm from '@/components/market/ReviewForm';
import ProductCard from '@/components/market/ProductCard';
import { Rating } from '@/components/market/Rating';
import FavButton from '@/components/market/FavButton';
import SmartLink from '@/components/ui/SmartLink';
import { formatDate, waLink } from '@/lib/utils';
import { safeArticleHtml } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: 'Product not found' };
  const img = images(p.images)[0];
  const desc = (p.metaDescription || p.summary || `${p.name} by ${p.seller.companyName}${p.seller.state ? `, ${p.seller.state}` : ''}. ${priceLabel(p)}${p.moq ? ` · MOQ ${p.moq}` : ''}.`).slice(0, 160);
  return { title: p.metaTitle ? { absolute: p.metaTitle } : `${p.name} — ${p.seller.companyName}`, description: desc, openGraph: { type: 'website', title: p.name, description: desc, images: img ? [absUrl(img)!] : undefined } };
}

function parse<T>(json: string | null | undefined, fb: T): T {
  try {
    const v = JSON.parse(json || '');
    return (v ?? fb) as T;
  } catch {
    return fb;
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const { t } = await getI18n();
  const p = await getProduct(slug);
  if (!p) notFound();
  prisma.product.update({ where: { id: p.id }, data: { views: { increment: 1 } } }).catch(() => null);
  const user = await getCurrentUser();
  const buyer = user?.role === 'BUYER' ? await prisma.buyerProfile.findUnique({ where: { userId: user.id }, select: { id: true } }) : null;
  const fav = buyer ? !!(await prisma.favourite.findFirst({ where: { buyerId: buyer.id, productId: p.id } })) : false;
  const imgs = images(p.images);
  const specs = parse<{ label: string; value: string }[]>(p.specs, []);
  const certs = parse<string[]>(p.certifications, []);
  const related = (await listProducts({ categoryIds: p.categoryId ? [p.categoryId] : undefined, take: 5 })).items.filter((x) => x.id !== p.id).slice(0, 4);
  const more = (await listProducts({ sellerId: p.sellerId, take: 5 })).items.filter((x) => x.id !== p.id).slice(0, 4);
  const s = p.seller;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: imgs.map((i) => absUrl(i)),
    description: p.summary || undefined,
    brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
    offers: p.priceMin != null ? { '@type': 'AggregateOffer', priceCurrency: 'INR', lowPrice: p.priceMin, highPrice: p.priceMax ?? p.priceMin, offerCount: 1, seller: { '@type': 'Organization', name: s.companyName } } : undefined,
    aggregateRating: p.ratingCount ? { '@type': 'AggregateRating', ratingValue: p.ratingAvg.toFixed(1), reviewCount: p.ratingCount } : undefined,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* slim breadcrumb (all screens) — the product itself starts right below the header */}
      <div className="pdp-top container-x pb-3 pt-[6.6rem] sm:pt-[7.4rem]">
        <SmartLink href={p.category ? `/category/${p.category.slug}` : '/products'} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[0.8rem] font-semibold text-ink shadow-sm ring-1 ring-ink/5 sm:hidden">
          <ChevronLeft className="h-4 w-4" /> {p.category?.name || t('Products')}
        </SmartLink>
        <nav aria-label="Breadcrumb" className="hidden flex-wrap items-center gap-1.5 text-[0.82rem] text-ink/55 sm:flex">
          <SmartLink href="/" className="hover:text-ink">{t('Home')}</SmartLink>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <SmartLink href="/products" className="hover:text-ink">{t('Products')}</SmartLink>
          {p.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5 opacity-50" />
              <SmartLink href={`/category/${p.category.slug}`} className="hover:text-ink">{p.category.name}</SmartLink>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <span className="line-clamp-1 text-ink">{p.name}</span>
        </nav>
      </div>
      <section className="pdp theme-sand pb-28 pt-1 sm:pb-24 lg:pt-3">
        <div className="container-x grid items-start gap-6 sm:gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12 [&>*]:min-w-0">
          {/* the gallery stays in view while the details on the right scroll */}
          <div className="pdp-in lg:sticky lg:top-28" style={{ ['--d' as any]: '0s' }}>
            <Gallery images={imgs} alt={p.name} />
            {p.video && (
              <div className="card mt-4 overflow-hidden">
                {/\.(mp4|webm)(\?|$)/i.test(p.video) ? <video src={p.video} controls className="w-full" /> : <iframe src={p.video.replace('watch?v=', 'embed/')} className="aspect-video w-full" allowFullScreen title="Product video" />}
              </div>
            )}
          </div>
          <div>
            {p.category && <p className="pdp-in text-[0.7rem] font-extrabold uppercase tracking-[0.2em] text-gold-deep" style={{ ['--d' as any]: '.05s' }}>{p.category.name}</p>}
            <h1 className="pdp-in mb-3 mt-1.5 font-display text-[1.55rem] font-semibold leading-[1.12] tracking-tight text-ink sm:text-[2.1rem] lg:text-[2.4rem]" style={{ ['--d' as any]: '.1s' }}>{p.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {s.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                  <BadgeCheck className="h-3.5 w-3.5" /> {t('Verified seller')}
                </span>
              )}
              {certs.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink/70 ring-1 ring-ink/10">
                  <ShieldCheck className="h-3.5 w-3.5 text-gold-deep" /> {c}
                </span>
              ))}
            </div>
            <div className="pdp-price pdp-in mt-4" style={{ ['--d' as any]: '.2s' }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-ink/45">{t('Price')}</p>
                  <p className="font-display text-[1.7rem] font-semibold leading-tight text-gold-deep sm:text-3xl">{priceLabel(p)}</p>
                  {p.moq && <p className="mt-0.5 text-sm text-ink/60">{t('Minimum order')}: <b className="text-ink">{p.moq}</b></p>}
                </div>
                <FavButton productId={p.id} initial={fav} canSave={!!buyer} />
              </div>
              {p.ratingCount > 0 && (
                <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-ink/60">
                  <Rating value={p.ratingAvg} count={p.ratingCount} size="md" />
                </a>
              )}
            </div>
            {p.summary && <p className="mt-4 text-[1.02rem] leading-relaxed text-ink/75">{p.summary}</p>}
            <dl className="pdp-in mt-5 grid grid-cols-2 gap-2 text-sm sm:gap-3" style={{ ['--d' as any]: '.28s' }}>
              {[
                [Package, t('MOQ'), p.moq],
                [Tag, t('Brand'), p.brand],
                [MapPin, t('Origin'), p.origin || s.state],
                [Truck, t('Lead time'), p.leadTime],
                [Clock, t('Shelf life'), p.shelfLife],
                [Package, t('Packaging'), p.packaging],
                [Tag, t('Availability'), p.stock],
              ]
                .filter((r) => r[2])
                .map(([I, k, v]: any) => (
                  <div key={k} className="flex min-w-0 gap-2 rounded-2xl bg-white p-3 ring-1 ring-ink/5">
                    <I className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                    <div className="min-w-0">
                      <dt className="text-[0.62rem] font-bold uppercase tracking-wider text-ink/45">{k}</dt>
                      <dd className="break-words text-[0.85rem] font-semibold leading-snug text-ink">{v}</dd>
                    </div>
                  </div>
                ))}
            </dl>

            <div id="inquiry" className="pdp-in card mt-6 scroll-mt-28 p-5 md:mt-8 md:p-6" style={{ ['--d' as any]: '.36s' }}>
              <p className="font-display text-xl font-semibold text-ink">{t('Get the best price')}</p>
              <p className="mb-4 mt-1 text-sm text-ink/60">{(await getMarketplace()).approval?.inquiries ? `${t('Our team verifies your inquiry and forwards it to')} ${s.companyName}.` : `${t('Your inquiry goes straight to')} ${s.companyName}.`}</p>
              <InquiryForm sellerId={s.id} sellerName={s.companyName} productId={p.id} productName={p.name} user={user ? { name: user.name, email: user.email, phone: user.phone } : null} compact />
              {s.whatsapp && (
                <a href={waLink(s.whatsapp, `Hello ${s.companyName}, I saw "${p.name}" on SHRIJAIV and would like a quote.`)} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-3 w-full">
                  {t('Chat on WhatsApp')}
                </a>
              )}
            </div>

            <SmartLink href={`/sellers/${s.slug}`} className="card card-lift mt-5 flex items-center gap-3 p-4 sm:gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#eaf5ec] font-display text-xl font-bold text-gold-deep">
                {s.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logo} alt={s.companyName} className="h-full w-full object-cover" />
                ) : (
                  s.companyName.charAt(0)
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 font-semibold text-ink">
                  <span className="truncate">{s.companyName}</span>
                  {s.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />}
                </p>
                <p className="text-xs text-ink/55">
                  {s.businessType || t('Seller')}
                  {s.city || s.state ? ` · ${[s.city, s.state].filter(Boolean).join(', ')}` : ''}
                  {s.yearEstablished ? ` · ${t('since')} ${s.yearEstablished}` : ''}
                </p>
                <Rating value={s.ratingAvg} count={s.ratingCount} className="mt-1" />
              </div>
              <span className="hidden text-sm font-bold text-gold-deep sm:inline">{t('Showroom')} →</span>
              <ChevronRight className="h-5 w-5 shrink-0 text-gold-deep sm:hidden" />
            </SmartLink>

            {/* Verified supplier details — like the info box on the original product page */}
            <div className="glass mt-5 overflow-hidden rounded-[22px] ring-1 ring-ink/5">
              <div className="flex items-center gap-2 bg-gold px-5 py-3 text-sm font-bold text-white">
                <BadgeCheck className="h-4 w-4" /> {s.verified ? t('Verified supplier details') : t('Supplier details')}
              </div>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 p-5 text-sm sm:grid-cols-2">
                {[
                  [Building2, t('Business type'), s.businessType ? s.businessType.charAt(0).toUpperCase() + s.businessType.slice(1) : null],
                  [CalendarDays, t('Year established'), s.yearEstablished],
                  [Users, t('Employees'), s.employees],
                  [FileCheck2, t('GST'), s.gstNumber ? (s.verified ? t('Verified') : t('Submitted')) : null],
                  [FileCheck2, t('FSSAI'), s.fssaiNumber ? (s.verified ? t('Verified') : t('Submitted')) : null],
                  [MapPin, t('Location'), [s.city, s.state].filter(Boolean).join(', ') || null],
                  [ShieldCheck, t('Certifications'), certs.length ? certs.join(', ') : null],
                  [Clock, t('Response time'), t('Usually within 24 hours')],
                ]
                  .filter((r) => r[2])
                  .map(([I, k, v]: any) => (
                    <div key={k} className="flex items-start gap-2">
                      <I className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                      <div className="min-w-0">
                        <dt className="text-[0.66rem] font-bold uppercase tracking-wider text-ink/45">{k}</dt>
                        <dd className="truncate font-semibold text-ink">{v}</dd>
                      </div>
                    </div>
                  ))}
              </dl>
            </div>
          </div>
        </div>

        <div className="container-x mt-10 grid gap-8 lg:mt-14 lg:grid-cols-[1.4fr_1fr] lg:gap-10 [&>*]:min-w-0">
          <div className="space-y-10">
            {p.description && (
              <div className="card p-5 md:p-8">
                <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">{t('About this product')}</h2>
                <div className="rte mt-4 break-words" dangerouslySetInnerHTML={{ __html: safeArticleHtml(p.description) }} />
              </div>
            )}
            {specs.length > 0 && (
              <div className="card p-5 md:p-8">
                <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">{t('Specifications')}</h2>
                <table className="table-nice mt-4 w-full table-fixed text-sm">
                  <tbody>
                    {specs.map((r) => (
                      <tr key={r.label}>
                        <th className="w-2/5 break-words py-2 pr-4 text-left align-top font-semibold text-ink/60">{r.label}</th>
                        <td className="break-words py-2 text-ink">{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="card p-5 md:p-8" id="reviews">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">{t('Reviews')}</h2>
                <Rating value={p.ratingAvg} count={p.ratingCount} size="md" />
              </div>
              {p.reviews.length === 0 ? <p className="mt-3 text-sm text-ink/55">{t('No reviews yet — be the first buyer to share your experience.')}</p> : (
                <ul className="mt-5 divide-y divide-ink/5">
                  {p.reviews.map((r) => (
                    <li key={r.id} className="py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-ink">
                          {r.authorName} {r.verifiedPurchase && <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.6rem] font-bold text-emerald-700">{t('Verified buyer')}</span>}
                        </p>
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
                <h3 className="mb-3 font-semibold text-ink">{t('Write a review')}</h3>
                <ReviewForm sellerId={s.id} productId={p.id} user={user && user.role === 'BUYER' ? { name: user.name } : null} guests={(await getMarketplace()).allowGuestReview} />
              </div>
            </div>
          </div>
          <div className="space-y-10">
            {more.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">{t('More from')} {s.companyName}</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-1 xl:grid-cols-2">
                  {more.map((x) => (
                    <ProductCard key={x.id} p={x} compact />
                  ))}
                </div>
              </div>
            )}
            {related.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">{t('Similar products')}</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-1 xl:grid-cols-2">
                  {related.map((x) => (
                    <ProductCard key={x.id} p={x} compact />
                  ))}
                </div>
              </div>
            )}
            <SmartLink href="/pricing" className="tilt card card-lift block overflow-hidden" data-tilt="4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/site/ad-square.png" alt={t('Advertise your organic business on SHRIJAIV')} className="aspect-square w-full object-cover" />
            </SmartLink>
          </div>
        </div>
      </section>
      {/* phones: price + actions always at hand */}
      <div className="pdp-cta lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.95rem] font-bold text-gold-deep">{priceLabel(p)}</p>
          <p className="truncate text-[0.68rem] text-ink/55">{p.moq ? `${t('MOQ')}: ${p.moq}` : s.companyName}</p>
        </div>
        {s.whatsapp && (
          <a href={waLink(s.whatsapp, `Hello ${s.companyName}, I saw "${p.name}" on SHRIJAIV and would like a quote.`)} target="_blank" rel="noopener noreferrer" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#25D366] text-white shadow" aria-label={t('Chat on WhatsApp')}>
            <MessageCircle className="h-5 w-5" />
          </a>
        )}
        <a href="#inquiry" className="btn btn-gold !min-h-[44px] shrink-0 !rounded-2xl !px-4 text-sm">
          <Send className="h-4 w-4" /> {t('Get best price')}
        </a>
      </div>
    </>
  );
}
