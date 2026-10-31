import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { getI18n } from '@/lib/i18n/server';
import { getCategoryTree } from '@/lib/marketplace/data';
import ListingHeader from '@/components/market/ListingHeader';
import SmartLink from '@/components/ui/SmartLink';
import { Icon } from '@/components/ui/Icon';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t('All categories'), description: t('Browse every organic product category and sub-category on SHRIJAIV and find verified Indian sellers.') };
}

/** /categories — every main category with its sub-categories and live product counts */
export default async function CategoriesPage() {
  const { t } = await getI18n();
  const tree = await getCategoryTree();
  const total = tree.reduce((a, c) => a + (c.count || 0), 0);
  return (
    <>
      <ListingHeader crumbs={[{ label: t('All categories') }]} eyebrow={t('Shop by category')} title={t('All categories')} lead={t('Pick a category to see its products and verified sellers.')} right={<SmartLink href="/products" className="btn btn-gold">{t('All products')}</SmartLink>} />
      <section className="section theme-sand !pt-8">
        <div className="container-x">
          <p className="mb-5 text-sm text-ink/60">
            <b className="text-ink">{tree.length}</b> {t('categories')} · <b className="text-ink">{total}</b> {t('products')}
          </p>
          {tree.length === 0 ? (
            <p className="card p-8 text-center text-ink/60">{t('No categories yet.')}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tree.map((c) => (
                <div key={c.id} className="card card-lift reveal flex flex-col p-5">
                  <SmartLink href={`/category/${c.slug}`} className="group flex items-center gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#eaf7ee,#cdeed6)] text-gold-deep shadow-sm ring-2 ring-white transition group-hover:scale-110">
                      <Icon name={c.icon || 'leaf'} className="h-6 w-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-lg font-semibold leading-tight text-ink group-hover:text-gold-deep">{c.name}</span>
                      <span className="text-xs text-ink/50">{c.count} {t('products')}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-ink/30 transition group-hover:translate-x-1 group-hover:text-gold-deep" />
                  </SmartLink>
                  {c.children.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2 border-t border-ink/5 pt-4">
                      {c.children.map((s) => (
                        <li key={s.id}>
                          <SmartLink href={`/category/${s.slug}`} className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-[0.8rem] font-semibold text-ink/75 ring-1 ring-ink/5 transition hover:bg-gold/10 hover:text-gold-deep">
                            <Icon name={s.icon || 'leaf'} className="h-3.5 w-3.5" /> {s.name}
                            {(s.count || 0) > 0 && <span className="text-[0.7rem] font-normal text-ink/40">{s.count}</span>}
                          </SmartLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
