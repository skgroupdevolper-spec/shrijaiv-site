import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, base, params }: { page: number; pages: number; base: string; params?: Record<string, string | undefined> }) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(params || {})) if (v) u.set(k, v);
    if (p > 1) u.set('page', String(p));
    const q = u.toString();
    return q ? `${base}?${q}` : base;
  };
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 2);
  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 && (
        <Link href={href(page - 1)} className="grid h-10 w-10 place-items-center rounded-full border border-ink/10 hover:bg-ink/5" aria-label="Previous">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {nums.map((n, i) => (
        <span key={n} className="contents">
          {i > 0 && nums[i - 1] !== n - 1 && <span className="px-1 text-ink/40">…</span>}
          <Link href={href(n)} className={`grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-bold ${n === page ? 'text-white' : 'border border-ink/10 hover:bg-ink/5'}`} style={n === page ? { background: 'var(--gold-grad)' } : undefined} aria-current={n === page ? 'page' : undefined}>
            {n}
          </Link>
        </span>
      ))}
      {page < pages && (
        <Link href={href(page + 1)} className="grid h-10 w-10 place-items-center rounded-full border border-ink/10 hover:bg-ink/5" aria-label="Next">
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
