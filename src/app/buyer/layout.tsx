import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireBuyer } from '@/lib/auth';
import { getSetting } from '@/lib/settings';
import BuyerShell from '@/components/buyer/BuyerShell';
import { BUYER_VISIBLE } from '@/lib/marketplace/moderation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Buyer dashboard', robots: { index: false, follow: false } };

export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireBuyer();
  if (!ctx) redirect('/login?next=/buyer');
  const { session, buyer } = ctx;
  const site = await getSetting('site');
  const [inquiries, quotes] = await Promise.all([
    prisma.inquiry.count({ where: { buyerId: buyer.id, seenByBuyer: false } }),
    prisma.quote.count({ where: { ...BUYER_VISIBLE, requirement: { buyerId: buyer.id }, seenByBuyer: false } }),
  ]);
  return (
    <div className="admin-root">
      <BuyerShell user={{ name: session.name, email: session.email, role: session.role, subtitle: buyer.companyName || 'Buyer' }} siteName={site.name} badges={{ inquiries, quotes }}>
        {children}
      </BuyerShell>
    </div>
  );
}
