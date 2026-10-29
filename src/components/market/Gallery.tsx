'use client';
import { useRef, useState } from 'react';
import { Coin } from '@/components/site/Logo';
import { cn } from '@/lib/utils';

/**
 * Product photos. Phones: swipe between photos (scroll-snap) with a counter and dots.
 * Larger screens: big photo + thumbnails.
 */
export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  if (!images.length)
    return (
      <div className="grid aspect-square place-items-center rounded-[28px] bg-[radial-gradient(circle_at_30%_20%,#f0faf2,#cdeed6)]">
        <Coin className="h-28 w-28 opacity-70" />
      </div>
    );
  const goTo = (k: number) => {
    setI(k);
    const el = strip.current;
    if (el) el.scrollTo({ left: k * el.clientWidth, behavior: 'smooth' });
  };
  return (
    <div>
      <div className="relative overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_30%_20%,#ffffff,#eef5f0_75%)] shadow-[0_24px_50px_-30px_rgba(0,70,25,.45)] ring-1 ring-black/5 sm:rounded-[28px]">
        <div
          ref={strip}
          onScroll={(e) => {
            const el = e.currentTarget;
            const k = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
            if (k !== i) setI(k);
          }}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, k) => (
            <div key={src + k} className="group/img aspect-square w-full shrink-0 snap-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={k === 0 ? alt : ''} loading={k === 0 ? 'eager' : 'lazy'} className="h-full w-full object-contain p-4 transition-transform duration-700 ease-out sm:p-6 lg:group-hover/img:scale-110" />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <>
            <span className="absolute end-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[0.7rem] font-bold text-white backdrop-blur">
              {i + 1} / {images.length}
            </span>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 sm:hidden">
              {images.map((_, k) => (
                <button key={k} type="button" onClick={() => goTo(k)} className={cn('h-1.5 rounded-full transition-all', k === i ? 'w-5 bg-gold' : 'w-1.5 bg-ink/25')} aria-label={`Image ${k + 1}`} />
              ))}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 hidden gap-2 overflow-x-auto pb-1 sm:flex">
          {images.map((src, k) => (
            <button key={src + k} type="button" onClick={() => goTo(k)} className={cn('h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white ring-2 transition', k === i ? 'ring-gold' : 'ring-transparent hover:ring-ink/20')} aria-label={`Image ${k + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
