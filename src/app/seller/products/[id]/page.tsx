import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireSeller } from '@/lib/auth';
import { entitlements } from '@/lib/marketplace/plans';
import { getMarketplace } from '@/lib/marketplace/settings';
import { PageTitle } from '@/components/admin/ui';
import ProductEditor from '@/components/seller/ProductEditor';

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { seller } = (await requireSeller())!;
  const p = await prisma.product.findFirst({ where: { id, sellerId: seller.id } });
  if (!p) notFound();
  const [cats, mp, e] = await Promise.all([prisma.category.findMany({ where: { active: true }, orderBy: [{ order: 'asc' }, { name: 'asc' }], select: { id: true, name: true, parentId: true } }), getMarketplace(), entitlements(seller.id)]);
  return (
    <>
      <PageTitle title={p.name} subtitle={`${p.views} views · ${p.inquiryCount} inquiries`} />
      <ProductEditor initial={JSON.parse(JSON.stringify(p))} categories={cats} units={mp.units} maxImages={e.maxImages} aiTools={e.aiTools} />
    </>
  );
}
