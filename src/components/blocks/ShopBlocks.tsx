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
  const all = tree.flatMap((r) => [r, ...r.children]);
  const limit = Math.max(4, Number(data.sidebarItems) || 9);
  // Popular categories: the ones marked "Featured" in Admin → Categories (main categories first).
  // Without any featured ones, the main categories plus their first sub-categories are shown.
  let list = all.filter((c) => c.featured);
  if (list.length < 4) {
    const roots = tree.slice(0, 3);
    const subs: typeof roots = [];
    for (let k = 0; roots.length && subs.length < limit; k++) {
      const row = roots.map((r) => r.children[k]).filter(Boolean);
      if (!row.length) break;
      subs.push(...row);
    }
    list = [...roots, ...subs];
  }
  list = list.slice(0, limit);
  const slides = (Array.isArray(data.slides) ? data.slides : []).filter((s: any) => s && (s.image || s.title));
  return (
    <section id={data.anchor || undefined} className="theme-light relative pt-[7.6rem] sm:pt-[8.2rem]">
      <div className="hero-aurora" />
      <div className="container-x relative">
        <div className="grid items-stretch gap-5 lg:grid-cols-[290px_1fr]">
          {/* popular categories — same height as the search + slider column */}
          <aside className="fx-up glass relative hidden flex-col overflow-hidden rounded-[26px] p-3 lg:flex" style={{ ['--d' as any]: '.05s' }}>
            <SmartLink href="/products" className="flex items-center justify-between px-3 py-2 font-display text-[1.12rem] font-semibold text-ink">
              <span className="inline-flex items-center gap-2"><Icon name="boxes" className="h-5 w-5 text-gold-deep" /> {data.sidebarTitle || t('Popular categories')}</span>
              <ChevronRight className="h-4 w-4 text-ink/40" />
            </SmartLink>
            <ul className="hero-cats mt-1 flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden">
              {list.map((c) => (
                <li key={c.id} className="min-h-0 flex-1">
                  <SmartLink href={`/category/${c.slug}`} className="group flex h-full min-h-[40px] items-center justify-between rounded-2xl border border-ink/5 bg-white/85 px-3.5 text-[0.93rem] text-ink/85 shadow-sm transition hover:-translate-y-px hover:border-gold hover:text-gold-deep hover:shadow-md">
                    <span className="inline-flex min-w-0 items-center gap-2.5">
                      {c.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.image} alt="" className="h-6 w-6 object-contain" />
                      ) : (
                        <span className="grid h-6 w-6 place-items-center rounded-lg bg-gold/10"><Icon name={c.icon || 'leaf'} className="h-3.5 w-3.5 text-gold-deep" /></span>
                      )}
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-ink/35">{c.count ? c.count : ''}<ChevronRight className="h-4 w-4" /></span>
                  </SmartLink>
                </li>
              ))}
            </ul>
            <SmartLink href="/products" className="mt-2 flex items-center justify-center gap-1.5 rounded-2xl bg-ink px-3 py-2.5 text-sm font-bold text-white transition hover:bg-gold-deep">
              {t('All categories')} <ArrowRight className="h-4 w-4" />
            </SmartLink>
          </aside>
          {/* search + slider */}
          <div className="min-w-0">
            <div className="fx-up" style={{ ['--d' as any]: '.1s' }}>
              <ShopSearch placeholder={data.searchPlaceholder || t('Search for buyer or supplier...')} supplierLabel={data.supplierLabel || t('Find Supplier')} buyerLabel={data.buyerLabel || t('Find Buyer')} />
            </div>
            <div className="fx-up mt-4" style={{ ['--d' as any]: '.18s' }}>
              <ShopSlider slides={JSON.parse(JSON.stringify(slides))} interval={Number(data.interval) || 6} />
            </div>
            {/* categories on phones: round image chips, app style */}
            <div className="thin-scroll mt-4 flex gap-3 overflow-x-auto pb-2 lg:hidden">
              {list.map((c) => (
                <SmartLink key={c.id} href={`/category/${c.slug}`} className="flex w-[76px] shrink-0 flex-col items-center gap-1.5 text-center">
                  <span className="glass grid h-16 w-16 place-items-center rounded-[22px]">
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image} alt="" className="h-9 w-9 object-contain" />
                    ) : (
                      <Icon name={c.icon || 'leaf'} className="h-7 w-7 text-gold-deep" />
                    )}
                  </span>
                  <span className="line-clamp-2 text-[0.7rem] font-semibold leading-tight text-ink/80">{c.name}</span>
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
function RowHead({ title, href, label, sub }: { title: string; href?: string; label?: string; sub?: string }) {
  return (
    <div className="reveal mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="font-display text-[1.45rem] font-semibold tracking-tight text-ink sm:text-[1.75rem]">{title}</h2>
        <span className="mt-2 block h-1 w-14 rounded-full" style={{ background: 'var(--gold-grad)' }} />
        {sub && <p className="mt-2 text-sm text-ink/55">{sub}</p>}
      </div>
      {href && (
        <SmartLink href={href} className="btn btn-outline btn-sm shrink-0 !rounded-full">
          {label || 'View all'} <ArrowRight className="h-4 w-4" />
        </SmartLink>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ product row (live products, or sample items) */
export async function ProductRow({ data }: P) {
  const { t } = await getI18n();
  const take = Math.max(4, Number(data.limit) || 8);
  type C = { href: string; image: string; name: string; rating: number; count?: number; sub?: string; moq?: string; verified?: boolean; seller?: string; place?: string; featured?: boolean };
  let cards: C[] = [];
  let categoryIds: string[] | undefined;
  if (data.category) {
    const tree = await getCategoryTree();
    const all = tree.flatMap((r) => [r, ...r.children]);
    const c = all.find((x) => x.slug === data.category);
    if (c) categoryIds = [c.id, ...tree.filter((r) => r.id === c.id).flatMap((r) => r.children.map((x) => x.id))];
  }
  const { items } = await listProducts({ take, categoryIds, sort: data.sort || 'new', featured: data.onlyFeatured ? true : undefined });
  if (items.length) cards = items.map((p) => ({ href: `/products/${p.slug}`, image: imgs(p.images)[0] || '', name: p.name, rating: p.ratingAvg || 0, count: p.ratingCount, sub: priceLabel(p), moq: p.moq || undefined, verified: p.seller?.verified, seller: p.seller?.companyName, place: p.seller?.city || p.seller?.state || undefined, featured: p.featured }));
  else if (data.samples !== false) {
    const sample = (Array.isArray(data.items) ? data.items : []).filter((x: any) => x?.image || x?.title);
    cards = sample.map((s: any) => ({ href: s.link?.href || '/products', image: s.image || '', name: s.title || 'Product', rating: Number(s.rating) || 5, sub: s.meta, verified: true }));
  }
  if (!cards.length) return null;
  const grid = data.layout === 'grid';
  return (
    <Section data={data} tight>
      <div className="container-x">
        <RowHead title={data.heading || t('Products')} href={data.cta?.href || '/products'} label={data.cta?.label || t('View all')} sub={data.lead} />
        <div className={cn(grid ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 sm:gap-4' : 'thin-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-4 snap-x sm:gap-4')}>
          {cards.map((c, i) => (
            <SmartLink key={c.href + i} href={c.href} className={cn('pcard reveal group snap-start', !grid && 'w-[168px] shrink-0 sm:w-[200px]')}>
              <div className="pcard-img">
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt={c.name} loading="lazy" className="h-[82%] w-[82%] object-contain transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <Icon name="leaf" className="h-10 w-10 text-gold" />
                )}
                {c.featured && <span className="pcard-tag">{t('Featured')}</span>}
                {c.verified && <span className="pcard-verified"><BadgeCheck className="h-3 w-3" /> {t('Verified')}</span>}
              </div>
              <div className="px-3 pb-3 pt-2.5 text-start">
                <p className="line-clamp-1 text-[0.93rem] font-semibold text-ink">{c.name}</p>
                {c.sub && <p className="mt-0.5 line-clamp-1 text-[0.8rem] font-bold text-gold-deep">{c.sub}</p>}
                <p className="line-clamp-1 text-[0.72rem] text-ink/50">{c.moq ? `${t('MOQ')}: ${c.moq}` : c.seller || t('Price on request')}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5"><Rating value={c.rating} /> {c.count ? <span className="text-[0.68rem] text-ink/45">({c.count})</span> : null}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={FLAG} alt="India" className="h-4 w-4" title={c.place || 'India'} />
                </div>
                <span className="pcard-btn">{t('Inquire now')} <ArrowRight className="h-3.5 w-3.5" /></span>
              </div>
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
                <span className="btn btn-outline btn-sm mt-5 bg-white transition group-hover:border-gold group-hover:bg-gold group-hover:text-white">View More <ArrowRight className="h-3.5 w-3.5" /></span>
              </div>
              {c.image && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt="" loading="lazy" className={cn('pointer-events-none absolute transition-transform duration-700 group-hover:scale-105', wide ? 'inset-y-0 right-0 h-full w-1/2 object-cover' : 'bottom-0 left-0 h-[48%] w-full object-cover')} />
                  <span className={cn('pointer-events-none absolute', wide ? 'inset-y-0 right-1/2 w-24 bg-gradient-to-r from-[#f7f6f1] to-transparent' : 'inset-x-0 top-[52%] h-10 bg-gradient-to-b from-[#f7f6f1] to-transparent -translate-y-full')} />
                </>
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
        <RowHead title={data.heading || 'Suppliers By Region'} href={data.cta?.href || '/regions'} label={data.cta?.label || 'All states'} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {list.map((s) => (
            <SmartLink key={s} href={`/sellers?state=${encodeURIComponent(s)}`} className="card card-lift tilt reveal group flex min-h-[104px] flex-col items-center justify-center gap-1.5 p-3 text-center text-[0.9rem] font-semibold text-ink/85">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[linear-gradient(135deg,#eaf7ee,#cdeed6)] font-display text-[0.95rem] font-bold text-gold-deep ring-2 ring-white shadow-sm transition group-hover:scale-110">{s.slice(0, 2).toUpperCase()}</span>
              <span className="inline-flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={FLAG} alt="" className="h-3.5 w-3.5" />
                <span className="line-clamp-1">{s}</span>
              </span>
              <span className="text-[0.7rem] font-normal text-ink/45">{counts.get(s) ? `${counts.get(s)} sellers` : 'View sellers'}</span>
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
