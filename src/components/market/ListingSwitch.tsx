import SmartLink from '@/components/ui/SmartLink';
import { cn } from '@/lib/utils';

/** Supplier / Buyer switch from the original listing pages (products & suppliers ↔ buy leads) */
export default function ListingSwitch({ active, supplierLabel = 'Supplier', buyerLabel = 'Buyer' }: { active: 'supplier' | 'buyer'; supplierLabel?: string; buyerLabel?: string }) {
  return (
    <div className="mb-4 inline-flex gap-1.5 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-ink/5">
      <SmartLink href="/products" className={cn('rounded-xl px-5 py-2 text-sm font-bold transition', active === 'supplier' ? 'bg-gold text-white shadow' : 'text-ink/60 hover:text-ink')}>
        {supplierLabel}
      </SmartLink>
      <SmartLink href="/requirements" className={cn('rounded-xl px-5 py-2 text-sm font-bold transition', active === 'buyer' ? 'bg-amber-400 text-amber-950 shadow' : 'text-ink/60 hover:text-ink')}>
        {buyerLabel}
      </SmartLink>
    </div>
  );
}
