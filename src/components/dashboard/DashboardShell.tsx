'use client';
// Shared shell for the Seller and Buyer dashboards (sidebar, top bar, bell, mobile drawer).
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, ExternalLink, LogOut, Menu, X, type LucideIcon } from 'lucide-react';
import { Coin } from '@/components/site/Logo';
import { Toaster } from '@/components/admin/ui';
import { cn, formatDateTime } from '@/lib/utils';

export type DashNavItem = { href: string; label: string; icon: LucideIcon; badge?: string; exact?: boolean };
export type DashNavGroup = { group: string; items: DashNavItem[] };
type Notice = { id: string; type: string; title: string; body?: string | null; href?: string | null; read: boolean; createdAt: string };

export default function DashboardShell({
  user,
  siteName,
  area,
  home,
  nav,
  badges = {},
  banner,
  children,
}: {
  user: { name: string; email: string; role: string; subtitle?: string; avatar?: string | null };
  siteName: string;
  area: string; // "Seller dashboard" | "Buyer dashboard"
  home: string; // "/seller" | "/buyer"
  nav: DashNavGroup[];
  badges?: Record<string, number>;
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false);
  const [bell, setBell] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const unread = notices.filter((n) => !n.read).length;

  useEffect(() => setMobile(false), [pathname]);

  useEffect(() => {
    let stop = false;
    async function poll() {
      try {
        const r = await fetch('/api/me/notifications', { cache: 'no-store' });
        if (!r.ok || stop) return;
        const d = await r.json();
        setNotices(d.items || []);
      } catch {}
    }
    poll();
    const t = setInterval(poll, 15000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    document.title = `${unread ? `(${unread}) ` : ''}${area} · ${siteName}`;
  }, [unread, area, siteName]);

  async function markRead() {
    if (!unread) return;
    await fetch('/api/me/notifications', { method: 'PUT' }).catch(() => null);
    setNotices((n) => n.map((x) => ({ ...x, read: true })));
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  const isActive = (i: DashNavItem) => (i.exact || i.href === home ? pathname === i.href : pathname.startsWith(i.href));

  const sidebar = (
    <div className="admin-side flex h-full flex-col text-gray-900">
      <div className="flex items-center gap-3 px-5 py-5">
        <Coin eager className="h-11 w-11 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold">{siteName}</p>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-gold-deep">{area}</p>
        </div>
      </div>
      <nav className="thin-scroll flex-1 overflow-y-auto px-3 pb-6">
        {nav.map((g) => (
          <div key={g.group || 'main'} className="mt-4">
            {g.group && <p className="mb-1.5 px-3 text-[0.62rem] font-extrabold uppercase tracking-[0.2em] text-gray-400">{g.group}</p>}
            {g.items.map((i) => {
              const n = i.badge ? badges[i.badge] || 0 : 0;
              return (
                <Link key={i.href} href={i.href} className={cn('group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.85rem] font-semibold transition', isActive(i) ? 'admin-nav-on' : 'admin-nav text-gray-600 hover:text-gray-900')}>
                  <i.icon className="h-[18px] w-[18px]" />
                  <span className="flex-1">{i.label}</span>
                  {n > 0 && <span className={cn('rounded-full px-2 py-0.5 text-[0.65rem] font-extrabold', isActive(i) ? 'bg-white text-gold-deep' : 'bg-red-500 text-white')}>{n}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-[#dcefe0] p-4">
        <div className="flex items-center gap-3">
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white" style={{ background: 'var(--gold-grad)' }}>{user.name.charAt(0)}</span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{user.name}</p>
            <p className="truncate text-[0.7rem] text-gray-500">{user.subtitle || user.email}</p>
          </div>
          <button onClick={logout} className="rounded-lg p-2 text-gray-400 hover:bg-[#eef8f0] hover:text-gray-900" title="Logout">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-bg min-h-screen text-gray-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>
      <AnimatePresence>
        {mobile && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobile(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="absolute inset-y-0 left-0 w-64">
              {sidebar}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <header className="admin-top backdrop-blur-xl sticky top-0 z-30 flex h-16 items-center gap-3 px-4 md:px-8">
          <button onClick={() => setMobile(true)} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <a href="/" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">
            <ExternalLink className="h-4 w-4" /> <span className="hidden sm:inline">Marketplace</span>
          </a>
          <div className="relative">
            <button
              onClick={() => {
                setBell(!bell);
                if (!bell) markRead();
              }}
              className="relative rounded-xl p-2.5 text-gray-600 hover:bg-gray-100"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[0.6rem] font-bold text-white">{unread}</span>}
            </button>
            <AnimatePresence>
              {bell && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute right-0 mt-2 w-[min(340px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <p className="text-sm font-bold">Notifications</p>
                    <button onClick={() => setBell(false)} className="text-gray-400 hover:text-gray-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="max-h-[420px] overflow-y-auto thin-scroll">
                    {!notices.length && <p className="px-4 py-10 text-center text-sm text-gray-400">You are all caught up ✨</p>}
                    {notices.map((n) => (
                      <Link key={n.id} href={n.href || home} onClick={() => setBell(false)} className={cn('block border-b border-gray-50 px-4 py-3 hover:bg-gray-50', !n.read && 'bg-emerald-50/60')}>
                        <p className="text-sm font-semibold">{n.title}</p>
                        {n.body && <p className="line-clamp-2 text-xs text-gray-500">{n.body}</p>}
                        <p className="mt-0.5 text-[0.65rem] text-gray-400">{formatDateTime(n.createdAt)}</p>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>
        {banner}
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
