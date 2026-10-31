import { requireBuyer } from '@/lib/auth';
import { prisma } from '@/lib/db';
import BecomeSellerForm from './BecomeSellerForm';

export default async function BecomeSeller() {
  const ctx = await requireBuyer();
  const user = ctx ? await prisma.user.findUnique({ where: { id: ctx.session.sub }, select: { name: true, phone: true, email: true } }) : null;
  const [first, ...rest] = (user?.name || '').split(' ');
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Update account to Vendor</h1>
      <p className="mt-1 text-sm text-gray-500">Start selling on SHRIJAIV with the same login. Your requirements, inquiries and favourites stay as they are.</p>
      <BecomeSellerForm first={first || ''} last={rest.join(' ')} phone={user?.phone || ''} company={ctx?.buyer.companyName || ''} />
    </div>
  );
}
