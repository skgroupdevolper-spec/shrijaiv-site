import Link from 'next/link';
import { PlusCircle, Megaphone } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireBuyer } from '@/lib/auth';
import { PageTitle } from '@/components/admin/ui';
import { StatusPill } from '@/components/dashboard/fields';
import { formatDate } from '@/lib/utils';

export default async function BuyerRequirements() {
  const { buyer } = (await requireBuyer())!;
  const items = await prisma.requirement.findMany({ where: { buyerId: buyer.id }, orderBy: { createdAt: 'desc' }, include: { category: { select: { name: true } }, quotes: { select: { id: true, seenByBuyer: true } } } });
  return (
    <>
      <PageTitle title="My requirements" subtitle="Each requirement is a buy lead for sellers. Compare the quotes you receive and accept the best one." actions={<Link href="/buyer/requirements/new" className="btn btn-gold"><PlusCircle className="h-4 w-4" /> Post a requirement</Link>} />
      {items.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-gray-200/70"><Megaphone className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-3 font-bold text-gray-900">No requirements yet</p><p className="mt-1 text-sm text-gray-500">Describe what you need once — verified sellers will send quotes to this dashboard.</p><Link href="/buyer/requirements/new" className="btn btn-gold mt-5">Post your first requirement</Link></div>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-2xl bg-white ring-1 ring-gray-200/70">
          {items.map((r) => {
            const unseen = r.quotes.filter((q) => !q.seenByBuyer).length;
            return (
              <li key={r.id}>
                <Link href={`/buyer/requirements/${r.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">{r.title}</p>
                    <p className="truncate text-xs text-gray-500">{r.category?.name || 'No category'}{r.quantity ? ` · ${r.quantity} ${r.unit || ''}` : ''} · posted {formatDate(r.createdAt)}</p>
                  </div>
                  <span className="text-sm text-gray-600">{r.quotes.length} quotes {unseen > 0 && <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-[0.65rem] font-extrabold text-white">{unseen} new</span>}</span>
                  <StatusPill status={r.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
