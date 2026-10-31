'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SmartLink from '@/components/ui/SmartLink';
import { useT } from '@/components/site/SiteProvider';
import { cn } from '@/lib/utils';

export type RegionItem = { name: string; code: string; sellers: number; products: number };

/** "Suppliers By Region" — a swipe / drag / arrow slider; every card opens that state's sellers */
export default function RegionSlider({ items, flag, auto = true }: { items: RegionItem[]; flag: string; auto?: boolean }) {
  const t = useT();
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, x: 0, left: 0, moved: 0 });
  const [hover, setHover] = useState(false);
  const [edge, setEdge] = useState({ start: true, end: false });

  const step = () => {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    return card ? card.offsetWidth + 12 : 160;
  };
  const go = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (dir === 1 && el.scrollLeft >= max - 4) el.scrollTo({ left: 0, behavior: 'smooth' });
    else if (dir === -1 && el.scrollLeft <= 4) el.scrollTo({ left: max, behavior: 'smooth' });
    else el.scrollBy({ left: dir * step() * Math.max(1, Math.floor(el.clientWidth / step()) - 1), behavior: 'smooth' });
  };
  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft >= el.scrollWidth - el.clientWidth - 4 });
  };

  // gentle auto-advance; stops while the visitor hovers, touches or drags
  useEffect(() => {
    if (!auto || hover) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => {
      const el = track.current;
      if (!el || document.hidden) return;
      const max = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= max - 4) el.scrollTo({ left: 0, behavior: 'smooth' });
      else el.scrollBy({ left: step(), behavior: 'smooth' });
    }, 3200);
    return () => clearInterval(id);
  }, [auto, hover]);
  useEffect(onScroll, []);

  // mouse drag (touch uses native swipe)
  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !track.current) return;
    drag.current = { down: true, x: e.clientX, left: track.current.scrollLeft, moved: 0 };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.down || !track.current) return;
    const dx = e.clientX - d.x;
    d.moved = Math.max(d.moved, Math.abs(dx));
    if (d.moved > 4) {
      track.current.style.scrollSnapType = 'none';
      track.current.style.scrollBehavior = 'auto';
      track.current.scrollLeft = d.left - dx;
    }
  };
  const onUp = () => {
    drag.current.down = false;
    if (track.current) {
      track.current.style.scrollSnapType = '';
      track.current.style.scrollBehavior = '';
    }
  };

  return (
    <div className="group/rs relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); onUp(); }} onTouchStart={() => setHover(true)} onTouchEnd={() => setTimeout(() => setHover(false), 4000)}>
      <div
        ref={track}
        onScroll={onScroll}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onClickCapture={(e) => {
          // a drag is not a click
          if (drag.current.moved > 6) {
            e.preventDefault();
            e.stopPropagation();
            drag.current.moved = 0;
          }
        }}
        onDragStart={(e) => e.preventDefault()}
        className="region-track no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 pb-3 pt-1 md:cursor-grab md:active:cursor-grabbing"
        role="list"
        aria-label={t('Suppliers by region')}
      >
        {items.map((s) => (
          <SmartLink key={s.name} href={`/sellers?state=${encodeURIComponent(s.name)}`} className="region-card group card card-lift flex w-[138px] shrink-0 snap-start flex-col items-center gap-1.5 px-3 py-4 text-center sm:w-[156px]" title={s.name}>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[linear-gradient(135deg,#eaf7ee,#cdeed6)] font-display text-[0.92rem] font-bold tracking-wide text-gold-deep shadow-sm ring-2 ring-white transition duration-300 group-hover:scale-110 group-hover:bg-[linear-gradient(135deg,#d9f2e1,#a9e0bb)]">{s.code}</span>
            <span className="flex w-full items-center justify-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={flag} alt="" className="h-3.5 w-3.5 shrink-0" draggable={false} />
              <span className="line-clamp-2 min-w-0 text-[0.86rem] font-semibold leading-tight text-ink/85 [overflow-wrap:anywhere]">{s.name}</span>
            </span>
            <span className="text-[0.7rem] text-ink/45">
              {s.sellers ? `${s.sellers} ${s.sellers === 1 ? t('seller') : t('sellers')}` : t('View sellers')}
            </span>
          </SmartLink>
        ))}
      </div>
      <button type="button" onClick={() => go(-1)} aria-label={t('Previous')} className={cn('absolute -left-2 top-[42%] z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-[0_8px_24px_-8px_rgba(0,0,0,.35)] ring-1 ring-ink/10 transition hover:bg-gold hover:text-white md:grid', edge.start && 'opacity-60')}>
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button type="button" onClick={() => go(1)} aria-label={t('Next')} className={cn('absolute -right-2 top-[42%] z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-[0_8px_24px_-8px_rgba(0,0,0,.35)] ring-1 ring-ink/10 transition hover:bg-gold hover:text-white md:grid', edge.end && 'opacity-60')}>
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
