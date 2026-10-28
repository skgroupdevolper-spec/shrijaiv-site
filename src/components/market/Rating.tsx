import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Rating({ value, count, size = 'sm', className }: { value: number; count?: number; size?: 'sm' | 'md'; className?: string }) {
  const v = Math.round((value || 0) * 2) / 2;
  const px = size === 'md' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  return (
    <span className={cn('inline-flex items-center gap-1', className)} aria-label={`${value?.toFixed(1) || 0} out of 5`}>
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={cn(px, i <= v ? 'fill-amber-400 text-amber-400' : i - 0.5 === v ? 'fill-amber-200 text-amber-400' : 'text-gray-300')} strokeWidth={1.5} />
        ))}
      </span>
      {count != null && <span className={cn('text-ink/55', size === 'md' ? 'text-sm' : 'text-xs')}>{count ? `${value.toFixed(1)} (${count})` : 'No reviews yet'}</span>}
    </span>
  );
}
