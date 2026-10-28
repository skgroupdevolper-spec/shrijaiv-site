'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Store, Megaphone, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Hero search: one glass bar with a Supplier / Buyer switch (the original "Find Supplier" /
 * "Find Buyer" buttons) and a round search button. Supplier → /sellers, Buyer → /requirements.
 */
export default function ShopSearch({ placeholder, supplierLabel, buyerLabel }: { placeholder: string; supplierLabel: string; buyerLabel: string }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<'sellers' | 'requirements'>('sellers');
  const go = () => router.push(`/${kind}${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  const tabs = [
    { k: 'sellers' as const, label: supplierLabel, icon: Store },
    { k: 'requirements' as const, label: buyerLabel, icon: Megaphone },
  ];
  return (
    <form onSubmit={(e) => { e.preventDefault(); go(); }} role="search" className="hero-search">
      <div className="hero-search-tabs" role="tablist">
        {tabs.map(({ k, label, icon: I }) => (
          <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k)} className={cn('hero-search-tab', kind === k && 'is-on')}>
            <I className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>
      <label className="flex min-w-0 flex-1 items-center gap-2.5 ps-3 sm:ps-1">
        <Search className="h-[18px] w-[18px] shrink-0 text-ink/35" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent py-2.5 text-[0.92rem] text-ink outline-none placeholder:text-ink/40" aria-label={placeholder} />
      </label>
      <button type="submit" className="hero-search-go" aria-label="Search">
        <span className="hidden sm:inline">Search</span> <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
