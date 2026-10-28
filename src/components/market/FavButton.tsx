'use client';
import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useT } from '@/components/site/SiteProvider';
import { cn } from '@/lib/utils';
import { readSaved, toggleSaved } from '@/lib/saved';

/**
 * Save / unsave a product or seller.
 * Buyers: stored in their account (Favourites). Visitors: stored in this browser (see /saved).
 */
export default function FavButton({ productId, sellerId, initial = false, canSave, className }: { productId?: string; sellerId?: string; initial?: boolean; canSave: boolean; className?: string }) {
  const t = useT();
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const kind = productId ? 'products' : 'sellers';
  const id = productId || sellerId || '';
  useEffect(() => {
    if (!canSave && id) setOn(readSaved()[kind].includes(id));
  }, [canSave, kind, id]);
  async function toggle() {
    if (!canSave) {
      setOn(toggleSaved(kind, id));
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/buyer/favourites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, sellerId }) });
      const d = await r.json();
      if (r.ok) setOn(d.saved);
    } catch {}
    setBusy(false);
  }
  return (
    <button type="button" onClick={toggle} disabled={busy} className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition', on ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-ink/10 bg-white text-ink/60 hover:text-rose-600', className)} aria-pressed={on} title={canSave ? undefined : t('Saved on this device')}>
      <Heart className={cn('h-4 w-4', on && 'fill-rose-500 text-rose-500')} /> {on ? t('Saved') : t('Save')}
    </button>
  );
}
