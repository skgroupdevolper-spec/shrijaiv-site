import SmartLink from '@/components/ui/SmartLink';
import { BadgeCheck, MapPin } from 'lucide-react';
import { images, priceLabel } from '@/lib/marketplace/format';
import { Rating } from './Rating';
import { Coin } from '@/components/site/Logo';
import { cn } from '@/lib/utils';

export default function ProductCard({ p, priority, compact }: { p: any; priority?: boolean; compact?: boolean }) {
  const img = images(p.images)[0];
  return (
    <SmartLink href={`/products/${p.slug}`} className="card card-lift tilt group flex h-full min-w-0 flex-col overflow-hidden !rounded-[18px] sm:!rounded-[24px]">
      <div className={cn('relative overflow-hidden bg-[#eaf5ec]', compact ? 'aspect-[4/3]' : 'aspect-square')}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={p.name} loading={priority ? 'eager' : 'lazy'} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,#f0faf2,#cdeed6)]">
            <Coin className="h-16 w-16 opacity-70" />
          </div>
        )}
        {p.featured && <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[0.55rem] font-extrabold uppercase tracking-wider text-amber-950 sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[0.62rem]">Featured</span>}
        {p.seller?.verified && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 p-1 text-[0.62rem] font-bold text-emerald-700 backdrop-blur sm:right-3 sm:top-3 sm:px-2">
            <BadgeCheck className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Verified</span>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {p.category && <p className="truncate text-[0.58rem] font-bold uppercase tracking-[0.14em] text-gold-deep sm:text-[0.65rem] sm:tracking-[0.18em]">{p.category.name}</p>}
        <h3 className="mt-1 line-clamp-2 font-display text-[0.9rem] font-semibold leading-snug text-ink sm:text-[1.05rem]">{p.name}</h3>
        <p className="mt-1.5 text-[0.8rem] font-bold text-gold-deep sm:mt-2 sm:text-sm sm:text-ink">{priceLabel(p)}</p>
        {p.moq && <p className="truncate text-[0.7rem] text-ink/55 sm:text-xs">MOQ: {p.moq}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-[0.68rem] text-ink/60 sm:pt-3 sm:text-xs">
          <span className="truncate">{p.seller?.companyName}</span>
          {p.seller?.state && (
            <span className="hidden shrink-0 items-center gap-1 sm:inline-flex">
              <MapPin className="h-3 w-3" /> {p.seller.city || p.seller.state}
            </span>
          )}
        </div>
        {p.ratingCount > 0 && <Rating value={p.ratingAvg} count={p.ratingCount} className="mt-2" />}
      </div>
    </SmartLink>
  );
}
