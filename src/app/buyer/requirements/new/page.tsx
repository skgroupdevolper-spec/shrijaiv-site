import { prisma } from '@/lib/db';
import { requireBuyer } from '@/lib/auth';
import { getMarketplace } from '@/lib/marketplace/settings';
import { PageTitle } from '@/components/admin/ui';
import RequirementForm from '@/components/buyer/RequirementForm';

export default async function NewRequirement() {
  const { buyer } = (await requireBuyer())!;
  const [cats, mp] = await Promise.all([prisma.category.findMany({ where: { active: true }, orderBy: [{ order: 'asc' }, { name: 'asc' }], select: { id: true, name: true, parentId: true } }), getMarketplace()]);
  return (
    <>
      <PageTitle title="Post a requirement" subtitle="Be specific — quantity, quality, packaging and delivery location bring better quotes." />
      <RequirementForm initial={null} categories={cats} units={mp.units} defaultState={buyer.state} defaultCity={buyer.city} />
    </>
  );
}
