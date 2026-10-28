import SmartLink from '@/components/ui/SmartLink';
import { BadgeCheck, MapPin, Package } from 'lucide-react';
import { images } from '@/lib/marketplace/data';
import { Rating } from './Rating';

export default function SellerCard({ s }: { s: any }) {
  const thumbs = (s.products || []).map((p: any) => images(p.images)[0]).filter(Boolean).slice(0, 3);
  return (
    <SmartLink href={`/sellers/${s.slug}`} className="card card-lift tilt group flex h-full flex-col overflow-hidden">
      <div className="relative h-24 bg-[linear-gradient(135deg,#0f6b2f,#009a35_60%,#8fdba6)]">
        {s.banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.banner} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute -bottom-7 left-4 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-ink/10">
          {s.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.logo} alt={s.companyName} className="h-full w-full object-cover" />
          ) : (
            <span className="font-display text-xl font-bold text-gold-deep">{s.companyName.charAt(0)}</span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4 pt-9">
        <h3 className="flex items-center gap-1.5 font-display text-[1.05rem] font-semibold text-ink">
          <span className="line-clamp-1">{s.companyName}</span>
          {s.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />}
        </h3>
        <p className="mt-0.5 text-xs text-ink/55">
          {s.businessType || 'Seller'}
          {s.state && (
            <>
              {' · '}
              <MapPin className="inline h-3 w-3" /> {s.city ? `${s.city}, ` : ''}{s.state}
            </>
          )}
        </p>
        {s.about && <p className="mt-2 line-clamp-2 text-sm text-ink/70">{s.about.replace(/<[^>]+>/g, '')}</p>}
        {thumbs.length > 0 && (
          <div className="mt-3 flex gap-1.5">
            {thumbs.map((t: string) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={t} src={t} alt="" loading="lazy" className="h-14 w-14 rounded-xl object-cover ring-1 ring-ink/5" />
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-3 text-xs text-ink/60">
          <span className="inline-flex items-center gap-1">
            <Package className="h-3.5 w-3.5" /> {s._count?.products ?? 0} products
          </span>
          <Rating value={s.ratingAvg} count={s.ratingCount} />
        </div>
      </div>
    </SmartLink>
  );
}
