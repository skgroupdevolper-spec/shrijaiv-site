import { prisma } from '@/lib/db';
import { requireBuyer } from '@/lib/auth';
import { getMarketplace } from '@/lib/marketplace/settings';
import { PageTitle } from '@/components/admin/ui';
import BuyerProfileEditor from '@/components/buyer/BuyerProfileEditor';

export default async function BuyerProfile() {
  const { buyer } = (await requireBuyer())!;
  const [mp, cats] = await Promise.all([getMarketplace(), prisma.category.findMany({ where: { active: true, parentId: null }, orderBy: { order: 'asc' }, select: { id: true, name: true } })]);
  return (
    <>
      <PageTitle title="Buyer profile" subtitle="Sellers see your company, type and location when you send inquiries or post requirements." />
      <BuyerProfileEditor initial={JSON.parse(JSON.stringify(buyer))} types={mp.buyerTypes} categories={cats} />
    </>
  );
}
