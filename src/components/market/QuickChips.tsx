import SmartLink from '@/components/ui/SmartLink';
import { cn } from '@/lib/utils';

export type Chip = { label: string; key?: string; value?: string; icon?: React.ReactNode };

/**
 * One-tap filter chips above a listing (All · Premium · states · categories…).
 * Each chip sets one query key and keeps the others, like the filter bar on the original site.
 */
export default function QuickChips({ base, params, chips }: { base: string; params: Record<string, string | undefined>; chips: Chip[] }) {
  const href = (c: Chip) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== 'page' && k !== c.key) u.set(k, v);
    if (c.key && c.value) u.set(c.key, c.value);
    const q = u.toString();
    return `${base}${q ? `?${q}` : ''}`;
  };
  const active = (c: Chip) => (c.key ? params[c.key] === c.value : !chips.some((x) => x.key && params[x.key] === x.value));
  return (
    <div className="thin-scroll -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {chips.map((c, i) => (
        <SmartLink key={i} href={href(c)} className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[0.82rem] font-semibold transition', active(c) ? 'border-transparent bg-ink text-white shadow-md' : 'border-ink/10 bg-white text-ink/75 hover:border-gold hover:text-gold-deep')}>
          {c.icon}
          {c.label}
        </SmartLink>
      ))}
    </div>
  );
}
