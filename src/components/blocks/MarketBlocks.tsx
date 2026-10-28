// Marketplace sections for the page builder: hero with search, category grid, featured products,
// featured sellers, latest buy leads, membership plans and live counters.
import { ArrowRight, BadgeCheck, Store, ShoppingBag, Megaphone, Users, Check, Leaf } from 'lucide-react';
import type { SiteSettings } from '@/lib/defaults';
import SmartLink from '@/components/ui/SmartLink';
import Particles from '@/components/site/Particles';
import { Icon } from '@/components/ui/Icon';
import Counter from '@/components/ui/Counter';
import { Btn, Head, Section, lines, hasLink } from './parts';
import { getCategoryTree, flattenTree, listProducts, listSellers, listRequirements, getPlans, marketStats, inr } from '@/lib/marketplace/data';
import { getMarketplace } from '@/lib/marketplace/settings';
import SearchBar from '@/components/market/SearchBar';
import ProductCard from '@/components/market/ProductCard';
import SellerCard from '@/components/market/SellerCard';
import RequirementCard from '@/components/market/RequirementCard';
import { cn } from '@/lib/utils';

type P = { data: any; site: SiteSettings };

/* ------------------------------------------------------------------ hero with search */
export async function MarketHero({ data }: P) {
  const [tree, stats] = await Promise.all([getCategoryTree(), marketStats()]);
  const chips = lines(data.chips);
  const counters = [
    { v: stats.sellers, l: data.statSellers || 'Verified sellers', I: Store },
    { v: stats.products, l: data.statProducts || 'Organic products', I: Leaf },
    { v: stats.buyers, l: data.statBuyers || 'Active buyers', I: Users },
    { v: stats.requirements, l: data.statLeads || 'Open buy leads', I: Megaphone },
  ];
  return (
    <section id={data.anchor || undefined} className="hero-stage theme-light pb-14 pt-[8.2rem] sm:pb-20 sm:pt-[9.5rem]">
      <div className="hero-aurora" />
      <div className="hero-grid" />
      {data.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.image} alt="" aria-hidden className="absolute inset-0 -z-[3] h-full w-full object-cover opacity-[0.08]" />
      )}
      {data.particles !== false && <Particles focus="card" />}
      <div className="container-x relative text-center">
        {data.badge && (
          <p className="fx-up pill mx-auto" style={{ ['--d' as any]: '0s' }}>
            <span className="dot-gold" />
            {data.badge}
          </p>
        )}
        <h1 className="hero-title fx-blur mt-6" style={{ ['--d' as any]: '.05s' }}>
          {data.title && <span className="accent">{data.title}</span>} {data.titleAccent && <span>{data.titleAccent}</span>}
        </h1>
        {data.lead && (
          <p className="fx-up lead mx-auto mt-6 max-w-2xl !text-[clamp(1.05rem,0.9rem+0.6vw,1.4rem)] !text-[#3a3a3c]" style={{ ['--d' as any]: '.18s' }}>
            {data.lead}
          </p>
        )}
        <div className="fx-up mt-9" style={{ ['--d' as any]: '.26s' }}>
          <SearchBar big categories={flattenTree(tree).map((c) => ({ slug: c.slug, name: c.parentId ? `  – ${c.name}` : c.name }))} />
        </div>
        {chips.length > 0 && (
          <div className="fx-up mt-5 flex flex-wrap justify-center gap-2" style={{ ['--d' as any]: '.34s' }}>
            <span className="text-xs text-ink/50">{data.chipsLabel || 'Popular:'}</span>
            {chips.map((c) => (
              <SmartLink key={c} href={`/products?q=${encodeURIComponent(c)}`} className="rounded-full border border-ink/10 bg-white/70 px-3 py-1 text-xs font-semibold text-ink/70 backdrop-blur hover:border-gold hover:text-gold-deep">
                {c}
              </SmartLink>
            ))}
          </div>
        )}
        <div className="fx-up btn-row mt-8 flex flex-wrap justify-center gap-3" style={{ ['--d' as any]: '.4s' }}>
          <Btn link={data.primary} variant="dark" size="lg" arrow />
          <Btn link={data.secondary} variant="outline" size="lg" />
        </div>
        {data.counters !== false && (
          <div className="fx-up mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4" style={{ ['--d' as any]: '.5s' }}>
            {counters.map((c) => (
              <div key={c.l} className="glass rounded-3xl px-4 py-5">
                <c.I className="mx-auto h-5 w-5 text-gold-deep" />
                <p className="mt-2 font-display text-3xl font-semibold text-ink">
                  <Counter value={`${c.v}${c.v >= 10 ? '+' : ''}`} />
                </p>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">{c.l}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ categories */
export async function Categories({ data }: P) {
  const tree = await getCategoryTree();
  const roots = data.onlyFeatured ? tree.filter((c) => c.featured) : tree;
  if (!roots.length) return null;
  const showSub = data.showSub !== false;
  return (
    <Section data={data} fallback="sand">
      <div className="container-x">
        <div className={cn('flex flex-wrap items-end justify-between gap-6', !hasLink(data.cta) && 'justify-center')}>
          <Head label={data.label} heading={data.heading} accent={data.accent} lead={data.lead} align={hasLink(data.cta) ? 'left' : 'center'} />
          {hasLink(data.cta) && <Btn link={data.cta} variant="outline" arrow className="reveal" />}
        </div>
        <div className={cn('mt-10 grid gap-5', roots.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3')}>
          {roots.map((c) => (
            <div key={c.id} className="card card-lift tilt reveal flex h-full flex-col overflow-hidden">
              <SmartLink href={`/category/${c.slug}`} className="group block">
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt={c.name} loading="lazy" className="aspect-[16/9] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                ) : (
                  <div className="grid aspect-[16/9] place-items-center bg-[linear-gradient(135deg,#f0faf2,#cdeed6)]">
                    <span className="grid h-16 w-16 place-items-center rounded-3xl bg-white text-gold-deep shadow-md transition-transform duration-500 group-hover:scale-110">
                      <Icon name={c.icon || 'leaf'} className="h-8 w-8" />
                    </span>
                  </div>
                )}
              </SmartLink>
              <div className="flex flex-1 flex-col p-5">
                <SmartLink href={`/category/${c.slug}`} className="font-display text-xl font-semibold text-ink hover:text-gold-deep">
                  {c.name}
                </SmartLink>
                <p className="mt-0.5 text-xs text-ink/50">{c.count} products</p>
                {showSub && c.children.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {c.children.slice(0, 6).map((s) => (
                      <li key={s.id}>
                        <SmartLink href={`/category/${s.slug}`} className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold text-ink/70 hover:bg-gold/15 hover:text-gold-deep">
                          {s.name}
                        </SmartLink>
                      </li>
                    ))}
                    {c.children.length > 6 && (
                      <li>
                        <SmartLink href={`/category/${c.slug}`} className="rounded-full px-2 py-1 text-xs font-bold text-gold-deep">+{c.children.length - 6}</SmartLink>
                      </li>
                    )}
                  </ul>
                )}
                <SmartLink href={`/category/${c.slug}`} className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-bold text-gold-deep">
                  {data.linkText || 'Explore'} <ArrowRight className="h-4 w-4" />
                </SmartLink>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ featured products */
export async function FeaturedProducts({ data }: P) {
  const take = Math.max(1, Number(data.limit) || 8);
  const { items } = await listProducts({ take, featured: data.onlyFeatured === true ? true : undefined, sort: data.sort || 'new' });
  if (!items.length) {
    if (!data.emptyText) return null;
    return (
      <Section data={data}>
        <div className="container-x text-center">
          <Head label={data.label} heading={data.heading} accent={data.accent} lead={data.lead} />
          <p className="reveal mt-6 text-ink/60">{data.emptyText}</p>
          <div className="reveal mt-6">
            <Btn link={data.cta} variant="gold" arrow />
          </div>
        </div>
      </Section>
    );
  }
  return (
    <Section data={data}>
      <div className="container-x">
        <div className={cn('flex flex-wrap items-end justify-between gap-6', !hasLink(data.cta) && 'justify-center')}>
          <Head label={data.label} heading={data.heading} accent={data.accent} lead={data.lead} align={hasLink(data.cta) ? 'left' : 'center'} />
          {hasLink(data.cta) && <Btn link={data.cta} variant="outline" arrow className="reveal" />}
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p, i) => (
            <div key={p.id} className="reveal">
              <ProductCard p={p} priority={i < 4} />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ featured sellers */
export async function FeaturedSellers({ data }: P) {
  const take = Math.max(1, Number(data.limit) || 6);
  const { items } = await listSellers({ take, featured: data.onlyFeatured === true ? true : undefined, verified: data.onlyVerified === true ? true : undefined });
  if (!items.length) return null;
  return (
    <Section data={data} fallback="sand">
      <div className="container-x">
        <div className={cn('flex flex-wrap items-end justify-between gap-6', !hasLink(data.cta) && 'justify-center')}>
          <Head label={data.label} heading={data.heading} accent={data.accent} lead={data.lead} align={hasLink(data.cta) ? 'left' : 'center'} />
          {hasLink(data.cta) && <Btn link={data.cta} variant="outline" arrow className="reveal" />}
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <div key={s.id} className="reveal">
              <SellerCard s={s} />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ buy leads */
export async function BuyLeads({ data }: P) {
  const take = Math.max(1, Number(data.limit) || 4);
  const { items } = await listRequirements({ take });
  if (!items.length) return null;
  return (
    <Section data={data}>
      <div className="container-x">
        <div className={cn('flex flex-wrap items-end justify-between gap-6', !hasLink(data.cta) && 'justify-center')}>
          <Head label={data.label} heading={data.heading} accent={data.accent} lead={data.lead} align={hasLink(data.cta) ? 'left' : 'center'} />
          {hasLink(data.cta) && <Btn link={data.cta} variant="outline" arrow className="reveal" />}
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {items.map((r) => (
            <div key={r.id} className="reveal">
              <RequirementCard r={r} />
            </div>
          ))}
        </div>
        {hasLink(data.cta2) && (
          <div className="reveal mt-8 text-center">
            <Btn link={data.cta2} variant="gold" arrow />
          </div>
        )}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ membership plans */
export async function Plans({ data }: P) {
  const [plans, mp] = await Promise.all([getPlans(data.audience || 'seller'), getMarketplace()]);
  if (!plans.length) return null;
  const period = (p: any) => (p.period === 'monthly' ? '/month' : p.period === 'quarterly' ? '/quarter' : p.period === 'yearly' ? '/year' : p.period === 'lifetime' ? ' once' : `/${p.periodDays || 30} days`);
  const lim = (n: number, what: string) => (n < 0 ? `Unlimited ${what}` : `${n} ${what}`);
  return (
    <Section data={data} fallback="sand">
      <div className="container-x">
        <Head label={data.label} heading={data.heading} accent={data.accent} lead={mp.paidPlans ? data.lead : data.freeLead || data.lead} />
        {!mp.paidPlans && data.freeBanner !== false && (
          <p className="reveal mx-auto mt-6 max-w-2xl rounded-2xl bg-emerald-50 px-5 py-3 text-center text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100">
            {data.freeText || '🎉 Launch offer: every seller gets all features free and unlimited right now.'}
          </p>
        )}
        <div className={cn('mt-10 grid gap-5', plans.length >= 4 ? 'md:grid-cols-2 xl:grid-cols-4' : plans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
          {plans.map((p) => {
            const feats: string[] = (() => {
              try {
                const f = JSON.parse(p.features || '[]');
                return Array.isArray(f) && f.length ? f : [];
              } catch {
                return [];
              }
            })();
            const auto = feats.length ? feats : [lim(p.maxProducts, 'products'), lim(p.maxInquiries, 'buyer contacts / month'), lim(p.maxQuotes, 'quotes / month'), p.verifiedBadge ? 'Verified badge' : '', p.featuredSlots ? `${p.featuredSlots} featured products` : '', p.analytics ? 'Analytics' : '', p.aiTools ? 'AI tools' : ''].filter(Boolean);
            return (
              <div key={p.id} className={cn('card card-lift reveal relative flex h-full flex-col p-6', p.highlight && 'ring-2 ring-gold')}>
                {p.highlight && <span className="absolute -top-3 left-6 rounded-full px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-wider text-white" style={{ background: 'var(--gold-grad)' }}>{data.popularText || 'Most popular'}</span>}
                <p className="font-display text-2xl font-semibold text-ink">{p.name}</p>
                {p.description && <p className="mt-1 text-sm text-ink/60">{p.description}</p>}
                <p className="mt-4 font-display text-4xl font-semibold text-ink">
                  {p.price ? inr(p.price) : 'Free'}
                  {p.price ? <span className="text-base font-normal text-ink/50">{period(p)}</span> : null}
                </p>
                {p.trialDays > 0 && <p className="mt-1 text-xs font-bold text-emerald-700">{p.trialDays}-day free trial</p>}
                <ul className="mt-5 space-y-2 text-sm text-ink/75">
                  {auto.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {f}
                    </li>
                  ))}
                </ul>
                <SmartLink href={mp.paidPlans ? `/seller/membership?plan=${p.slug}` : '/register?as=seller'} className={cn('btn mt-auto w-full !mt-6', p.highlight ? 'btn-gold' : 'btn-outline')}>
                  {mp.paidPlans ? (p.price ? data.buyText || 'Choose plan' : data.freeCta || 'Start free') : data.freeCta || 'Start selling free'}
                </SmartLink>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ how it works (buyer / seller tabs rendered as two columns) */
export function HowItWorks({ data }: P) {
  const cols = [
    { title: data.buyerTitle || 'For buyers', icon: ShoppingBag, steps: lines(data.buyerSteps), link: data.buyerLink },
    { title: data.sellerTitle || 'For sellers', icon: Store, steps: lines(data.sellerSteps), link: data.sellerLink },
  ].filter((c) => c.steps.length);
  if (!cols.length) return null;
  return (
    <Section data={data}>
      <div className="container-x">
        <Head label={data.label} heading={data.heading} accent={data.accent} lead={data.lead} />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {cols.map((c) => (
            <div key={c.title} className="card reveal p-6 md:p-8">
              <p className="inline-flex items-center gap-2 font-display text-2xl font-semibold text-ink">
                <span className="grid h-10 w-10 place-items-center rounded-2xl text-white" style={{ background: 'var(--gold-grad)' }}>
                  <c.icon className="h-5 w-5" />
                </span>
                {c.title}
              </p>
              <ol className="mt-6 space-y-4">
                {c.steps.map((s, i) => {
                  const [t, ...rest] = s.split(' — ');
                  return (
                    <li key={s} className="flex gap-4">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold/15 font-display text-sm font-bold text-gold-deep">{i + 1}</span>
                      <div>
                        <p className="font-semibold text-ink">{t}</p>
                        {rest.length > 0 && <p className="text-sm text-ink/60">{rest.join(' — ')}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
              {hasLink(c.link) && <Btn link={c.link} variant="gold" arrow className="mt-6" />}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ trust strip */
export function TrustStrip({ data }: P) {
  const items = lines(data.items);
  if (!items.length) return null;
  return (
    <section id={data.anchor || undefined} className="theme-light border-y border-ink/5 bg-white/70 py-4 backdrop-blur">
      <div className="container-x flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-semibold text-ink/70">
        {items.map((i) => (
          <span key={i} className="inline-flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-emerald-600" /> {i}
          </span>
        ))}
      </div>
    </section>
  );
}
