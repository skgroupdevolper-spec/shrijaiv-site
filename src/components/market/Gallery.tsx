'use client';
import { useState } from 'react';
import { Coin } from '@/components/site/Logo';

export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  if (!images.length)
    return (
      <div className="grid aspect-square place-items-center rounded-[28px] bg-[radial-gradient(circle_at_30%_20%,#f0faf2,#cdeed6)]">
        <Coin className="h-28 w-28 opacity-70" />
      </div>
    );
  return (
    <div>
      <div className="tilt card aspect-square overflow-hidden !rounded-[28px] bg-[#eaf5ec]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[i]} alt={alt} className="h-full w-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, k) => (
            <button key={src + k} type="button" onClick={() => setI(k)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition ${k === i ? 'ring-gold' : 'ring-transparent hover:ring-ink/20'}`} aria-label={`Image ${k + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
