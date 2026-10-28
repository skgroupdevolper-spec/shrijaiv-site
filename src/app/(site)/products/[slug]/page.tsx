import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BadgeCheck, MapPin, Package, Truck, ShieldCheck, Clock, Tag } from 'lucide-react';
import { getI18n } from '@/lib/i18n/server';
import { getProduct, listProducts, images, priceLabel } from '@/lib/marketplace/data';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { absUrl } from '@/lib/seo';
import ListingHeader from '@/components/market/ListingHeader';
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
      <ListingHeader compact crumbs={[{ label: t('Products'), href: '/products' }, ...(p.category ? [{ label: p.category.name, href: `/category/${p.category.slug}` }] : []), { label: p.name }]} eyebrow={p.category?.name} title={p.name} />
      <section className="theme-sand pb-16 pt-4 sm:pb-24">
        <div className="container-x grid gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <Gallery images={imgs} alt={p.name} />
            {p.video && (
              <div className="card mt-4 overflow-hidden">
                {/\.(mp4|webm)(\?|$)/i.test(p.video) ? <video src={p.video} controls className="w-full" /> : <iframe src={p.video.replace('watch?v=', 'embed/')} className="aspect-video w-full" allowFullScreen title="Product video" />}
              </div>
            )}
          </div>
          <div>
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
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-display text-3xl font-semibold text-ink">{priceLabel(p)}</p>
              <FavButton productId={p.id} initial={fav} canSave={!!buyer} />
            </div>
            {p.ratingCount > 0 && <Rating value={p.ratingAvg} count={p.ratingCount} size="md" className="mt-2" />}
            {p.summary && <p className="mt-4 text-[1.02rem] leading-relaxed text-ink/75">{p.summary}</p>}
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
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
                  <div key={k} className="flex gap-2">
                    <I className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                    <div>
                      <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-ink/45">{k}</dt>
                      <dd className="font-semibold text-ink">{v}</dd>
                    </div>
                  </div>
                ))}
            </dl>

            <div className="card mt-8 p-5 md:p-6">
              <p className="font-display text-xl font-semibold text-ink">{t('Get the best price')}</p>
              <p className="mb-4 mt-1 text-sm text-ink/60">{t('Your inquiry goes straight to')} {s.companyName}.</p>
              <InquiryForm sellerId={s.id} sellerName={s.companyName} productId={p.id} productName={p.name} user={user ? { name: user.name, email: user.email, phone: user.phone } : null} compact />
              {s.whatsapp && (
                <a href={waLink(s.whatsapp, `Hello ${s.companyName}, I saw "${p.name}" on SHRIJAIV and would like a quote.`)} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-3 w-full">
                  {t('Chat on WhatsApp')}
                </a>
              )}
            </div>

            <SmartLink href={`/sellers/${s.slug}`} className="card card-lift mt-5 flex items-center gap-4 p-4">
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
              <span className="text-sm font-bold text-gold-deep">{t('Showroom')} →</span>
            </SmartLink>
          </div>
        </div>

        <div className="container-x mt-14 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-10">
            {p.description && (
              <div className="card p-6 md:p-8">
                <h2 className="font-display text-2xl font-semibold text-ink">{t('About this product')}</h2>
                <div className="rte mt-4" dangerouslySetInnerHTML={{ __html: safeArticleHtml(p.description) }} />
              </div>
            )}
            {specs.length > 0 && (
              <div className="card p-6 md:p-8">
                <h2 className="font-display text-2xl font-semibold text-ink">{t('Specifications')}</h2>
                <table className="table-nice mt-4 w-full text-sm">
                  <tbody>
                    {specs.map((r) => (
                      <tr key={r.label}>
                        <th className="w-1/3 py-2 pr-4 text-left font-semibold text-ink/60">{r.label}</th>
                        <td className="py-2 text-ink">{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="card p-6 md:p-8" id="reviews">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold text-ink">{t('Reviews')}</h2>
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
                <ReviewForm sellerId={s.id} productId={p.id} user={user && user.role === 'BUYER' ? { name: user.name } : null} />
              </div>
            </div>
          </div>
          <div className="space-y-10">
            {more.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">{t('More from')} {s.companyName}</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {more.map((x) => (
                    <ProductCard key={x.id} p={x} compact />
                  ))}
                </div>
              </div>
            )}
            {related.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">{t('Similar products')}</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {related.map((x) => (
                    <ProductCard key={x.id} p={x} compact />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
