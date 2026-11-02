import { ChevronRight, Home } from 'lucide-react';
import SmartLink from '@/components/ui/SmartLink';
import T from '@/components/ui/T';
import { cn } from '@/lib/utils';

export type Crumb = { label: string; href?: string };

/** Breadcrumb bar: Home › … › current page. One line, scrolls sideways on small screens, the current page is truncated. */
export default function Breadcrumbs({ crumbs, className }: { crumbs: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('max-w-full', className)}>
      <ol className="no-scrollbar inline-flex max-w-full items-center gap-1 overflow-x-auto whitespace-nowrap rounded-full bg-white/80 px-1.5 py-1 text-[0.8rem] shadow-[0_6px_20px_-12px_rgba(0,60,20,.35)] ring-1 ring-black/[0.06] backdrop-blur">
        <li className="shrink-0">
          <SmartLink href="/" className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold text-ink/70 transition hover:bg-gold/10 hover:text-gold-deep">
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline"><T>Home</T></span>
          </SmartLink>
        </li>
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={i} className={cn('flex items-center gap-1', last ? 'min-w-0' : 'shrink-0')}>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink/30" />
              {c.href && !last ? (
                <SmartLink href={c.href} className="rounded-full px-2.5 py-1 font-medium text-ink/65 transition hover:bg-gold/10 hover:text-gold-deep">{c.label}</SmartLink>
              ) : (
                <span aria-current="page" className="block max-w-[46vw] truncate rounded-full bg-gold/10 px-2.5 py-1 font-semibold text-gold-deep sm:max-w-[420px]">{c.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
