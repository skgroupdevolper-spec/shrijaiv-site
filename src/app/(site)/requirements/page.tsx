import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getI18n } from '@/lib/i18n/server';
import { getCategoryTree, flattenTree, getCategory, listRequirements, INDIAN_STATES } from '@/lib/marketplace/data';
import ListingHeader from '@/components/market/ListingHeader';
import Filters from '@/components/market/Filters';
import RequirementCard from '@/components/market/RequirementCard';
import Pagination from '@/components/market/Pagination';
import QuickChips from '@/components/market/QuickChips';
import SmartLink from '@/components/ui/SmartLink';

export const dynamic = 'force-dynamic';
type SP = Promise<Record<string, string | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t('Buy leads — what buyers need right now'), description: t('Open requirements posted by buyers of organic products across India. Sellers can send quotes directly.') };
}

export default async function RequirementsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { t } = await getI18n();
  const tree = await getCategoryTree();
  const cat = sp.cat ? await getCategory(sp.cat) : null;
  const res = await listRequirements({ q: sp.q, categoryIds: cat?.ids, state: sp.state, featured: sp.featured === '1', page: Number(sp.page) || 1 });
  return (
    <>
      <ListingHeader crumbs={[{ label: t('Buy leads') }]} eyebrow={t('Requirements')} title={t('Buyers are looking for')} lead={t('Fresh requirements from retailers, brands, exporters and restaurants. Sellers quote directly; buyers compare and choose.')} right={<SmartLink href="/post-requirement" className="btn btn-gold">{t('Post a requirement')}</SmartLink>} />
      <section className="section theme-sand !pt-8">
        <div className="container-x">
          <QuickChips
            base="/requirements"
            params={sp}
            chips={[
              { label: t('All leads') },
              { label: t('Premium'), key: 'featured', value: '1' },
              ...tree.map((c) => ({ label: c.name, key: 'cat', value: c.slug })),
              ...['Maharashtra', 'Delhi', 'Gujarat', 'Karnataka', 'Rajasthan', 'Tamil Nadu'].map((s) => ({ label: s, key: 'state', value: s })),
            ]}
          />
          <Suspense>
            <Filters
              total={res.total}
              kindLabel={t('open requirements')}
              defs={[
                { key: 'q', label: t('Search'), type: 'text' },
                { key: 'cat', label: t('Category'), type: 'select', options: flattenTree(tree).map((c) => ({ value: c.slug, label: c.parentId ? `– ${c.name}` : c.name })) },
                { key: 'state', label: t('Delivery state'), type: 'select', options: INDIAN_STATES.map((s) => ({ value: s, label: s })) },
              ]}
            >
              {res.items.length === 0 ? (
                <div className="card p-10 text-center">
                  <p className="font-display text-2xl font-semibold text-ink">{t('No open requirements right now')}</p>
                  <p className="mt-2 text-ink/60">{t('Looking for something? Post your requirement and verified sellers will send you quotes.')}</p>
                  <SmartLink href="/post-requirement" className="btn btn-gold mt-6">{t('Post a requirement')}</SmartLink>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {res.items.map((r) => (
                    <RequirementCard key={r.id} r={r} />
                  ))}
                </div>
              )}
              <Pagination page={res.page} pages={res.pages} base="/requirements" params={sp} />
            </Filters>
          </Suspense>
        </div>
      </section>
    </>
  );
}
