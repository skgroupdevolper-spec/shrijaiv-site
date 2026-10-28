import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Stat({ label, value, icon: Icon, href, hint, tone = 'green' }: { label: string; value: string | number; icon: LucideIcon; href?: string; hint?: string; tone?: 'green' | 'amber' | 'blue' | 'rose' }) {
  const tones = { green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', blue: 'bg-sky-50 text-sky-700', rose: 'bg-rose-50 text-rose-700' };
  const body = (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-gray-200/70 transition hover:-translate-y-0.5 hover:shadow-lg">
      <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl', tones[tone])}>
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold tracking-tight text-gray-900">{value}</p>
        <p className="truncate text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
