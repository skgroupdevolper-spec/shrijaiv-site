'use client';
import DashboardShell, { type DashNavGroup } from '@/components/dashboard/DashboardShell';
import { LayoutDashboard, Megaphone, Inbox, FileText, Heart, Star, CircleUser, Settings, Store, FileBarChart } from 'lucide-react';

const NAV: DashNavGroup[] = [
  { group: '', items: [{ href: '/buyer', label: 'Overview', icon: LayoutDashboard, exact: true }] },
  {
    group: 'Buy',
    items: [
      { href: '/buyer/requirements', label: 'My requirements', icon: Megaphone, badge: 'quotes' },
      { href: '/buyer/inquiries', label: 'My inquiries', icon: Inbox, badge: 'inquiries' },
      { href: '/buyer/quotes', label: 'Quotes received', icon: FileText },
      { href: '/buyer/favourites', label: 'Favourites', icon: Heart },
      { href: '/buyer/reviews', label: 'My reviews', icon: Star },
      { href: '/buyer/report', label: 'Reports (PDF / Excel)', icon: FileBarChart },
    ],
  },
  {
    group: 'Account',
    items: [
      { href: '/buyer/profile', label: 'Profile', icon: CircleUser },
      { href: '/buyer/settings', label: 'Settings', icon: Settings },
      { href: '/buyer/become-seller', label: 'Become a seller', icon: Store },
    ],
  },
];

export default function BuyerShell({ user, siteName, badges, children }: { user: { name: string; email: string; role: string; subtitle?: string; avatar?: string | null }; siteName: string; badges?: Record<string, number>; children: React.ReactNode }) {
  return (
    <DashboardShell user={user} siteName={siteName} area="Buyer dashboard" home="/buyer" nav={NAV} badges={badges}>
      {children}
    </DashboardShell>
  );
}
