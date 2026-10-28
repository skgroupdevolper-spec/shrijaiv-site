import type { Metadata } from 'next';
import { BadgeCheck, Quote } from 'lucide-react';
import { getI18n } from '@/lib/i18n/server';
import { prisma } from '@/lib/db';
import { getTestimonials } from '@/lib/data';
import ListingHeader from '@/components/market/ListingHeader';
import { Rating } from '@/components/market/Rating';
import SmartLink from '@/components/ui/SmartLink';
import { formatDate } from '@/lib/utils';
import { images } from '@/lib/marketplace/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t('Reviews — what buyers say about SHRIJAIV sellers'), description: t('Real ratings and reviews from buyers across India, plus what members say about the SHRIJAIV marketplace.') };
}

/** /reviews — every approved buyer review (with product + seller) and the member testimonials */
export default async function ReviewsPage() {
  const { t } = await getI18n();
  const [reviews, testimonials, agg] = await Promise.all([
    prisma.review.findMany({ where: { status: 'approved' }, orderBy: { createdAt: 'desc' }, take: 60, include: { product: { select: { slug: true, name: true, images: true } }, seller: { select: { slug: true, companyName: true, verified: true, state: true } } } }),
    getTestimonials(),
    prisma.review.aggregate({ where: { status: 'approved' }, _avg: { rating: true }, _count: true }),
  ]);
  const avg = agg._avg.rating || 0;
  return (
    <>
      <ListingHeader
        crumbs={[{ label: t('Reviews') }]}
        eyebrow={t('Trust')}
        title={t('Ratings & reviews')}
        lead={t('Every review is written by a buyer who contacted the seller through SHRIJAIV. Sellers can reply; our team removes spam.')}
        right={
          agg._count ? (
            <div className="card flex items-center gap-4 px-5 py-4">
              <span className="font-display text-4xl font-semibold text-ink">{avg.toFixed(1)}</span>
              <span>
                <Rating value={avg} size="md" />
                <span className="mt-1 block text-xs text-ink/55">{agg._count} {t('buyer reviews')}</span>
              </span>
            </div>
          ) : undefined
        }
      />
      <section className="section theme-sand !pt-8">
        <div className="container-x">
          {reviews.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="font-display text-2xl font-semibold text-ink">{t('No reviews yet')}</p>
              <p className="mt-2 text-ink/60">{t('Buyers can rate a seller after sending an inquiry.')}</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {reviews.map((r) => {
                const img = r.product ? images(r.product.images)[0] : '';
                return (
                  <article key={r.id} className="card card-lift tilt flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">
                          {r.authorName}
                          {r.verifiedPurchase && <span className="ms-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.6rem] font-bold text-emerald-700">{t('Verified buyer')}</span>}
                        </p>
                        <p className="text-xs text-ink/45">{formatDate(r.createdAt)}</p>
                      </div>
                      <Rating value={r.rating} />
                    </div>
                    {r.title && <p className="mt-3 font-display text-[1.05rem] font-semibold text-ink">{r.title}</p>}
                    <p className="mt-1.5 line-clamp-5 text-sm leading-relaxed text-ink/75">{r.body}</p>
                    {r.reply && (
                      <div className="mt-3 rounded-2xl bg-ink/5 p-3 text-sm">
                        <p className="text-xs font-bold text-ink/50">{t('Reply from')} {r.seller.companyName}</p>
                        <p className="mt-1 line-clamp-3 text-ink/75">{r.reply}</p>
                      </div>
                    )}
                    <div className="mt-auto flex items-center gap-3 border-t border-ink/5 pt-4">
                      {r.product ? (
                        <SmartLink href={`/products/${r.product.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f4f7f4]">
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={img} alt="" className="h-full w-full object-contain p-1" />
                            ) : (
                              <Quote className="h-5 w-5 text-gold" />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-ink">{r.product.name}</span>
                            <span className="flex items-center gap-1 truncate text-xs text-ink/55">{r.seller.companyName} {r.seller.verified && <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />}</span>
                          </span>
                        </SmartLink>
                      ) : (
                        <SmartLink href={`/sellers/${r.seller.slug}`} className="flex items-center gap-1 text-sm font-semibold text-ink">{r.seller.companyName} {r.seller.verified && <BadgeCheck className="h-4 w-4 text-emerald-600" />}</SmartLink>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
      {testimonials.length > 0 && (
        <section className="section theme-light">
          <div className="container-x">
            <div className="reveal mb-8 text-center">
              <p className="eyebrow">{t('Members')}</p>
              <h2 className="h-display mt-2 text-[clamp(1.6rem,1rem+2vw,2.6rem)]">{t('What members say about SHRIJAIV')}</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {testimonials.map((x: any) => (
                <figure key={x.id} className="card card-lift tilt reveal flex h-full flex-col p-6">
                  <Rating value={x.rating} />
                  <blockquote className="mt-3 flex-1 text-[0.98rem] leading-relaxed text-ink/80">“{x.text}”</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    {x.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={x.avatar} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow" />
                    ) : (
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/15 font-bold text-gold-deep">{x.name.charAt(0)}</span>
                    )}
                    <span>
                      <span className="block font-semibold text-ink">{x.name}</span>
                      <span className="block text-xs text-ink/55">{[x.role, x.country].filter(Boolean).join(' · ')}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
