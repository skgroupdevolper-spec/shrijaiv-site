import SmartLink from '@/components/ui/SmartLink';
import { BadgeCheck, MapPin } from 'lucide-react';
import { images, priceLabel } from '@/lib/marketplace/data';
import { Rating } from './Rating';
import { Coin } from '@/components/site/Logo';
import { cn } from '@/lib/utils';

export default function ProductCard({ p, priority, compact }: { p: any; priority?: boolean; compact?: boolean }) {
  const img = images(p.images)[0];
  return (
    <SmartLink href={`/products/${p.slug}`} className="card card-lift tilt group flex h-full flex-col overflow-hidden">
      <div className={cn('relative overflow-hidden bg-[#eaf5ec]', compact ? 'aspect-[4/3]' : 'aspect-square')}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={p.name} loading={priority ? 'eager' : 'lazy'} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,#f0faf2,#cdeed6)]">
            <Coin className="h-16 w-16 opacity-70" />
          </div>
        )}
        {p.featured && <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-wider text-amber-950">Featured</span>}
        {p.seller?.verified && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[0.62rem] font-bold text-emerald-700 backdrop-blur">
            <BadgeCheck className="h-3.5 w-3.5" /> Verified
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {p.category && <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-gold-deep">{p.category.name}</p>}
        <h3 className="mt-1 line-clamp-2 font-display text-[1.05rem] font-semibold leading-snug text-ink">{p.name}</h3>
        <p className="mt-2 text-sm font-bold text-ink">{priceLabel(p)}</p>
        {p.moq && <p className="text-xs text-ink/55">MOQ: {p.moq}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs text-ink/60">
          <span className="truncate">{p.seller?.companyName}</span>
          {p.seller?.state && (
            <span className="inline-flex shrink-0 items-center gap-1">
              <MapPin className="h-3 w-3" /> {p.seller.city || p.seller.state}
            </span>
          )}
        </div>
        {p.ratingCount > 0 && <Rating value={p.ratingAvg} count={p.ratingCount} className="mt-2" />}
      </div>
    </SmartLink>
  );
}
