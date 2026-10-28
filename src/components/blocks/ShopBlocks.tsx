// Sections that follow the original SHRIJAIV layout (category sidebar + slider, product rows,
// "WANTED" buyer cards, ad banners, suppliers by region, trust logos, team) with the glass / 3D styling.
import { ArrowRight, BadgeCheck, ChevronRight, Phone, Star, MapPin } from 'lucide-react';
import type { SiteSettings } from '@/lib/defaults';
import SmartLink from '@/components/ui/SmartLink';
import { Icon } from '@/components/ui/Icon';
import { Btn, Head, Section, lines, hasLink } from './parts';
import { getCategoryTree, listProducts, listRequirements, listSellers, INDIAN_STATES } from '@/lib/marketplace/data';
import { images as imgs, priceLabel } from '@/lib/marketplace/format';
import { getPartners } from '@/lib/data';
import { getI18n } from '@/lib/i18n/server';
import { formatDate, cn } from '@/lib/utils';
import ShopSlider from '@/components/market/ShopSlider';
import ShopSearch from '@/components/market/ShopSearch';
import { Rating } from '@/components/market/Rating';

type P = { data: any; site: SiteSettings };

const FLAG = '/images/site/india.png';

/* ------------------------------------------------------------------ hero: sidebar + search + slider */
export async function ShopHero({ data, site }: P) {
  const { t } = await getI18n();
  const tree = await getCategoryTree();
  const roots = tree.slice(0, 3);
  // sub-categories interleaved across the main categories (fruit, cream, flours, vegetables, face wash…)
  const subs: typeof roots = [];
  const max = Math.max(0, (Number(data.sidebarItems) || 10) - roots.length);
  for (let k = 0; subs.length < max; k++) {
    const row = roots.map((r) => r.children[k]).filter(Boolean);
    if (!row.length) break;
    subs.push(...row.slice(0, max - subs.length));
  }
  const slides = (Array.isArray(data.slides) ? data.slides : []).filter((s: any) => s && (s.image || s.title));
  return (
    <section id={data.anchor || undefined} className="theme-light relative pt-[7.6rem] sm:pt-[8.2rem]">
      <div className="hero-aurora" />
      <div className="container-x relative">
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          {/* category sidebar */}
          <aside className="fx-up glass hidden rounded-[26px] p-3 lg:block" style={{ ['--d' as any]: '.05s' }}>
            <SmartLink href="/products" className="flex items-center justify-between px-3 py-2 font-display text-[1.15rem] font-semibold text-ink">
              <span className="inline-flex items-center gap-2"><Icon name="boxes" className="h-5 w-5 text-gold-deep" /> {data.sidebarTitle || t('All Category')}</span>
              <ChevronRight className="h-4 w-4 rotate-90 text-ink/40" />
            </SmartLink>
            <ul className="mt-1 space-y-1.5">
              {[...roots, ...subs].map((c) => (
                <li key={c.id}>
                  <SmartLink href={`/category/${c.slug}`} className="group flex items-center justify-between rounded-2xl border border-ink/5 bg-white/80 px-3.5 py-2.5 text-[0.95rem] text-ink/85 shadow-sm transition hover:-translate-y-px hover:border-gold hover:text-gold-deep hover:shadow-md">
                    <span className="inline-flex items-center gap-2.5">
                      {c.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.image} alt="" className="h-5 w-5 object-contain" />
                      ) : (
                        <Icon name={c.icon || 'leaf'} className="h-4.5 w-4.5 text-ink/60 group-hover:text-gold-deep" />
                      )}
                      {c.name}
                    </span>
                    {c.children.length > 0 && <ChevronRight className="h-4 w-4 text-ink/30" />}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </aside>
          {/* search + slider */}
          <div className="min-w-0">
            <div className="fx-up" style={{ ['--d' as any]: '.1s' }}>
              <ShopSearch placeholder={data.searchPlaceholder || t('Search for buyer or supplier...')} supplierLabel={data.supplierLabel || t('Find Supplier')} buyerLabel={data.buyerLabel || t('Find Buyer')} />
            </div>
            <div className="fx-up mt-4" style={{ ['--d' as any]: '.18s' }}>
              <ShopSlider slides={JSON.parse(JSON.stringify(slides))} interval={Number(data.interval) || 6} />
            </div>
            {/* categories on phones */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {[...roots, ...subs].map((c) => (
                <SmartLink key={c.id} href={`/category/${c.slug}`} className="glass shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold text-ink/80">
                  {c.name}
                </SmartLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ section heading row (title + View all) */
function RowHead({ title, href, label }: { title: string; href?: string; label?: string }) {
  return (
    <div className="reveal mb-5 flex items-center justify-between gap-4">
      <h2 className="font-display text-[1.45rem] font-semibold tracking-tight text-ink sm:text-[1.7rem]">{title}</h2>
      {href && (
        <SmartLink href={href} className="btn btn-outline btn-sm !rounded-full">
          {label || 'View all'}
        </SmartLink>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ product row (live products, or sample items) */
export async function ProductRow({ data }: P) {
  const take = Math.max(4, Number(data.limit) || 8);
  let cards: { href: string; image: string; name: string; rating: number; sub?: string }[] = [];
  let categoryIds: string[] | undefined;
  if (data.category) {
    const tree = await getCategoryTree();
    const all = tree.flatMap((r) => [r, ...r.children]);
    const c = all.find((x) => x.slug === data.category);
    if (c) categoryIds = [c.id, ...tree.filter((r) => r.id === c.id).flatMap((r) => r.children.map((x) => x.id))];
  }
  const { items } = await listProducts({ take, categoryIds, sort: data.sort || 'new', featured: data.onlyFeatured ? true : undefined });
  if (items.length) cards = items.map((p) => ({ href: `/products/${p.slug}`, image: imgs(p.images)[0] || '', name: p.name, rating: p.ratingAvg || 0, sub: priceLabel(p) }));
  else if (data.samples !== false) {
    const sample = (Array.isArray(data.items) ? data.items : []).filter((x: any) => x?.image || x?.title);
    cards = sample.map((s: any) => ({ href: s.link?.href || '/products', image: s.image || '', name: s.title || 'Product', rating: Number(s.rating) || 5, sub: s.meta }));
  }
  if (!cards.length) return null;
  const grid = data.layout === 'grid';
  return (
    <Section data={data} tight>
      <div className="container-x">
        <RowHead title={data.heading || 'Products'} href={data.cta?.href || '/products'} label={data.cta?.label} />
        <div className={cn(grid ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6' : 'thin-scroll flex gap-3 overflow-x-auto pb-3 snap-x')}>
          {cards.map((c, i) => (
            <SmartLink key={c.href + i} href={c.href} className={cn('card card-lift tilt reveal group flex flex-col items-center p-3 text-center snap-start', !grid && 'w-[160px] shrink-0 sm:w-[185px]')}>
              <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-2xl bg-[#f4f6f4]">
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt={c.name} loading="lazy" className="h-[80%] w-[80%] object-contain transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <Icon name="leaf" className="h-10 w-10 text-gold" />
                )}
              </div>
              <p className="mt-3 line-clamp-1 text-[0.95rem] font-semibold text-ink">{c.name}</p>
              {c.sub && <p className="line-clamp-1 text-xs text-ink/50">{c.sub}</p>}
              <span className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#f4f6f4] px-2.5 py-1">
                <Rating value={c.rating} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={FLAG} alt="India" className="h-4 w-4" />
              </span>
            </SmartLink>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ WANTED buyer cards (live requirements or samples) */
export async function WantedCards({ data }: P) {
  const take = Math.max(2, Number(data.limit) || 4);
  const bgs = lines(data.images);
  const { items } = await listRequirements({ take });
  type C = { href: string; date: string; verified: boolean; wanted: string; from: string; text: string; image: string };
  let cards: C[] = items.map((r, i) => ({ href: `/requirements/${r.id}`, date: formatDate(r.createdAt), verified: !!r.buyer?.verified, wanted: r.title, from: `Buyer from ${r.deliveryState || r.buyer?.state || 'India'}`, text: r.details || `Buyer is interested in receiving quotations${r.quantity ? ` for ${r.quantity} ${r.unit || ''}` : ''}.`, image: bgs[i % Math.max(1, bgs.length)] || '' }));
  if (!cards.length && data.samples !== false) {
    cards = (Array.isArray(data.items) ? data.items : []).filter((x: any) => x?.title).map((s: any, i: number) => ({ href: s.link?.href || '/post-requirement', date: s.meta || '', verified: true, wanted: s.title, from: s.extra || 'Buyer from India', text: s.body || '', image: s.image || bgs[i % Math.max(1, bgs.length)] || '' }));
  }
  if (!cards.length) return null;
  const wide = data.layout === 'wide';
  return (
    <Section data={data} tight>
      <div className="container-x">
        <RowHead title={data.heading || 'Buyers are looking for'} href={data.cta?.href || '/requirements'} label={data.cta?.label} />
        <div className={cn('grid gap-4', wide ? 'md:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-4')}>
          {cards.slice(0, take).map((c, i) => (
            <SmartLink key={c.href + i} href={c.href} className={cn('card card-lift tilt reveal group relative flex flex-col overflow-hidden !rounded-[22px] bg-[#f7f6f1] p-6', wide ? 'min-h-[260px] md:flex-row md:items-start' : 'min-h-[400px]')}>
              <div className={cn('relative z-[1]', wide && 'md:w-1/2')}>
                <p className="flex items-center gap-2 text-[0.72rem] text-ink/60">
                  {c.date} <span className="inline-flex items-center gap-1 font-bold uppercase text-emerald-600"><BadgeCheck className="h-3.5 w-3.5" /> {c.verified ? 'Verified' : 'Buyer'}</span>
                </p>
                <p className="mt-2 text-sm font-semibold text-rose-600">WANTED: {c.wanted}</p>
                <p className="mt-1 font-display text-[1.6rem] font-semibold leading-tight text-ink">{c.from}</p>
                <p className="mt-3 line-clamp-3 text-sm text-ink/70">{c.text}</p>
                <span className="btn btn-outline btn-sm mt-5 bg-white">View More</span>
              </div>
              {c.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt="" loading="lazy" className={cn('pointer-events-none absolute transition-transform duration-700 group-hover:scale-105', wide ? 'inset-y-0 right-0 h-full w-1/2 object-cover' : 'bottom-0 left-0 h-[48%] w-full object-cover')} />
              )}
            </SmartLink>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ ad banner */
export function AdBanner({ data }: P) {
  if (!data.image) return null;
  const inner = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={data.image} alt={data.alt || ''} loading="lazy" className="w-full rounded-2xl object-cover shadow-lg transition-transform duration-500 hover:scale-[1.01]" style={{ maxHeight: data.height ? `${data.height}px` : undefined }} />
  );
  return (
    <section id={data.anchor || undefined} className="theme-light py-6">
      <div className={cn('container-x reveal', data.narrow !== false && 'max-w-5xl')}>{hasLink(data.link) ? <SmartLink href={data.link.href}>{inner}</SmartLink> : inner}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ suppliers by region */
export async function Regions({ data }: P) {
  const states = lines(data.states).length ? lines(data.states) : INDIAN_STATES;
  const counts = new Map<string, number>();
  try {
    const { items } = await listSellers({ take: 60 });
    for (const s of items) if (s.state) counts.set(s.state, (counts.get(s.state) || 0) + 1);
  } catch {}
  const list = data.limit ? states.slice(0, Number(data.limit)) : states;
  return (
    <Section data={data} tight>
      <div className="container-x">
        <RowHead title={data.heading || 'Suppliers By Region'} href={data.cta?.href || '/sellers'} label={data.cta?.label} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {list.map((s) => (
            <SmartLink key={s} href={`/sellers?state=${encodeURIComponent(s)}`} className="card card-lift tilt reveal flex min-h-[100px] flex-col items-center justify-center gap-1 p-3 text-center text-[0.95rem] font-semibold text-ink/85">
              <span className="inline-flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={FLAG} alt="" className="h-4 w-4" />
                {s}
              </span>
              {counts.get(s) ? <span className="text-xs font-normal text-ink/45">{counts.get(s)} sellers</span> : null}
            </SmartLink>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ trust logos (round) */
export async function TrustLogos({ data }: P) {
  const items = await getPartners();
  const custom = lines(data.images);
  const logos = items.length ? items.map((p: any) => ({ src: p.logo, name: p.name, url: p.url })) : custom.map((src, i) => ({ src, name: `Partner ${i + 1}`, url: '' }));
  if (!logos.length) return null;
  const loop = [...logos, ...logos];
  return (
    <Section data={data} tight>
      <div className="container-x">
        <RowHead title={data.heading || '1.2 million businesses trust us'} href={data.cta?.href} label={data.cta?.label} />
      </div>
      <div className="marquee-mask hover-pause relative overflow-hidden">
        <div className="animate-marquee flex w-max gap-6 px-4">
          {loop.map((l, i) => (
            <span key={i} aria-hidden={i >= logos.length || undefined} className="tilt grid h-36 w-36 shrink-0 place-items-center rounded-full border border-ink/10 bg-white shadow-[0_10px_30px_-18px_rgba(0,0,0,.35)] transition hover:border-gold">
              {l.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.src} alt={l.name} loading="lazy" className="h-24 w-24 rounded-full object-contain" />
              ) : (
                <span className="text-sm font-bold text-ink/60">{l.name}</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ team card(s) */
export function Team({ data }: P) {
  const items = (Array.isArray(data.items) ? data.items : []).filter((x: any) => x?.title);
  if (!items.length) return null;
  return (
    <Section data={data}>
      <div className="container-x">
        <Head label={data.label} heading={data.heading} accent={data.accent} lead={data.lead} />
        <div className={cn('mt-10 grid gap-6', items.length === 1 ? 'mx-auto max-w-2xl' : items.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3')}>
          {items.map((m: any, i: number) => (
            <div key={i} className="card card-lift tilt reveal p-8 text-center">
              {m.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.image} alt={m.title} loading="lazy" className="mx-auto h-36 w-36 rounded-full object-cover ring-4 ring-white shadow-xl" />
              )}
              <p className="mt-5 font-display text-2xl font-semibold text-ink">{m.title}</p>
              {m.meta && <p className="font-semibold text-gold-deep">{m.meta}</p>}
              {m.body && <p className="mt-3 text-[0.95rem] leading-relaxed text-ink/70">{m.body}</p>}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ blob image + text (About page "2024" / "What we do") */
export function BlobSplit({ data }: P) {
  const points = lines(data.points);
  return (
    <Section data={data}>
      <div className={cn('container-x grid items-center gap-10 lg:grid-cols-2', data.reverse && 'lg:[&>*:first-child]:order-2')}>
        <div className="reveal relative mx-auto w-full max-w-md">
          <div className="absolute -inset-6 -z-10 rounded-[45%_55%_60%_40%/50%_40%_60%_50%] bg-gold/15 blur-2xl" />
          {data.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.image} alt={data.imageAlt || ''} loading="lazy" className="tilt w-full drop-shadow-[0_25px_40px_rgba(0,90,30,.25)]" />
          )}
        </div>
        <div className="reveal">
          <Head label={data.label} heading={data.heading} accent={data.accent} lead={data.lead} align="left" />
          {points.length > 0 && (
            <ul className="mt-5 space-y-2.5">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[0.98rem] text-ink/80"><span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-deep"><Star className="h-3 w-3" /></span>{p}</li>
              ))}
            </ul>
          )}
          <div className="mt-7 flex flex-wrap gap-3">
            <Btn link={data.primary} variant="gold" arrow />
            <Btn link={data.secondary} variant="outline" icon={data.secondary?.href === 'phone' ? <Phone className="h-4 w-4" /> : undefined} />
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ photo page banner (About hero) */
export function PhotoBanner({ data }: P) {
  return (
    <section id={data.anchor || undefined} className="theme-light relative pt-[7.6rem] sm:pt-[8.2rem]">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-[28px] shadow-xl">
          {data.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.image} alt="" className="h-[320px] w-full object-cover sm:h-[420px]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8 text-center text-white sm:p-12">
            {data.eyebrow && <p className="eyebrow justify-center text-gold-light">{data.eyebrow}</p>}
            <h1 className="fx-blur font-display text-[clamp(2rem,1.5rem+2.5vw,3.6rem)] font-semibold">{data.title}</h1>
            {data.lead && <p className="fx-up mx-auto mt-3 max-w-2xl text-white/85">{data.lead}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ icon trio ("How it works" on About) */
export function IconTrio({ data }: P) {
  const items = (Array.isArray(data.items) ? data.items : []).filter((x: any) => x?.title);
  if (!items.length) return null;
  return (
    <Section data={data}>
      <div className="container-x">
        <Head label={data.label} heading={data.heading} accent={data.accent} lead={data.lead} />
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {items.map((m: any, i: number) => (
            <div key={i} className="reveal text-center">
              {m.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.image} alt="" loading="lazy" className="mx-auto h-28 object-contain drop-shadow-md" />
              ) : (
                <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl text-white" style={{ background: 'var(--gold-grad)' }}><Icon name={m.icon || 'leaf'} className="h-9 w-9" /></span>
              )}
              <p className="mt-5 font-display text-xl font-semibold text-ink">{m.title}</p>
              {m.body && <p className="mt-2 text-[0.95rem] text-ink/70">{m.body}</p>}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
