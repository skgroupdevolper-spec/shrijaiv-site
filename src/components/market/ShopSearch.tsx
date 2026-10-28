'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

/** Search bar with the two original buttons: Find Supplier (sellers) / Find Buyer (buy leads) */
export default function ShopSearch({ placeholder, supplierLabel, buyerLabel }: { placeholder: string; supplierLabel: string; buyerLabel: string }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const go = (kind: 'sellers' | 'requirements' | 'products') => router.push(`/${kind}${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  return (
    <form onSubmit={(e) => { e.preventDefault(); go('products'); }} className="flex flex-col gap-2 sm:flex-row" role="search">
      <label className="glass flex min-w-0 flex-1 items-center gap-2 rounded-2xl px-4">
        <Search className="h-4 w-4 shrink-0 text-ink/40" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent py-3.5 text-[0.95rem] outline-none placeholder:text-ink/40" aria-label={placeholder} />
      </label>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <button type="button" onClick={() => go('sellers')} className="btn btn-gold !rounded-2xl !px-3 sm:!px-5">{supplierLabel}</button>
        <button type="button" onClick={() => go('requirements')} className="btn btn-gold !rounded-2xl !px-3 sm:!px-5">{buyerLabel}</button>
      </div>
    </form>
  );
}
