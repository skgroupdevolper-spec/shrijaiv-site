import { prisma } from '@/lib/db';
import { requireBuyer } from '@/lib/auth';
import { PageTitle } from '@/components/admin/ui';
import AccountSettings from '@/components/dashboard/AccountSettings';

export default async function BuyerSettings() {
  const { session } = (await requireBuyer())!;
  const u = await prisma.user.findUnique({ where: { id: session.sub }, select: { name: true, email: true, phone: true } });
  return (
    <>
      <PageTitle title="Settings" subtitle="Login details and password." />
      <AccountSettings user={{ name: u!.name, email: u!.email, phone: u!.phone || '' }} />
    </>
  );
}
