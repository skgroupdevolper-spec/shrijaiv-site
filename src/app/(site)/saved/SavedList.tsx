'use client';
import { useEffect, useState } from 'react';
import { Heart, LoaderCircle } from 'lucide-react';
import { useT } from '@/components/site/SiteProvider';
import SmartLink from '@/components/ui/SmartLink';
import ProductCard from '@/components/market/ProductCard';
import SellerCard from '@/components/market/SellerCard';
import { readSaved, SAVED_EVENT } from '@/lib/saved';

export default function SavedList() {
  const t = useT();
  const [data, setData] = useState<{ products: any[]; sellers: any[] } | null>(null);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const s = readSaved();
      if (!s.products.length && !s.sellers.length) return setData({ products: [], sellers: [] });
      try {
        const r = await fetch('/api/saved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
        const d = await r.json();
        if (alive) setData({ products: d.products || [], sellers: d.sellers || [] });
      } catch {
        if (alive) setData({ products: [], sellers: [] });
      }
    };
    load();
    window.addEventListener(SAVED_EVENT, load);
    return () => {
      alive = false;
      window.removeEventListener(SAVED_EVENT, load);
    };
  }, []);
  if (!data)
    return (
      <p className="flex items-center gap-2 text-sm text-ink/60"><LoaderCircle className="h-4 w-4 animate-spin" /> {t('Loading…')}</p>
    );
  if (!data.products.length && !data.sellers.length)
    return (
      <div className="card p-10 text-center">
        <Heart className="mx-auto h-10 w-10 text-rose-300" />
        <p className="mt-3 font-display text-2xl font-semibold text-ink">{t('Nothing saved yet')}</p>
        <p className="mt-2 text-ink/60">{t('Tap “Save” on any product or seller to keep it here. Create a free buyer account to keep your list on every device.')}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <SmartLink href="/products" className="btn btn-gold">{t('Browse products')}</SmartLink>
          <SmartLink href="/register?as=buyer" className="btn btn-outline">{t('Create buyer account')}</SmartLink>
        </div>
      </div>
    );
  return (
    <div className="space-y-10">
      {data.products.length > 0 && (
        <div>
          <h2 className="mb-4 font-display text-xl font-semibold text-ink">{t('Saved products')} <span className="text-ink/40">({data.products.length})</span></h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {data.products.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}
      {data.sellers.length > 0 && (
        <div>
          <h2 className="mb-4 font-display text-xl font-semibold text-ink">{t('Saved sellers')} <span className="text-ink/40">({data.sellers.length})</span></h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {data.sellers.map((s) => (
              <SellerCard key={s.id} s={s} />
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-ink/50">{t('Saved on this device only.')} <SmartLink href="/register?as=buyer" className="font-bold text-gold-deep">{t('Create a free buyer account')}</SmartLink> {t('to keep your list everywhere.')}</p>
    </div>
  );
}
