import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireSeller } from '@/lib/auth';
import { canAddProduct } from '@/lib/marketplace/plans';
import { getMarketplace } from '@/lib/marketplace/settings';
import { PageTitle } from '@/components/admin/ui';
import ProductEditor from '@/components/seller/ProductEditor';

export default async function NewProduct() {
  const { seller } = (await requireSeller())!;
  const gate = await canAddProduct(seller.id);
  if (!gate.ok) redirect('/seller/membership?reason=products');
  const [cats, mp] = await Promise.all([prisma.category.findMany({ where: { active: true }, orderBy: [{ order: 'asc' }, { name: 'asc' }], select: { id: true, name: true, parentId: true } }), getMarketplace()]);
  return (
    <>
      <PageTitle title="Add product" subtitle="Photos, price range and MOQ matter most. You can save a draft and finish later." />
      <ProductEditor initial={null} categories={cats} units={mp.units} maxImages={gate.e.maxImages} aiTools={gate.e.aiTools} />
    </>
  );
}
