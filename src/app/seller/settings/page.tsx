import { prisma } from '@/lib/db';
import { requireSeller } from '@/lib/auth';
import { PageTitle } from '@/components/admin/ui';
import AccountSettings from '@/components/dashboard/AccountSettings';

export default async function SellerSettings() {
  const { session } = (await requireSeller())!;
  const u = await prisma.user.findUnique({ where: { id: session.sub }, select: { name: true, email: true, phone: true } });
  return (
    <>
      <PageTitle title="Settings" subtitle="Login details and password. Company details are under Company profile." />
      <AccountSettings user={{ name: u!.name, email: u!.email, phone: u!.phone || '' }} />
    </>
  );
}
