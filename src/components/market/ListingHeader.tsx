import Breadcrumbs from './Breadcrumbs';
import Particles from '@/components/site/Particles';

export type { Crumb } from './Breadcrumbs';
import type { Crumb } from './Breadcrumbs';

/** Compact page header for marketplace listing / detail pages (breadcrumb + title + optional right side) */
export default function ListingHeader({ crumbs, eyebrow, title, lead, right, compact }: { crumbs: Crumb[]; eyebrow?: string; title: string; lead?: string; right?: React.ReactNode; compact?: boolean }) {
  return (
    <section className={`hero-stage theme-light ${compact ? 'pb-8 pt-[7.5rem] sm:pt-[8rem]' : 'pb-10 pt-[8rem] sm:pb-14 sm:pt-[8.5rem]'}`}>
      <div className="hero-aurora" />
      <div className="hero-grid" />
      <Particles density={0.25} />
      <div className="container-x relative">
        <Breadcrumbs crumbs={crumbs} className="fx-up" />
        <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
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
