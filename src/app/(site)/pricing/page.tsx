import type { Metadata } from 'next';
import { getI18n } from '@/lib/i18n/server';
import { getLocalizedBundle } from '@/lib/settings';
import { getLocale } from '@/lib/i18n/server';
import { getPage } from '@/lib/data';
import BlockRenderer from '@/components/blocks/BlockRenderer';
import { Plans } from '@/components/blocks/MarketBlocks';
import ListingHeader from '@/components/market/ListingHeader';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t('Membership plans for sellers'), description: t('Choose a plan to list more products, unlock buyer contacts and get the Verified badge. Monthly, yearly and lifetime options.') };
}

/** /pricing: the "pricing" page from the page builder when the admin made one, otherwise the plans block */
export default async function PricingPage() {
  const locale = await getLocale();
  const [{ site }, page, { t }] = await Promise.all([getLocalizedBundle(locale), getPage('pricing'), getI18n()]);
  if (page && page.status === 'published') return <BlockRenderer blocks={page.blocks} site={site} />;
  return (
    <>
      <ListingHeader crumbs={[{ label: t('Pricing') }]} eyebrow={t('For sellers')} title={t('Membership plans')} lead={t('Start free. Upgrade when you need more products, more buyer contacts or a Verified badge.')} />
      <Plans data={{ theme: 'sand', freeBanner: true }} site={site} />
    </>
  );
}
