import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getI18n } from '@/lib/i18n/server';
import { getCategoryTree, flattenTree, getCategory, listSellers, INDIAN_STATES } from '@/lib/marketplace/data';
import { getMarketplace } from '@/lib/marketplace/settings';
import ListingHeader from '@/components/market/ListingHeader';
import Filters from '@/components/market/Filters';
import SellerCard from '@/components/market/SellerCard';
import Pagination from '@/components/market/Pagination';
import QuickChips from '@/components/market/QuickChips';
import ListingSwitch from '@/components/market/ListingSwitch';
import SmartLink from '@/components/ui/SmartLink';

export const dynamic = 'force-dynamic';
type SP = Promise<Record<string, string | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t('Verified organic sellers in India'), description: t('Find organic farmers, manufacturers, wholesalers and exporters across India. Visit their showrooms and send inquiries directly.') };
}

export default async function SellersPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { t } = await getI18n();
  const [tree, mp] = await Promise.all([getCategoryTree(), getMarketplace()]);
  const cat = sp.cat ? await getCategory(sp.cat) : null;
  const res = await listSellers({ q: sp.q, categoryIds: cat?.ids, state: sp.state, verified: sp.verified === '1', businessType: sp.type, page: Number(sp.page) || 1 });
  return (
    <>
      <ListingHeader crumbs={[{ label: t('Sellers') }]} eyebrow={t('Marketplace')} title={sp.q ? `${t('Sellers for')} “${sp.q}”` : t('Organic sellers')} lead={t('Farmers, FPOs, manufacturers, wholesalers and exporters — verified by our team. Visit a showroom and contact the seller directly.')} right={<SmartLink href="/register?as=seller" className="btn btn-gold">{t('Become a seller')}</SmartLink>} />
      <section className="section theme-sand !pt-8">
        <div className="container-x">
          <ListingSwitch active="supplier" supplierLabel={t('Supplier')} buyerLabel={t('Buyer')} />
          <QuickChips
            base="/sellers"
            params={sp}
            chips={[
              { label: t('All sellers') },
              { label: t('Verified'), key: 'verified', value: '1' },
              ...tree.map((c) => ({ label: c.name, key: 'cat', value: c.slug })),
              ...mp.sellerTypes.slice(0, 6).map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), key: 'type', value: s })),
            ]}
          />
          <Suspense>
            <Filters
              total={res.total}
              kindLabel={t('sellers')}
              defs={[
                { key: 'q', label: t('Search'), type: 'text' },
                { key: 'cat', label: t('Sells in category'), type: 'select', options: flattenTree(tree).map((c) => ({ value: c.slug, label: c.parentId ? `– ${c.name}` : c.name })) },
                { key: 'type', label: t('Business type'), type: 'select', options: mp.sellerTypes.map((s) => ({ value: s, label: s })) },
                { key: 'state', label: t('State'), type: 'select', options: INDIAN_STATES.map((s) => ({ value: s, label: s })) },
                { key: 'verified', label: t('Verified'), type: 'check', options: [{ value: '1', label: t('Verified sellers only') }] },
              ]}
            >
              {res.items.length === 0 ? (
                <div className="card p-10 text-center">
                  <p className="font-display text-2xl font-semibold text-ink">{t('No sellers found')}</p>
                  <p className="mt-2 text-ink/60">{t('Try fewer filters, or post a requirement and sellers will contact you.')}</p>
                  <SmartLink href="/post-requirement" className="btn btn-gold mt-6">{t('Post a requirement')}</SmartLink>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {res.items.map((s) => (
                    <SellerCard key={s.id} s={s} />
                  ))}
                </div>
              )}
              <Pagination page={res.page} pages={res.pages} base="/sellers" params={sp} />
            </Filters>
          </Suspense>
        </div>
      </section>
    </>
  );
}
