'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SmartLink from '@/components/ui/SmartLink';
import { cn } from '@/lib/utils';

type Slide = { image?: string; badge?: string; title?: string; text?: string; link?: { label?: string; href?: string }; dark?: boolean };

/** Hero slider in the style of the original site: full image, text on the left, glass badge, auto-rotating */
export default function ShopSlider({ slides, interval = 6 }: { slides: Slide[]; interval?: number }) {
  const [i, setI] = useState(0);
  const n = slides.length;
  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), Math.max(3, interval) * 1000);
    return () => clearInterval(t);
  }, [n, interval]);
  if (!n) return null;
  return (
    <div className="tilt group relative aspect-[16/8] w-full overflow-hidden rounded-[26px] bg-[#eef3ef] shadow-[0_30px_60px_-30px_rgba(0,80,30,.45)] sm:aspect-[21/9]" data-tilt="3">
      {slides.map((s, k) => (
        <div key={k} className={cn('absolute inset-0 transition-opacity duration-700', k === i ? 'opacity-100' : 'pointer-events-none opacity-0')} aria-hidden={k !== i}>
          {s.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image} alt="" className={cn('absolute inset-0 h-full w-full object-cover transition-transform duration-[6s]', k === i && 'scale-105')} />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />
          <div className="relative flex h-full max-w-[60%] flex-col justify-center p-6 sm:p-10">
            {s.badge && <span className="glass w-max rounded-full px-3 py-1 text-xs font-bold text-ink">{s.badge}</span>}
            {s.title && <h2 className="mt-3 font-display text-[clamp(1.3rem,0.8rem+2.4vw,2.8rem)] font-semibold leading-[1.08] text-white drop-shadow-md">{s.title}</h2>}
            {s.text && <p className="mt-2 line-clamp-2 max-w-md text-sm text-white/90 sm:text-base">{s.text}</p>}
            {s.link?.href && s.link?.label && (
              <SmartLink href={s.link.href} className="btn btn-gold btn-sm mt-4 w-max">{s.link.label}</SmartLink>
            )}
          </div>
        </div>
      ))}
      {n > 1 && (
        <>
          <button type="button" onClick={() => setI((i - 1 + n) % n)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/70 text-ink opacity-0 backdrop-blur transition group-hover:opacity-100" aria-label="Previous"><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" onClick={() => setI((i + 1) % n)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/70 text-ink opacity-0 backdrop-blur transition group-hover:opacity-100" aria-label="Next"><ChevronRight className="h-5 w-5" /></button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((_, k) => <button key={k} type="button" onClick={() => setI(k)} className={cn('h-2 rounded-full transition-all', k === i ? 'w-6 bg-white' : 'w-2 bg-white/50')} aria-label={`Slide ${k + 1}`} />)}
          </div>
        </>
      )}
    </div>
  );
}
