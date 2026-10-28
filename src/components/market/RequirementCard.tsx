import SmartLink from '@/components/ui/SmartLink';
import { BadgeCheck, MapPin, Clock, FileText, Package, IndianRupee, ArrowRight } from 'lucide-react';
import { inr } from '@/lib/marketplace/format';
import { formatDate } from '@/lib/utils';

/** Buy-lead card in the "WANTED" style of the original site */
export default function RequirementCard({ r }: { r: any }) {
  const place = [r.deliveryCity || r.buyer?.city, r.deliveryState || r.buyer?.state].filter(Boolean).join(', ');
  const budget = r.budgetMin != null || r.budgetMax != null ? `${r.budgetMin != null ? inr(r.budgetMin) : ''}${r.budgetMin != null && r.budgetMax != null ? ' – ' : ''}${r.budgetMax != null ? inr(r.budgetMax) : ''}${r.unit ? ` / ${r.unit}` : ''}` : '';
  return (
    <SmartLink href={`/requirements/${r.id}`} className="card card-lift tilt group relative flex h-full flex-col overflow-hidden !rounded-[22px] p-5">
      <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/10 blur-2xl transition group-hover:bg-gold/20" />
      <div className="flex items-center justify-between gap-2 text-[0.72rem] text-ink/55">
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(r.createdAt)}</span>
        <span className="inline-flex items-center gap-1.5">
          {r.featured && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-wider text-amber-950">Premium</span>}
          <span className="inline-flex items-center gap-1 font-bold uppercase text-emerald-600"><BadgeCheck className="h-3.5 w-3.5" /> {r.buyer?.verified ? 'Verified' : 'Buyer'}</span>
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-[0.9rem] font-semibold leading-snug text-rose-600">WANTED: {r.title}</p>
      <p className="mt-1 font-display text-[1.35rem] font-semibold leading-tight text-ink">Buyer from {r.deliveryState || r.buyer?.state || 'India'}</p>
      {r.details && <p className="mt-2 line-clamp-3 text-sm text-ink/70">{r.details}</p>}
      <div className="mt-3 flex flex-wrap gap-1.5 text-[0.72rem]">
        {r.category && <span className="rounded-full bg-gold/10 px-2.5 py-1 font-bold text-gold-deep">{r.category.name}</span>}
        {r.quantity && <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 font-semibold text-ink/70"><Package className="h-3 w-3" /> {r.quantity} {r.unit || ''}</span>}
        {budget && <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 font-semibold text-ink/70"><IndianRupee className="h-3 w-3" /> {budget}</span>}
        {place && <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 font-semibold text-ink/70"><MapPin className="h-3 w-3" /> {place}</span>}
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <span className="btn btn-outline btn-sm bg-white transition group-hover:border-gold group-hover:bg-gold group-hover:text-white">View More <ArrowRight className="h-3.5 w-3.5" /></span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-ink/55"><FileText className="h-3.5 w-3.5 text-gold-deep" /> {r.quoteCount} quotes</span>
      </div>
    </SmartLink>
  );
}
