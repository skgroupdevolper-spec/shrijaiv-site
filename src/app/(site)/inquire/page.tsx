import type { Metadata } from 'next';
import { BadgeCheck, Clock, Languages, ShieldCheck } from 'lucide-react';
import { getI18n } from '@/lib/i18n/server';
import { getCategoryTree, INDIAN_STATES, getProduct, images, priceLabel } from '@/lib/marketplace/data';
import { getCurrentUser } from '@/lib/auth';
import InquiryForm from '@/components/market/InquiryForm';
import { Rating } from '@/components/market/Rating';
import SmartLink from '@/components/ui/SmartLink';
import ListingHeader from '@/components/market/ListingHeader';
import InquireForm from './InquireForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t('Inquire now — tell us what you need'), description: t('Send one inquiry and our team connects you with verified organic sellers across India. Free, reply within 24 hours.') };
}

/** /inquire — general inquiry (original "Inquire Now" page); goes to Admin → Leads with email to the team */
export default async function InquirePage({ searchParams }: { searchParams: Promise<{ cat?: string; product?: string }> }) {
  const { t } = await getI18n();
  const { cat, product: productSlug } = await searchParams;
  const product = productSlug ? await getProduct(productSlug) : null;
  if (product) {
    const user = await getCurrentUser();
    const img = images(product.images)[0];
    return (
      <>
        <ListingHeader compact crumbs={[{ label: t('Products'), href: '/products' }, { label: product.name, href: `/products/${product.slug}` }, { label: t('Inquire Now') }]} eyebrow={t('Inquire Now')} title={`${t('Sending inquiry for')}: ${product.name}`} />
        <section className="section theme-sand !pt-6">
          <div className="container-x grid items-start gap-8 lg:grid-cols-[300px_1fr]">
            <SmartLink href={`/products/${product.slug}`} className="card card-lift block p-4 lg:sticky lg:top-28">
              <div className="grid aspect-square place-items-center rounded-2xl bg-[radial-gradient(circle_at_30%_20%,#fff,#eef5f0_75%)]">
                {img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={product.name} className="h-[85%] w-[85%] object-contain" />
                )}
              </div>
              <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-wider text-emerald-700">Organic</span>
              <p className="mt-2 font-display text-lg font-semibold leading-snug text-ink">{product.name}</p>
              <p className="text-sm font-bold text-gold-deep">{priceLabel(product)}</p>
              <Rating value={product.ratingAvg} count={product.ratingCount} className="mt-1" />
              <p className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ring-1 ring-ink/15">
                {product.seller.state || 'India'}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/site/india.png" alt="" className="h-4 w-4" />
              </p>
            </SmartLink>
            <div className="card p-6 sm:p-8">
              <p className="mb-4 font-display text-xl font-semibold text-ink">{t('Your details')}</p>
              <InquiryForm sellerId={product.seller.id} sellerName={product.seller.companyName} productId={product.id} productName={product.name} user={user ? { name: user.name, email: user.email, phone: user.phone } : null} />
            </div>
          </div>
        </section>
      </>
    );
  }
  const tree = await getCategoryTree().catch(() => []);
  const cats = tree.flatMap((c) => [c.name, ...c.children.map((x) => x.name)]);
  return (
    <>
      <ListingHeader compact crumbs={[{ label: t('Inquire Now') }]} eyebrow={t('Free for buyers')} title={t('Inquire Now')} lead={t('Tell us what you need — our team connects you with verified organic sellers and replies within 24 hours.')} />
      <section className="section theme-sand !pt-6">
        <div className="container-x grid items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="card p-6 sm:p-8">
            <InquireForm states={[...INDIAN_STATES]} categories={cats} defaultCategory={cats.find((c) => c.toLowerCase().replace(/[^a-z]+/g, '-') === cat)} />
          </div>
          <aside className="space-y-4 lg:sticky lg:top-28">
            {[
              [BadgeCheck, t('Verified sellers only'), t('GST, FSSAI and organic certificates checked by our team.')],
              [Clock, t('Reply within 24 hours'), t('By email, phone or WhatsApp — whatever suits you.')],
              [ShieldCheck, t('No commission'), t('Deal directly with the seller. Your details are never sold.')],
              [Languages, t('Your language'), t('Write in any of 12 Indian languages.')],
            ].map(([I, h, p]: any) => (
              <div key={h} className="card flex items-start gap-4 p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold/10 text-gold-deep"><I className="h-5 w-5" /></span>
                <span>
                  <span className="block font-semibold text-ink">{h}</span>
                  <span className="mt-0.5 block text-sm text-ink/60">{p}</span>
                </span>
              </div>
            ))}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/site/inquire.png" alt="" className="mx-auto w-full max-w-sm" loading="lazy" />
          </aside>
        </div>
      </section>
    </>
  );
}
