'use client';
import { useEffect, useState } from 'react';
import { Search, BadgeCheck, X } from 'lucide-react';
import { api } from './ui';

export type PickSeller = { id: string; companyName: string; city?: string | null; state?: string | null; verified?: boolean; why?: string };

/** Choose one or more sellers: suggestions as ticks, plus a search for any other approved seller */
export default function SellerPicker({ value, onChange, suggestions = [], lockedId }: { value: PickSeller[]; onChange: (v: PickSeller[]) => void; suggestions?: PickSeller[]; lockedId?: string }) {
  const [q, setQ] = useState('');
  const [found, setFound] = useState<PickSeller[]>([]);
  useEffect(() => {
    if (q.trim().length < 2) return setFound([]);
    const t = setTimeout(() => api<{ sellers: PickSeller[] }>(`/api/admin/review?find=${encodeURIComponent(q.trim())}`).then((d) => setFound(d.sellers)).catch(() => setFound([])), 250);
    return () => clearTimeout(t);
  }, [q]);
  const has = (id: string) => value.some((v) => v.id === id);
  const toggle = (s: PickSeller) => (has(s.id) ? onChange(value.filter((v) => v.id !== s.id)) : onChange([...value, s]));
  const place = (s: PickSeller) => [s.city, s.state].filter(Boolean).join(', ');
  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
              {s.companyName}
              {s.id !== lockedId && (
                <button type="button" onClick={() => toggle(s)} aria-label={`Remove ${s.companyName}`} className="rounded-full hover:bg-white/20">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      {suggestions.filter((s) => !has(s.id)).length > 0 && (
        <div>
          <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Suggested sellers</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions
              .filter((s) => !has(s.id))
              .map((s) => (
                <button key={s.id} type="button" onClick={() => toggle(s)} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 hover:ring-emerald-400" title={s.why}>
                  + {s.companyName} {s.verified && <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />}
                  <span className="font-normal text-gray-400">{s.why || place(s)}</span>
                </button>
              ))}
          </div>
        </div>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add any seller: search company, city or product…" className="admin-input !pl-9 text-sm" />
        {found.length > 0 && (
          <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white p-1 shadow-lg ring-1 ring-gray-200">
            {found.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (!has(s.id)) onChange([...value, s]);
                  setQ('');
                  setFound([]);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                <span className="flex items-center gap-1 font-semibold text-gray-900">
                  {s.companyName} {s.verified && <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />}
                </span>
                <span className="text-xs text-gray-400">{has(s.id) ? 'added' : place(s)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
