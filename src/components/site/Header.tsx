'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, X, Phone, User, ArrowRight, Megaphone, Check, LayoutGrid, LogIn, UserPlus, Store, ShoppingBag, LifeBuoy, ChevronRight, Search } from 'lucide-react';
import type { HeaderSettings, SiteSettings } from '@/lib/defaults';
import { cn } from '@/lib/utils';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';
import { useT, useLocalize } from './SiteProvider';
import { splitLocale } from '@/lib/i18n/config';
import SmartLink from '@/components/ui/SmartLink';
import { Icon } from '@/components/ui/Icon';

type Me = { name: string; role: string } | null;
export const MENU_EVENT = 'open-site-menu';
export const CATS_EVENT = 'open-site-categories';
/** Category tree for the Shop menu and the mobile Categories sheet (from Admin → Categories) */
export type NavCategory = { slug: string; name: string; icon: string | null; image: string | null; count?: number; children: NavCategory[] };

function CatVisual({ c, className }: { c: NavCategory; className?: string }) {
  return c.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={c.image} alt="" className={cn('object-contain', className)} />
  ) : (
    <Icon name={c.icon || 'leaf'} className={className} />
  );
}

export default function Header({ site, header, categories = [] }: { site: SiteSettings; header: HeaderSettings; categories?: NavCategory[] }) {
  const fullPath = usePathname() || '/';
  const pathname = splitLocale(fullPath).path;
  const t = useT();
  const L = useLocalize();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [cats, setCats] = useState(false);
  const [catOpen, setCatOpen] = useState<string | null>(null);
  const [drop, setDrop] = useState<number | null>(null);
  const [me, setMe] = useState<Me>(null);
  const closeTimer = useRef<number | null>(null);

  const [hidden, setHidden] = useState(false);
  // 0 = everything fits, 1 = compact (coin logo, tighter menu), 2 = menu moves into the ☰ button
  const [fit, setFit] = useState(0);
  const islandRef = useRef<HTMLDivElement>(null);
  const labels = header.menu.map((m) => m.label).join('|');
  useEffect(() => {
    const isl = islandRef.current;
    if (!isl) return;
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (window.innerWidth < 1024) return setFit(0);
        const tight = () => {
          const nav = isl.querySelector<HTMLElement>('.site-nav');
          const logo = isl.querySelector<HTMLElement>('.site-logo');
          const acts = isl.querySelector<HTMLElement>('.hdr-actions');
          if (!nav || !logo || !acts) return false;
          const rtl = document.documentElement.dir === 'rtl';
          const n = nav.getBoundingClientRect(), l = logo.getBoundingClientRect(), a = acts.getBoundingClientRect();
          const navW = Array.from(nav.children).reduce((w, c) => w + (c as HTMLElement).getBoundingClientRect().width, 0);
          const avail = isl.clientWidth - l.width - a.width - 56;
          const out = isl.scrollWidth > isl.clientWidth + 1;
          return out || navW > avail || (rtl ? n.right > l.left - 6 : n.left < l.right + 6);
        };
        for (const f of [0, 1, 2]) {
          isl.parentElement?.setAttribute('data-fit', String(f));
          if (f === 2 || !tight()) return setFit(f);
        }
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(isl);
    // the menu words themselves (a language switch changes their length without resizing the window)
    const nav = isl.querySelector('.site-nav');
    if (nav) for (const c of Array.from(nav.children)) ro.observe(c);
    const acts = isl.querySelector('.hdr-actions');
    if (acts) ro.observe(acts);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [labels]);
  useEffect(() => {
    let raf = 0;
    let last = window.scrollY;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 16);
        // hide while scrolling down a page, show again as soon as the visitor scrolls up
        if (Math.abs(y - last) > 6) {
          setHidden(y > 220 && y > last);
          last = y;
        }
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const openMenu = () => { setCats(false); setOpen(true); };
    const openCats = () => { setOpen(false); setCats(true); };
    window.addEventListener(MENU_EVENT, openMenu);
    window.addEventListener(CATS_EVENT, openCats);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener(MENU_EVENT, openMenu);
      window.removeEventListener(CATS_EVENT, openCats);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
    setCats(false);
    setDrop(null);
  }, [pathname]);

  useEffect(() => {
    if (!header.showLogin) return;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMe(d?.user || null))
      .catch(() => {});
  }, [header.showLogin, pathname]);

  useEffect(() => {
    const any = open || cats;
    document.documentElement.style.overflow = any ? 'hidden' : '';
    if (!any) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (setOpen(false), setCats(false));
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [open, cats]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrop(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const mega = header.mega?.enabled && header.mega.groups?.length ? header.mega : null;
  const shopHref = mega?.attachTo || '/products';
  const hasCats = categories.length > 0;
  const isMega = (href: string) => (hasCats ? href === shopHref : !!mega && href === mega.attachTo);
  const isActive = (href: string) => (href === '/' ? pathname === '/' : !!pathname?.startsWith(href));
  const accountHref = me ? (me.role === 'SELLER' ? '/seller' : me.role === 'BUYER' ? '/buyer' : me.role === 'CUSTOMER' ? '/account' : '/admin') : L('/login');
  const accountLabel = me ? (me.role === 'SELLER' ? t('Seller dashboard') : me.role === 'BUYER' ? t('Buyer dashboard') : me.role === 'CUSTOMER' ? t('My account') : t('Admin')) : t('Login');
  const enter = (i: number | null) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setDrop(i);
  };
  const leave = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setDrop(null), 220);
  };

  return (
    <>
      <header className="site-header" data-fit={fit} data-scrolled={scrolled ? '' : undefined} data-hidden={hidden && !open && drop === null ? '' : undefined}>
        {header.topbar.enabled && header.topbar.text && (
          <div className={cn('topbar transition-all duration-500', scrolled && 'pointer-events-none !my-0 !min-h-0 !py-0 h-0 opacity-0')}>
            <span className="dot-gold" />
            <span className="truncate">{header.topbar.text}</span>
            {header.topbar.linkLabel && (
              <SmartLink href={header.topbar.linkHref} className="inline-flex items-center gap-1 hover:underline">
                {header.topbar.linkLabel} <ArrowRight className="h-3.5 w-3.5" />
              </SmartLink>
            )}
          </div>
        )}
        <div ref={islandRef} className="hdr-island" onMouseLeave={leave}>
          <span aria-hidden className="hdr-progress" />
          <span aria-hidden className="hdr-sheen" />
          <Logo src={site.logo} name={site.name} tagline={site.tagline} />

          <nav className="site-nav ms-auto hidden items-center gap-0.5 lg:flex" aria-label="Main">
            {header.menu.map((item, i) => {
              const hasDrop = !!item.children?.length || isMega(item.href);
              return (
                <div key={i} className={isMega(item.href) ? '' : 'relative'} onMouseEnter={() => enter(hasDrop ? i : null)}>
                  <SmartLink href={item.href} className="nav-link flex items-center gap-1 whitespace-nowrap" data-active={isActive(item.href) ? '' : undefined}>
                    {item.label}
                    {hasDrop && <ChevronDown className={cn('h-3.5 w-3.5 opacity-50 transition-transform', drop === i && 'rotate-180')} />}
                  </SmartLink>
                  {drop === i && !isMega(item.href) && item.children?.length ? (
                    <div className="absolute start-1/2 top-full w-[340px] -translate-x-1/2 pt-3 rtl:translate-x-1/2" onMouseEnter={() => enter(i)}>
                      <div className="glass-menu mega-panel rounded-2xl p-2">
                        {item.children.map((c, j) => (
                          <SmartLink key={j} href={c.href} className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-black/[0.04]">
                            <span className="icon-chip !h-9 !w-9 !rounded-xl">
                              <Icon name={c.icon || 'badge'} className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[0.9rem] font-medium">{c.label}</span>
                              {c.description && <span className="muted mt-0.5 block text-xs">{c.description}</span>}
                            </span>
                          </SmartLink>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="hdr-actions ms-auto flex shrink-0 items-center gap-1 lg:ms-3">
            <LanguageSwitcher />
            {header.showLogin && (
              <Link href={accountHref} className="hidden h-10 w-10 place-items-center rounded-xl text-[#1d1d1f] transition hover:bg-black/[0.045] md:grid" aria-label={me ? t('My account') : t('Client login')} title={me ? me.name : t('Client login')}>
                <User className="h-[18px] w-[18px]" />
              </Link>
            )}
            {header.cta.label && (
              <SmartLink href={header.cta.href} className="btn btn-dark btn-sm ms-1 hidden sm:inline-flex">
                {header.cta.label}
              </SmartLink>
            )}
            <button onClick={() => setOpen(true)} className="hdr-burger grid h-10 w-10 place-items-center rounded-xl text-[#1d1d1f] transition hover:bg-black/[0.045] lg:hidden" aria-label={t('Menu')} aria-expanded={open}>
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* categories mega menu (from Admin → Categories) */}
          {hasCats && drop !== null && isMega(header.menu[drop]?.href) && (
            <div className="absolute inset-x-0 top-full hidden pt-3 lg:block" onMouseEnter={() => enter(drop)}>
              <div className="glass-menu mega-panel rounded-[24px] p-5">
                <div className={cn('grid gap-4', categories.length >= 3 ? 'grid-cols-3' : 'grid-cols-2')}>
                  {categories.map((g) => (
                    <div key={g.slug} className="min-w-0 rounded-2xl bg-[linear-gradient(160deg,#f6fbf7,#eef6f0)] p-4 ring-1 ring-black/[0.04]">
                      <SmartLink href={`/category/${g.slug}`} onClick={() => setDrop(null)} className="group flex items-center gap-3">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition group-hover:scale-105">
                          <CatVisual c={g} className="h-7 w-7 text-gold-deep" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-display text-[1.02rem] font-semibold text-ink">{g.name}</span>
                          <span className="block text-xs text-ink/50">{g.count ? `${g.count} ${t('products')}` : t('View category')}</span>
                        </span>
                      </SmartLink>
                      <ul className="mt-3 grid grid-cols-2 gap-x-2 gap-y-0.5">
                        {g.children.slice(0, 10).map((c) => (
                          <li key={c.slug}>
                            <SmartLink href={`/category/${c.slug}`} onClick={() => setDrop(null)} className="group flex items-center gap-2 rounded-xl px-2 py-1.5 text-[0.84rem] text-ink/80 transition-colors hover:bg-white hover:text-gold-deep">
                              <CatVisual c={c} className="h-4 w-4 shrink-0 text-gold-deep transition-transform group-hover:scale-110" />
                              <span className="truncate">{c.name}</span>
                            </SmartLink>
                          </li>
                        ))}
                      </ul>
                      {g.children.length > 10 && (
                        <SmartLink href={`/category/${g.slug}`} onClick={() => setDrop(null)} className="mt-2 inline-flex items-center gap-1 px-2 text-xs font-bold text-gold-deep">
                          {t('All')} {g.name} <ChevronRight className="h-3.5 w-3.5" />
                        </SmartLink>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
                  <p className="text-sm text-ink/60">{t('Verified GST, FSSAI & organic certificates · Direct contact, no commission')}</p>
                  <div className="flex gap-2">
                    <SmartLink href="/products" onClick={() => setDrop(null)} className="btn btn-dark btn-sm">{t('All products')} <ArrowRight className="h-4 w-4" /></SmartLink>
                    <SmartLink href="/sellers" onClick={() => setDrop(null)} className="btn btn-outline btn-sm"><Store className="h-4 w-4" /> {t('All sellers')}</SmartLink>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* services mega menu (settings) */}
          {!hasCats && mega && drop !== null && isMega(header.menu[drop]?.href) && (
            <div className="absolute inset-x-0 top-full hidden pt-3 lg:block" onMouseEnter={() => enter(drop)}>
              <div className="glass-menu mega-panel grid grid-cols-[0.8fr_2.2fr] gap-6 rounded-[24px] p-6">
                <div className="flex flex-col rounded-2xl bg-[linear-gradient(145deg,#fffaf0,#f7ecd0)] p-6">
                  {mega.eyebrow && <p className="eyebrow">{mega.eyebrow}</p>}
                  <p className="mt-3 font-display text-xl font-semibold leading-snug">{mega.title}</p>
                  {mega.text && <p className="muted mt-2 text-sm leading-relaxed">{mega.text}</p>}
                  {mega.bullets && (
                    <ul className="mt-4 space-y-1.5">
                      {mega.bullets
                        .split('\n')
                        .filter(Boolean)
                        .map((b, k) => (
                          <li key={k} className="flex items-center gap-2 text-[0.82rem]">
                            <Check className="h-3.5 w-3.5 text-gold-deep" /> {b}
                          </li>
                        ))}
                    </ul>
                  )}
                  <div className="mt-auto flex flex-col gap-2 pt-6">
                    {mega.allLabel && (
                      <SmartLink href={mega.allHref} className="btn btn-dark btn-sm">
                        {mega.allLabel} <ArrowRight className="h-4 w-4" />
                      </SmartLink>
                    )}
                    {mega.calculatorLabel && (
                      <SmartLink href={mega.calculatorHref || '/post-requirement'} className="btn btn-outline btn-sm">
                        <Megaphone className="h-4 w-4" /> {mega.calculatorLabel}
                      </SmartLink>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-x-4 gap-y-6">
                  {mega.groups.map((g, gi) => (
                    <div key={gi} className="min-w-0">
                      <p className="px-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[#8a6d2c]">{g.title}</p>
                      <ul className="mt-2 space-y-0.5">
                        {g.links.map((c, j) => (
                          <li key={j}>
                            <SmartLink href={c.href} onClick={() => setDrop(null)} className="group flex items-center gap-2.5 rounded-xl px-2 py-2 text-[0.88rem] transition-colors hover:bg-black/[0.04]">
                              <Icon name={c.icon || 'check'} className="h-4 w-4 shrink-0 text-gold-deep transition-transform group-hover:scale-110" />
                              <span className="min-w-0">{c.label}</span>
                            </SmartLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* mobile & tablet menu — pages, account and language (bottom sheet, thumb friendly) */}
      {open && (
        <div className={cn(fit < 2 && 'lg:hidden')}>
          <div className="sheet-backdrop" onClick={() => setOpen(false)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-label={t('Menu')}>
            <div className="sheet-grip" />
            <div className="flex items-center justify-between px-5 pb-3 pt-1">
              <Logo src={site.logo} name={site.name} tagline={site.tagline} />
              <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-[#f5f5f7]" aria-label={t('Close')}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="px-5" aria-label="Mobile">
              {/* account strip */}
              <div className="sheet-account">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-gold-deep shadow-sm"><User className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.98rem] font-bold text-ink">{me ? me.name : t('Welcome to') + ' ' + site.name}</span>
                    <span className="block truncate text-xs text-ink/55">{me ? accountLabel : t('Login or create a free account')}</span>
                  </span>
                </div>
                {me ? (
                  <Link href={accountHref} className="btn btn-gold btn-sm mt-3 w-full">{t('Open')} {accountLabel}</Link>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link href={L('/login')} className="btn btn-outline btn-sm w-full bg-white"><LogIn className="h-4 w-4" /> {t('Login')}</Link>
                    <Link href={L('/register')} className="btn btn-gold btn-sm w-full"><UserPlus className="h-4 w-4" /> {t('Sign up')}</Link>
                  </div>
                )}
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-2">
                {header.menu.map((item, i) => (
                  <li key={i} style={{ animation: `pop .35s cubic-bezier(.2,.8,.2,1) ${i * 0.03}s both` }}>
                    <SmartLink href={item.href} className={cn('flex min-h-[50px] items-center rounded-2xl px-4 text-[0.93rem] font-medium', isActive(item.href) ? 'chip-active' : 'bg-[#f5f5f7] text-[#1d1d1f]')}>
                      {item.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button type="button" onClick={() => { setOpen(false); setCats(true); }} className="sheet-tile"><LayoutGrid className="h-5 w-5" /> {t('Categories')}</button>
                <SmartLink href="/register?as=seller" className="sheet-tile"><Store className="h-5 w-5" /> {t('Sell')}</SmartLink>
                <SmartLink href="/inquire" className="sheet-tile"><LifeBuoy className="h-5 w-5" /> {t('Inquire')}</SmartLink>
              </div>
              {me && (
                <ul className="mt-4 divide-y divide-black/5 rounded-2xl bg-[#f5f5f7]">
                  {(me.role === 'SELLER'
                    ? [['/seller', t('Dashboard')], ['/seller/products', t('My products')], ['/seller/inquiries', t('Inquiries')], ['/seller/requirements', t('Buy leads')], ['/seller/membership', t('Membership')], ['/seller/profile', t('Company profile')]]
                    : me.role === 'BUYER'
                      ? [['/buyer', t('Dashboard')], ['/buyer/requirements', t('My requirements')], ['/buyer/inquiries', t('Inquiries')], ['/buyer/favourites', t('Favourites')], ['/buyer/profile', t('Profile')]]
                      : [[accountHref, accountLabel]]
                  ).map(([href, label]) => (
                    <li key={href}>
                      <Link href={href} className="flex items-center justify-between px-4 py-3 text-[0.92rem] text-ink">
                        {label} <ChevronRight className="h-4 w-4 text-ink/30" />
                      </Link>
                    </li>
                  ))}
                  <li>
                    <a href="/api/auth/logout" className="flex items-center justify-between px-4 py-3 text-[0.92rem] text-rose-600">{t('Log out')}</a>
                  </li>
                </ul>
              )}
              <div className="mt-5">
                <LanguageSwitcher variant="sheet" />
              </div>
              <div className="mt-5 grid gap-2.5 pb-2">
                <SmartLink href={header.cta.href} className="btn btn-dark w-full">
                  {header.cta.label}
                </SmartLink>
                <a href={`tel:${site.phone}`} className="btn btn-outline w-full">
                  <Phone className="h-4 w-4" /> <span className="ltr">{site.phoneDisplay}</span>
                </a>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* mobile categories sheet — every category with its icon / image, sub-categories fold out */}
      {cats && (
        <div className="lg:hidden">
          <div className="sheet-backdrop" onClick={() => setCats(false)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-label={t('Categories')}>
            <div className="sheet-grip" />
            <div className="flex items-center justify-between px-5 pb-3 pt-1">
              <p className="font-display text-[1.15rem] font-semibold text-ink">{t('All categories')}</p>
              <button onClick={() => setCats(false)} className="grid h-10 w-10 place-items-center rounded-full bg-[#f5f5f7]" aria-label={t('Close')}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5">
              <form action="/products" className="relative mb-4">
                <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                <input name="q" placeholder={t('Search products or sellers')} className="field !rounded-full !ps-11" />
              </form>
              <ul className="space-y-2 pb-2">
                {categories.map((g, i) => {
                  const openIt = catOpen === g.slug;
                  return (
                    <li key={g.slug} className="overflow-hidden rounded-2xl bg-[#f5f5f7]" style={{ animation: `pop .35s cubic-bezier(.2,.8,.2,1) ${i * 0.04}s both` }}>
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <SmartLink href={`/category/${g.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white shadow-sm"><CatVisual c={g} className="h-6 w-6 text-gold-deep" /></span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-ink">{g.name}</span>
                            <span className="block text-xs text-ink/50">{g.children.length} {t('sub-categories')}{g.count ? ` · ${g.count} ${t('products')}` : ''}</span>
                          </span>
                        </SmartLink>
                        {g.children.length > 0 && (
                          <button type="button" onClick={() => setCatOpen(openIt ? null : g.slug)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink/60" aria-expanded={openIt} aria-label={g.name}>
                            <ChevronDown className={cn('h-4 w-4 transition-transform', openIt && 'rotate-180')} />
                          </button>
                        )}
                      </div>
                      {openIt && (
                        <ul className="grid grid-cols-2 gap-1.5 px-3 pb-3">
                          {g.children.map((c) => (
                            <li key={c.slug}>
                              <SmartLink href={`/category/${c.slug}`} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[0.86rem] text-ink/85">
                                <CatVisual c={c} className="h-4 w-4 shrink-0 text-gold-deep" /> <span className="truncate">{c.name}</span>
                              </SmartLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="grid grid-cols-2 gap-2 pb-2">
                <SmartLink href="/products" className="btn btn-dark w-full">{t('All products')}</SmartLink>
                <SmartLink href="/sellers" className="btn btn-outline w-full">{t('All sellers')}</SmartLink>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
