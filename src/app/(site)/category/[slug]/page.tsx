import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getI18n } from '@/lib/i18n/server';
import { getCategory, listProducts, INDIAN_STATES } from '@/lib/marketplace/data';
import ListingHeader from '@/components/market/ListingHeader';
import Filters from '@/components/market/Filters';
import ProductCard from '@/components/market/ProductCard';
import Pagination from '@/components/market/Pagination';
import SmartLink from '@/components/ui/SmartLink';
import { Icon } from '@/components/ui/Icon';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCategory(slug);
  if (!c) return { title: 'Category not found' };
  return { title: c.node.name + ' — organic products & sellers', description: c.node.description || `Buy organic ${c.node.name.toLowerCase()} from verified Indian sellers. Compare prices and send inquiries on SHRIJAIV.` };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const { t } = await getI18n();
  const c = await getCategory(slug);
  if (!c) notFound();
  const res = await listProducts({ q: sp.q, categoryIds: c.ids, state: sp.state, verified: sp.verified === '1', sort: (sp.sort as any) || 'new', page: Number(sp.page) || 1 });
  const crumbs = c.trail.map((n, i) => (i === c.trail.length - 1 ? { label: n.name } : { label: n.name, href: `/category/${n.slug}` }));
  return (
    <>
      <ListingHeader crumbs={[{ label: t('Products'), href: '/products' }, ...crumbs]} eyebrow={c.trail.length > 1 ? c.trail[c.trail.length - 2].name : t('Category')} title={c.node.name} lead={c.node.description || undefined} />
      {c.node.children.length > 0 && (
        <section className="theme-light pb-2">
          <div className="container-x flex flex-wrap gap-2">
            {c.node.children.map((s) => (
              <SmartLink key={s.id} href={`/category/${s.slug}`} className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink/75 hover:border-gold hover:text-gold-deep">
                <Icon name={s.icon || 'leaf'} className="h-4 w-4" /> {s.name} <span className="text-xs text-ink/40">{s.count}</span>
              </SmartLink>
            ))}
          </div>
        </section>
      )}
      <section className="section theme-sand !pt-8">
        <div className="container-x">
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
                { key: 'q', label: t('Search in this category'), type: 'text' },
                { key: 'state', label: t('Seller state'), type: 'select', options: INDIAN_STATES.map((s) => ({ value: s, label: s })) },
                { key: 'verified', label: t('Verified'), type: 'check', options: [{ value: '1', label: t('Verified sellers only') }] },
              ]}
            >
              {res.items.length === 0 ? (
                <div className="card p-10 text-center">
                  <p className="font-display text-2xl font-semibold text-ink">{t('No products in this category yet')}</p>
                  <p className="mt-2 text-ink/60">{t('Be the first seller here, or post a requirement so sellers can quote you.')}</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <SmartLink href="/register?as=seller" className="btn btn-gold">{t('Start selling')}</SmartLink>
                    <SmartLink href="/post-requirement" className="btn btn-outline">{t('Post a requirement')}</SmartLink>
                  </div>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {res.items.map((p, i) => (
                    <ProductCard key={p.id} p={p} priority={i < 3} />
                  ))}
                </div>
              )}
              <Pagination page={res.page} pages={res.pages} base={`/category/${slug}`} params={sp} />
            </Filters>
          </Suspense>
        </div>
      </section>
    </>
  );
}
