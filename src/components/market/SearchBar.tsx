'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Store, ShoppingBag } from 'lucide-react';
import { useT } from '@/components/site/SiteProvider';

export default function SearchBar({ categories = [], big }: { categories?: { slug: string; name: string }[]; big?: boolean }) {
  const t = useT();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [kind, setKind] = useState<'products' | 'sellers' | 'requirements'>('products');
  function go(e: React.FormEvent) {
    e.preventDefault();
    const u = new URLSearchParams();
    if (q.trim()) u.set('q', q.trim());
    if (cat) u.set('cat', cat);
    router.push(`/${kind}${u.toString() ? `?${u}` : ''}`);
  }
  return (
    <form onSubmit={go} className={`glass mx-auto w-full rounded-[28px] p-2 ${big ? 'max-w-3xl' : 'max-w-2xl'}`} role="search">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex rounded-2xl bg-ink/5 p-1 text-xs font-bold sm:shrink-0" role="tablist">
          {(
            [
              ['products', t('Products'), ShoppingBag],
              ['sellers', t('Sellers'), Store],
              ['requirements', t('Buy leads'), Search],
            ] as const
          ).map(([k, label, I]) => (
            <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k)} className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 transition ${kind === k ? 'bg-white text-ink shadow-sm' : 'text-ink/55'}`}>
              <I className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Search organic products, sellers or requirements…')} className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[0.95rem] outline-none placeholder:text-ink/40" aria-label={t('Search')} />
        {categories.length > 0 && (
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-2xl bg-ink/5 px-3 py-3 text-sm outline-none sm:max-w-[180px]" aria-label={t('Category')}>
            <option value="">{t('All categories')}</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        )}
        <button className="btn btn-gold sm:shrink-0" type="submit">
          <Search className="h-4 w-4" /> {t('Search')}
        </button>
      </div>
    </form>
  );
}
