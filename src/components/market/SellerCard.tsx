import SmartLink from '@/components/ui/SmartLink';
import { BadgeCheck, MapPin, Package, ArrowRight, ShieldCheck } from 'lucide-react';
import { images } from '@/lib/marketplace/format';
import { Rating } from './Rating';

function parse(json: string | null | undefined): string[] {
  try {
    const v = JSON.parse(json || '[]');
    return Array.isArray(v) ? v.map((x: any) => (typeof x === 'string' ? x : x?.name)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

/** Seller / supplier card: banner, logo, verified ribbon, certifications and product thumbnails */
export default function SellerCard({ s }: { s: any }) {
  const thumbs = (s.products || []).map((p: any) => images(p.images)[0]).filter(Boolean).slice(0, 3);
  const certs = parse(s.certifications).slice(0, 2);
  const type = s.businessType ? s.businessType.charAt(0).toUpperCase() + s.businessType.slice(1) : 'Seller';
  return (
    <SmartLink href={`/sellers/${s.slug}`} className="card card-lift tilt group flex h-full flex-col overflow-hidden !rounded-[22px]">
      <div className="relative h-28 bg-[linear-gradient(135deg,#0f6b2f,#009a35_60%,#8fdba6)]">
        {s.banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.banner} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {s.verified && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-wider text-emerald-700 shadow">
            <BadgeCheck className="h-3.5 w-3.5" /> Verified
          </span>
        )}
        {s.featured && <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-[0.6rem] font-extrabold uppercase tracking-wider text-amber-950">Featured</span>}
        <div className="absolute -bottom-7 left-4 grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-white shadow-lg ring-2 ring-white">
          {s.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.logo} alt={s.companyName} className="h-full w-full object-contain p-1" />
          ) : (
            <span className="font-display text-2xl font-bold text-gold-deep">{s.companyName.charAt(0)}</span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4 pt-10">
        <h3 className="flex items-center gap-1.5 font-display text-[1.08rem] font-semibold text-ink">
          <span className="line-clamp-1">{s.companyName}</span>
        </h3>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-ink/55">
          <span className="font-semibold text-gold-deep">{type}</span>
          {s.state && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {s.city ? `${s.city}, ` : ''}{s.state}</span>
            </>
          )}
          {s.yearEstablished && (
            <>
              <span>·</span>
              <span>since {s.yearEstablished}</span>
            </>
          )}
        </p>
        {s.about && <p className="mt-2 line-clamp-2 text-sm text-ink/70">{s.about.replace(/<[^>]+>/g, '')}</p>}
        {certs.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {certs.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.66rem] font-bold text-emerald-700 ring-1 ring-emerald-100"><ShieldCheck className="h-3 w-3" /> {c}</span>
            ))}
          </div>
        )}
        {thumbs.length > 0 && (
          <div className="mt-3 flex gap-1.5">
            {thumbs.map((t: string) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={t} src={t} alt="" loading="lazy" className="h-14 w-14 rounded-xl bg-[#f4f7f4] object-contain p-1 ring-1 ring-ink/5" />
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-ink/60">
          <span className="inline-flex items-center gap-1"><Package className="h-3.5 w-3.5" /> {s._count?.products ?? 0} products</span>
          <Rating value={s.ratingAvg} count={s.ratingCount} />
        </div>
        <span className="btn btn-outline btn-sm mt-3 w-full transition group-hover:border-gold group-hover:bg-gold group-hover:text-white">View showroom <ArrowRight className="h-3.5 w-3.5" /></span>
      </div>
    </SmartLink>
  );
}
