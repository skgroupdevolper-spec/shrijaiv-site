import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getI18n } from '@/lib/i18n/server';
import { getCategoryTree, flattenTree, getCategory, listProducts, INDIAN_STATES } from '@/lib/marketplace/data';
import ListingHeader from '@/components/market/ListingHeader';
import Filters from '@/components/market/Filters';
import ProductCard from '@/components/market/ProductCard';
import Pagination from '@/components/market/Pagination';
import QuickChips from '@/components/market/QuickChips';
import ListingSwitch from '@/components/market/ListingSwitch';
import ContactAdminForm from '@/components/market/ContactAdminForm';
import SmartLink from '@/components/ui/SmartLink';

export const dynamic = 'force-dynamic';
type SP = Promise<Record<string, string | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { t } = await getI18n();
  const sp = await searchParams;
  return { title: sp.q ? `${sp.q} — ${t('Organic products')}` : t('Organic products from verified sellers'), description: t('Browse organic agriculture, beauty and processed-food products from verified Indian sellers. Compare prices, MOQ and send inquiries directly.') };
}

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { t } = await getI18n();
  const tree = await getCategoryTree();
  const cat = sp.cat ? await getCategory(sp.cat) : null;
  const res = await listProducts({
    q: sp.q,
    categoryIds: cat?.ids,
    state: sp.state,
    verified: sp.verified === '1',
    minPrice: sp.min ? Number(sp.min) : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
    sort: (sp.sort as any) || 'new',
    page: Number(sp.page) || 1,
  });
  const cats = flattenTree(tree).map((c) => ({ value: c.slug, label: c.parentId ? `– ${c.name}` : c.name }));
  return (
    <>
      <ListingHeader crumbs={[{ label: t('Products') }]} eyebrow={t('Marketplace')} title={cat ? cat.node.name : sp.q ? `${t('Results for')} “${sp.q}”` : t('Organic products')} lead={cat?.node.description || t('Every product is listed by a seller on SHRIJAIV. Send an inquiry to get prices, samples and delivery details.')} />
      <section className="section theme-sand !pt-8">
        <div className="container-x">
          <ListingSwitch active="supplier" supplierLabel={t('Supplier')} buyerLabel={t('Buyer')} />
          <QuickChips
            base="/products"
            params={sp}
            chips={[
              { label: t('All products') },
              { label: t('Verified sellers'), key: 'verified', value: '1' },
              { label: t('Best rated'), key: 'sort', value: 'rating' },
              ...tree.map((c) => ({ label: c.name, key: 'cat', value: c.slug })),
              ...tree.flatMap((c) => c.children.filter((x) => x.featured)).slice(0, 6).map((c) => ({ label: c.name, key: 'cat', value: c.slug })),
            ]}
          />
          <Suspense>
            <Filters
              total={res.total}
              kindLabel={t('products')}
              sorts={[
                { value: '', label: t('Newest') },
                { value: 'popular', label: t('Most viewed') },
                { value: 'rating', label: t('Best rated') },
                { value: 'price_asc', label: t('Price: low to high') },
                { value: 'price_desc', label: t('Price: high to low') },
              ]}
              defs={[
                { key: 'q', label: t('Search'), type: 'text' },
                { key: 'cat', label: t('Category'), type: 'select', options: cats },
                { key: 'state', label: t('Seller state'), type: 'select', options: INDIAN_STATES.map((s) => ({ value: s, label: s })) },
                { key: 'verified', label: t('Verified'), type: 'check', options: [{ value: '1', label: t('Verified sellers only') }] },
                { key: 'min', label: t('Min price (₹)'), type: 'text' },
                { key: 'max', label: t('Max price (₹)'), type: 'text' },
              ]}
            >
              {res.items.length === 0 ? (
                <div className="card p-10 text-center">
                  <p className="font-display text-2xl font-semibold text-ink">{t('No products found')}</p>
                  <p className="mt-2 text-ink/60">{t('Try another search, or post a requirement and let sellers come to you.')}</p>
                  <SmartLink href="/post-requirement" className="btn btn-gold mt-6">{t('Post a requirement')}</SmartLink>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                  {res.items.map((p, i) => (
                    <ProductCard key={p.id} p={p} priority={i < 3} />
                  ))}
                </div>
              )}
              <Pagination page={res.page} pages={res.pages} base="/products" params={sp} />
            </Filters>
          </Suspense>
          {/* "All your need please inquire here" + offer banner (original Buyer page) */}
          <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="card p-6 sm:p-8">
              <ContactAdminForm subject="Sourcing inquiry (Shop page)" title={t('All your needs — please inquire here')} />
            </div>
            <SmartLink href="/pricing" className="tilt group relative block overflow-hidden rounded-[24px] shadow-lg" data-tilt="4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/site/ad-square.png" alt={t('Advertise on SHRIJAIV')} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            </SmartLink>
          </div>
        </div>
      </section>
    </>
  );
}
