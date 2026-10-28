import { ChevronRight, Home } from 'lucide-react';
import SmartLink from '@/components/ui/SmartLink';
import Particles from '@/components/site/Particles';
import T from '@/components/ui/T';

export type Crumb = { label: string; href?: string };

/** Compact page header for marketplace listing / detail pages (breadcrumb + title + optional right side) */
export default function ListingHeader({ crumbs, eyebrow, title, lead, right, compact }: { crumbs: Crumb[]; eyebrow?: string; title: string; lead?: string; right?: React.ReactNode; compact?: boolean }) {
  return (
    <section className={`hero-stage theme-light ${compact ? 'pb-8 pt-[7.5rem] sm:pt-[8rem]' : 'pb-10 pt-[8rem] sm:pb-14 sm:pt-[8.5rem]'}`}>
      <div className="hero-aurora" />
      <div className="hero-grid" />
      <Particles density={0.25} />
      <div className="container-x relative">
        <nav aria-label="Breadcrumb" className="fx-up flex flex-wrap items-center gap-1.5 text-[0.8rem] text-[#6e6e73]">
          <SmartLink href="/" className="inline-flex items-center gap-1 hover:text-black">
            <Home className="h-3.5 w-3.5" />
            <T>Home</T>
          </SmartLink>
          {crumbs.map((c, i) => (
            <span key={i} className="contents">
              <ChevronRight className="h-3.5 w-3.5 opacity-50" />
              {c.href ? (
                <SmartLink href={c.href} className="hover:text-black">{c.label}</SmartLink>
              ) : (
                <span className="line-clamp-1 text-[#1d1d1f]">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            {eyebrow && <p className="eyebrow fx-up">{eyebrow}</p>}
            <h1 className="h-display fx-blur mt-2 text-[clamp(1.9rem,1.2rem+2.6vw,3.4rem)]">{title}</h1>
            {lead && <p className="lead fx-up mt-3 max-w-2xl">{lead}</p>}
          </div>
          {right && <div className="fx-up">{right}</div>}
        </div>
      </div>
    </section>
  );
}
