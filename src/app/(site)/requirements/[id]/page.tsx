import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BadgeCheck, MapPin, Clock, Package, Wallet, Calendar, FileText } from 'lucide-react';
import { getI18n } from '@/lib/i18n/server';
import { getRequirement, listRequirements, inr } from '@/lib/marketplace/data';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ListingHeader from '@/components/market/ListingHeader';
import RequirementCard from '@/components/market/RequirementCard';
import SmartLink from '@/components/ui/SmartLink';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const r = await getRequirement(id);
  if (!r) return { title: 'Requirement not found' };
  return { title: `${r.title} — buy lead`, description: (r.details || `${r.title}. Quantity ${r.quantity || '-'} ${r.unit || ''}. Posted by a ${r.buyer.buyerType || 'buyer'}${r.buyer.state ? ` in ${r.buyer.state}` : ''}.`).slice(0, 160), robots: { index: r.status === 'open', follow: true } };
}

export default async function RequirementPage({ params }: Props) {
  const { id } = await params;
  const { t } = await getI18n();
  const r = await getRequirement(id);
  if (!r) notFound();
  prisma.requirement.update({ where: { id: r.id }, data: { views: { increment: 1 } } }).catch(() => null);
  const user = await getCurrentUser();
  const similar = (await listRequirements({ categoryIds: r.categoryId ? [r.categoryId] : undefined, take: 5 })).items.filter((x) => x.id !== r.id).slice(0, 4);
  const open = r.status === 'open';
  return (
    <>
      <ListingHeader compact crumbs={[{ label: t('Buy leads'), href: '/requirements' }, ...(r.category ? [{ label: r.category.name, href: `/requirements?cat=${r.category.slug}` }] : []), { label: r.title }]} eyebrow={r.category?.name || t('Requirement')} title={r.title} />
      <section className="theme-sand pb-16 pt-2 sm:pb-24">
        <div className="container-x grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <div className="card p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${open ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-ink/5 text-ink/60'}`}>{open ? t('Open for quotes') : t('Closed')}</span>
                {r.featured && <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-extrabold uppercase text-amber-950">Hot</span>}
                <span className="inline-flex items-center gap-1 text-xs text-ink/50"><Clock className="h-3.5 w-3.5" /> {t('Posted')} {formatDate(r.createdAt)}</span>
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3">
                {[
                  [Package, t('Quantity'), r.quantity ? `${r.quantity} ${r.unit || ''}` : null],
                  [Wallet, t('Budget'), r.budgetMin != null || r.budgetMax != null ? `${r.budgetMin != null ? inr(r.budgetMin) : ''}${r.budgetMin != null && r.budgetMax != null ? ' – ' : ''}${r.budgetMax != null ? inr(r.budgetMax) : ''}` : null],
                  [MapPin, t('Delivery to'), [r.deliveryCity, r.deliveryState].filter(Boolean).join(', ') || null],
                  [Calendar, t('Needed by'), r.neededBy ? formatDate(r.neededBy) : null],
                  [FileText, t('Quotes received'), String(r._count.quotes)],
                ]
                  .filter((x) => x[2])
                  .map(([I, k, v]: any) => (
                    <div key={k} className="flex gap-2">
                      <I className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                      <div>
                        <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-ink/45">{k}</dt>
                        <dd className="font-semibold text-ink">{v}</dd>
                      </div>
                    </div>
                  ))}
              </dl>
              {r.details && (
                <>
                  <h2 className="mt-8 font-display text-xl font-semibold text-ink">{t('Details')}</h2>
                  <p className="mt-2 whitespace-pre-line text-[1.02rem] leading-relaxed text-ink/75">{r.details}</p>
                </>
              )}
            </div>
            {similar.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">{t('Similar requirements')}</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {similar.map((x) => (
                    <RequirementCard key={x.id} r={x} />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="card p-6">
              <p className="font-display text-xl font-semibold text-ink">{t('Send your quote')}</p>
              {!open ? (
                <p className="mt-2 text-sm text-ink/60">{t('This requirement is closed.')}</p>
              ) : user?.role === 'SELLER' ? (
                <>
                  <p className="mt-1 text-sm text-ink/60">{t('Quote from your seller dashboard — the buyer compares quotes side by side.')}</p>
                  <SmartLink href={`/seller/leads/${r.id}`} className="btn btn-gold mt-4 w-full">{t('Quote now')}</SmartLink>
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm text-ink/60">{t('Only registered sellers can send quotes. It is free to join.')}</p>
                  <SmartLink href={`/register?as=seller`} className="btn btn-gold mt-4 w-full">{t('Become a seller')}</SmartLink>
                  <SmartLink href={`/login?next=/seller/leads/${r.id}`} className="btn btn-outline mt-2 w-full">{t('Seller sign in')}</SmartLink>
                </>
              )}
            </div>
            <div className="card p-6 text-sm text-ink/70">
              <p className="font-display text-lg font-semibold text-ink">{t('About the buyer')}</p>
              <dl className="mt-3 space-y-2">
                <div className="flex justify-between gap-3"><dt className="text-ink/50">{t('Type')}</dt><dd className="inline-flex items-center gap-1 font-semibold text-ink">{r.buyer.verified && <BadgeCheck className="h-4 w-4 text-emerald-600" />} {r.buyer.buyerType || t('Buyer')}</dd></div>
                {(r.buyer.city || r.buyer.state) && <div className="flex justify-between gap-3"><dt className="text-ink/50">{t('Location')}</dt><dd className="font-semibold text-ink">{[r.buyer.city, r.buyer.state].filter(Boolean).join(', ')}</dd></div>}
                <div className="flex justify-between gap-3"><dt className="text-ink/50">{t('Member since')}</dt><dd className="font-semibold text-ink">{formatDate(r.buyer.createdAt)}</dd></div>
              </dl>
              <p className="mt-3 text-xs text-ink/45">{t('Buyer contact details are shared with sellers who quote.')}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
