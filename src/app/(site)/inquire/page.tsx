import type { Metadata } from 'next';
import { BadgeCheck, Clock, Languages, ShieldCheck } from 'lucide-react';
import { getI18n } from '@/lib/i18n/server';
import { getCategoryTree, INDIAN_STATES } from '@/lib/marketplace/data';
import ListingHeader from '@/components/market/ListingHeader';
import InquireForm from './InquireForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t('Inquire now — tell us what you need'), description: t('Send one inquiry and our team connects you with verified organic sellers across India. Free, reply within 24 hours.') };
}

/** /inquire — general inquiry (original "Inquire Now" page); goes to Admin → Leads with email to the team */
export default async function InquirePage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { t } = await getI18n();
  const { cat } = await searchParams;
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
