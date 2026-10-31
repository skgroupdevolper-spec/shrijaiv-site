'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import { useT } from '@/components/site/SiteProvider';

type Opt = { value: string; label: string };
export type FilterDef = { key: string; label: string; type: 'select' | 'check' | 'text'; options?: Opt[] };

/** Sidebar filters that write to the URL query (server renders the results) */
export default function Filters({ defs, sorts, total, kindLabel, children, aside }: { defs: FilterDef[]; sorts?: Opt[]; total: number; kindLabel: string; children: React.ReactNode; aside?: React.ReactNode }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const set = (k: string, v: string) => {
    const u = new URLSearchParams(sp.toString());
    if (v) u.set(k, v);
    else u.delete(k);
    u.delete('page');
    router.push(`${pathname}${u.toString() ? `?${u}` : ''}`);
  };
  const active = defs.filter((d) => sp.get(d.key));
  const panel = (
    <div className="space-y-5">
      {defs.map((d) => (
        <div key={d.key}>
          <label className="mb-1.5 block text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-ink/45">{d.label}</label>
          {d.type === 'select' && (
            <select value={sp.get(d.key) || ''} onChange={(e) => set(d.key, e.target.value)} className="field !py-2.5 text-sm">
              <option value="">{t('Any')}</option>
              {d.options?.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
          {d.type === 'check' && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={sp.get(d.key) === '1'} onChange={(e) => set(d.key, e.target.checked ? '1' : '')} className="h-4 w-4 accent-[var(--brand-gold)]" /> {d.options?.[0]?.label || d.label}
            </label>
          )}
          {d.type === 'text' && <input defaultValue={sp.get(d.key) || ''} onBlur={(e) => set(d.key, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && set(d.key, (e.target as HTMLInputElement).value)} placeholder={d.label} className="field !py-2.5 text-sm" />}
        </div>
      ))}
      {active.length > 0 && (
        <button type="button" onClick={() => router.push(pathname)} className="inline-flex items-center gap-1 text-sm font-bold text-gold-deep">
          <X className="h-4 w-4" /> {t('Clear filters')}
        </button>
      )}
    </div>
  );
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink/60">
          <b className="text-ink">{total}</b> {kindLabel}
          {sp.get('q') && (
            <>
              {' '}{t('for')} “<b className="text-ink">{sp.get('q')}</b>”
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          {sorts && (
            <select value={sp.get('sort') || ''} onChange={(e) => set('sort', e.target.value)} className="rounded-full border border-ink/10 bg-white px-3 py-2 text-sm" aria-label={t('Sort')}>
              {sorts.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
          <button type="button" onClick={() => setOpen(true)} className="btn btn-outline btn-sm lg:hidden">
            <SlidersHorizontal className="h-4 w-4" /> {t('Filters')} {active.length ? `(${active.length})` : ''}
          </button>
        </div>
      </div>
      <div className="lg:grid lg:grid-cols-[250px_1fr] lg:gap-8">
        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <aside className="card p-5">{panel}</aside>
            {aside}
          </div>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
      {open && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-[min(360px,90vw)] overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <p className="font-bold">{t('Filters')}</p>
              <button onClick={() => setOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            {panel}
          </div>
        </div>
      )}
    </div>
  );
}
