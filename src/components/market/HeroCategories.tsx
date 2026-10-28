'use client';
import { useState } from 'react';
import { ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import SmartLink from '@/components/ui/SmartLink';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

export type HeroCat = { id: string; slug: string; name: string; icon: string | null; image: string | null; count?: number; children: { id: string; slug: string; name: string; icon: string | null; image: string | null; count?: number }[] };

function Visual({ c, small }: { c: { icon: string | null; image: string | null }; small?: boolean }) {
  return c.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={c.image} alt="" className={cn('object-contain', small ? 'h-[18px] w-[18px]' : 'h-6 w-6')} />
  ) : (
    <span className={cn('grid place-items-center rounded-lg bg-gold/10', small ? 'h-5 w-5' : 'h-6 w-6')}><Icon name={c.icon || 'leaf'} className={cn('text-gold-deep', small ? 'h-3 w-3' : 'h-3.5 w-3.5')} /></span>
  );
}

/**
 * Category list beside the home slider. Items with sub-categories show an arrow that folds
 * them out; items without one go straight to the category. The title arrow folds the whole list.
 */
export default function HeroCategories({ items, title, allLabel, allCatsLabel }: { items: HeroCat[]; title: string; allLabel: string; allCatsLabel: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  return (
    <>
      <div className="flex items-center justify-between px-3 py-2">
        <SmartLink href="/products" className="inline-flex items-center gap-2 font-display text-[1.12rem] font-semibold text-ink"><Icon name="boxes" className="h-5 w-5 text-gold-deep" /> {title}</SmartLink>
        <button type="button" onClick={() => setCollapsed((v) => !v)} className="grid h-8 w-8 place-items-center rounded-full text-ink/50 transition hover:bg-ink/5" aria-expanded={!collapsed} aria-label={title}>
          <ChevronDown className={cn('h-4 w-4 transition-transform', collapsed && '-rotate-90')} />
        </button>
      </div>
      {!collapsed && (
        <ul className="hero-cats thin-scroll mt-1 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-0.5">
          {items.map((c) => {
            const has = c.children.length > 0;
            const isOpen = open === c.id;
            return (
              <li key={c.id} className="shrink-0">
                <div className={cn('group flex min-h-[42px] items-center rounded-2xl border border-ink/5 bg-white/85 pl-3.5 pr-1.5 text-[0.93rem] text-ink/85 shadow-sm transition hover:border-gold hover:shadow-md', isOpen && 'border-gold')}>
                  <SmartLink href={`/category/${c.slug}`} className="flex min-w-0 flex-1 items-center gap-2.5 py-2 group-hover:text-gold-deep">
                    <Visual c={c} />
                    <span className="truncate">{c.name}</span>
                  </SmartLink>
                  {has ? (
                    <button type="button" onClick={() => setOpen(isOpen ? null : c.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink/40 transition hover:bg-gold/10 hover:text-gold-deep" aria-expanded={isOpen} aria-label={c.name}>
                      <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
                    </button>
                  ) : c.count ? (
                    <span className="pr-2 text-xs text-ink/35">{c.count}</span>
                  ) : null}
                </div>
                {has && isOpen && (
                  <ul className="mt-1.5 grid gap-1 ps-3" style={{ animation: 'pop .25s cubic-bezier(.2,.8,.2,1) both' }}>
                    {c.children.map((x) => (
                      <li key={x.id}>
                        <SmartLink href={`/category/${x.slug}`} className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-[0.86rem] text-ink/75 transition hover:bg-white hover:text-gold-deep">
                          <Visual c={x} small /> <span className="truncate">{x.name}</span>
                          {x.count ? <span className="ms-auto text-[0.68rem] text-ink/35">{x.count}</span> : null}
                        </SmartLink>
                      </li>
                    ))}
                    <li>
                      <SmartLink href={`/category/${c.slug}`} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gold-deep">{allLabel} {c.name} <ArrowRight className="h-3.5 w-3.5" /></SmartLink>
                    </li>
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <SmartLink href="/products" className="mt-2 flex items-center justify-center gap-1.5 rounded-2xl bg-ink px-3 py-2.5 text-sm font-bold text-white transition hover:bg-gold-deep">
        {allCatsLabel} <ArrowRight className="h-4 w-4" />
      </SmartLink>
    </>
  );
}
