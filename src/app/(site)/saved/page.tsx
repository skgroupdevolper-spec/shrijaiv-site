import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getI18n } from '@/lib/i18n/server';
import { getCurrentUser } from '@/lib/auth';
import ListingHeader from '@/components/market/ListingHeader';
import SavedList from './SavedList';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t('Saved products & sellers'), robots: { index: false } };
}

/** /saved — a visitor's saved products and sellers (kept in their browser). Buyers go to their Favourites. */
export default async function SavedPage() {
  const { t } = await getI18n();
  const user = await getCurrentUser();
  if (user?.role === 'BUYER') redirect('/buyer/favourites');
  return (
    <>
      <ListingHeader compact crumbs={[{ label: t('Saved') }]} eyebrow={t('Your list')} title={t('Saved products & sellers')} lead={t('Everything you tapped “Save” on. Send inquiries when you are ready.')} />
      <section className="section theme-sand !pt-6">
        <div className="container-x">
          <SavedList />
        </div>
      </section>
    </>
  );
}
