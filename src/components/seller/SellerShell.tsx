'use client';
import DashboardShell, { type DashNavGroup } from '@/components/dashboard/DashboardShell';
import { LayoutDashboard, Package, Inbox, Megaphone, Star, Building2, Crown, BarChart3, Settings, Sparkles, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const NAV: DashNavGroup[] = [
  { group: '', items: [{ href: '/seller', label: 'Overview', icon: LayoutDashboard, exact: true }] },
  {
    group: 'Sell',
    items: [
      { href: '/seller/products', label: 'My products', icon: Package },
      { href: '/seller/inquiries', label: 'Inquiries', icon: Inbox, badge: 'inquiries' },
      { href: '/seller/leads', label: 'Buy leads (RFQ)', icon: Megaphone },
      { href: '/seller/reviews', label: 'Reviews', icon: Star, badge: 'reviews' },
    ],
  },
  {
    group: 'Company',
    items: [
      { href: '/seller/profile', label: 'Company profile', icon: Building2 },
      { href: '/seller/membership', label: 'Membership', icon: Crown },
      { href: '/seller/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/seller/ai', label: 'AI tools', icon: Sparkles },
      { href: '/seller/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function SellerShell({ user, siteName, badges, status, children }: { user: { name: string; email: string; role: string; subtitle?: string; avatar?: string | null }; siteName: string; badges?: Record<string, number>; status: string; children: React.ReactNode }) {
  const banner =
    status === 'pending' ? (
      <div className="mx-4 mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 md:mx-8">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Your seller account is <b>waiting for approval</b>. You can already complete your <Link href="/seller/profile" className="font-bold underline">company profile</Link> and add products — they go live as soon as our team approves your account.
        </p>
      </div>
    ) : status === 'suspended' || status === 'rejected' ? (
      <div className="mx-4 mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 md:mx-8">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Your seller account is <b>{status}</b>. Your products are hidden from the marketplace. Please <Link href="/contact" className="font-bold underline">contact support</Link>.</p>
      </div>
    ) : null;
  return (
    <DashboardShell user={user} siteName={siteName} area="Seller dashboard" home="/seller" nav={NAV} badges={badges} banner={banner}>
      {children}
    </DashboardShell>
  );
}
