import { prisma } from '@/lib/db';
import { requireSeller } from '@/lib/auth';
import { entitlements } from '@/lib/marketplace/plans';
import { getMarketplace } from '@/lib/marketplace/settings';
import { getPlans } from '@/lib/marketplace/data';
import { PageTitle } from '@/components/admin/ui';
import Membership from '@/components/seller/Membership';
import { SELLER_VISIBLE } from '@/lib/marketplace/moderation';

export default async function SellerMembership({ searchParams }: { searchParams: Promise<{ plan?: string; reason?: string; paid?: string }> }) {
  const { seller } = (await requireSeller())!;
  const sp = await searchParams;
  const [e, mp, plans, subs, payments] = await Promise.all([
    entitlements(seller.id),
    getMarketplace(),
    getPlans('seller'),
    prisma.subscription.findMany({ where: { sellerId: seller.id }, orderBy: { createdAt: 'desc' }, include: { plan: { select: { name: true } } }, take: 10 }),
    prisma.payment.findMany({ where: { subscription: { sellerId: seller.id } }, orderBy: { createdAt: 'desc' }, take: 20, include: { subscription: { select: { plan: { select: { name: true } } } } } }),
  ]);
  const [products, inquiriesMonth, quotesMonth] = await Promise.all([
    prisma.product.count({ where: { sellerId: seller.id, status: { not: 'hidden' } } }),
    prisma.inquiry.count({ where: { sellerId: seller.id, ...SELLER_VISIBLE, contactUnlocked: true, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    prisma.quote.count({ where: { sellerId: seller.id, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
  ]);
  return (
    <>
      <PageTitle title="Membership" subtitle={mp.paidPlans ? 'Choose the plan that fits your business. Pay by UPI, card, net banking or wallet.' : 'All features are free and unlimited for every seller right now.'} />
      <Membership
        e={JSON.parse(JSON.stringify(e))}
        paidPlans={mp.paidPlans}
        gstPercent={mp.gstPercent}
        plans={JSON.parse(JSON.stringify(plans))}
        subs={JSON.parse(JSON.stringify(subs))}
        payments={JSON.parse(JSON.stringify(payments))}
        usage={{ products, inquiriesMonth, quotesMonth }}
        preselect={sp.plan}
        reason={sp.reason}
        justPaid={sp.paid === '1'}
      />
    </>
  );
}
