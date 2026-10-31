import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireSeller } from '@/lib/auth';
import { getSetting } from '@/lib/settings';
import SellerShell from '@/components/seller/SellerShell';
import { SELLER_VISIBLE } from '@/lib/marketplace/moderation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Seller dashboard', robots: { index: false, follow: false } };

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireSeller();
  if (!ctx) redirect('/login?next=/seller');
  const { session, seller } = ctx;
  const site = await getSetting('site');
  const [inquiries, reviews] = await Promise.all([
    prisma.inquiry.count({ where: { sellerId: seller.id, ...SELLER_VISIBLE, seenBySeller: false } }),
    prisma.review.count({ where: { sellerId: seller.id, seen: false, status: 'approved' } }),
  ]);
  return (
    <div className="admin-root">
      <SellerShell user={{ name: session.name, email: session.email, role: session.role, subtitle: seller.companyName, avatar: seller.logo }} siteName={site.name} badges={{ inquiries, reviews }} status={seller.status}>
        {children}
      </SellerShell>
    </div>
  );
}
