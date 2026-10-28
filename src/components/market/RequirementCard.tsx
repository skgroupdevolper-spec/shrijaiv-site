import SmartLink from '@/components/ui/SmartLink';
import { BadgeCheck, MapPin, Clock, FileText } from 'lucide-react';
import { inr } from '@/lib/marketplace/data';
import { formatDate } from '@/lib/utils';

export default function RequirementCard({ r }: { r: any }) {
  return (
    <SmartLink href={`/requirements/${r.id}`} className="card card-lift group flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {r.category && <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-gold-deep">{r.category.name}</p>}
          <h3 className="mt-1 line-clamp-2 font-display text-[1.05rem] font-semibold leading-snug text-ink">{r.title}</h3>
        </div>
        {r.featured && <span className="shrink-0 rounded-full bg-amber-400 px-2 py-0.5 text-[0.6rem] font-extrabold uppercase text-amber-950">Hot</span>}
      </div>
      {r.details && <p className="mt-2 line-clamp-2 text-sm text-ink/70">{r.details}</p>}
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ink/65">
        {r.quantity && (
          <div>
            <dt className="font-bold text-ink/45">Quantity</dt>
            <dd>{r.quantity} {r.unit || ''}</dd>
          </div>
        )}
        {(r.budgetMin != null || r.budgetMax != null) && (
          <div>
            <dt className="font-bold text-ink/45">Budget</dt>
            <dd>{r.budgetMin != null ? inr(r.budgetMin) : ''}{r.budgetMin != null && r.budgetMax != null ? ' – ' : ''}{r.budgetMax != null ? inr(r.budgetMax) : ''}</dd>
          </div>
        )}
      </dl>
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-xs text-ink/55">
        <span className="inline-flex items-center gap-1">
          {r.buyer?.verified && <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />} {r.buyer?.buyerType || 'Buyer'}
        </span>
        {(r.deliveryState || r.buyer?.state) && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {r.deliveryCity || r.buyer?.city || ''}{r.deliveryState || r.buyer?.state ? `${r.deliveryCity || r.buyer?.city ? ', ' : ''}${r.deliveryState || r.buyer?.state}` : ''}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {formatDate(r.createdAt)}
        </span>
        <span className="ml-auto inline-flex items-center gap-1 font-bold text-gold-deep">
          <FileText className="h-3.5 w-3.5" /> {r.quoteCount} quotes
        </span>
      </div>
    </SmartLink>
  );
}
