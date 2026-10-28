import Link from 'next/link';
import { Inbox } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireBuyer } from '@/lib/auth';
import { PageTitle } from '@/components/admin/ui';
import { StatusPill } from '@/components/dashboard/fields';
import { formatDate } from '@/lib/utils';

export default async function BuyerInquiries() {
  const { buyer } = (await requireBuyer())!;
  const items = await prisma.inquiry.findMany({ where: { buyerId: buyer.id }, orderBy: { lastMessageAt: 'desc' }, include: { seller: { select: { companyName: true, verified: true } }, product: { select: { name: true } }, messages: { where: { senderRole: { in: ['seller', 'admin'] }, read: false }, select: { id: true } } } });
  return (
    <>
      <PageTitle title="My inquiries" subtitle="Conversations with sellers. Replies also arrive by email." actions={<Link href="/products" className="btn btn-outline btn-sm">Browse products</Link>} />
      <div className="rounded-2xl bg-white ring-1 ring-gray-200/70">
        {items.length === 0 ? (
          <div className="p-12 text-center"><Inbox className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-3 text-sm text-gray-500">You have not contacted any seller yet.</p></div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((q) => (
              <li key={q.id}>
                <Link href={`/buyer/inquiries/${q.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${!q.seenByBuyer || q.messages.length ? 'bg-amber-500' : 'bg-transparent'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">{q.seller.companyName}{q.seller.verified ? ' ✓' : ''}{q.product ? ` · ${q.product.name}` : ''}</p>
                    <p className="truncate text-xs text-gray-500">{q.refNo} · {q.message}</p>
                  </div>
                  {q.messages.length > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[0.65rem] font-extrabold text-white">{q.messages.length}</span>}
                  <StatusPill status={q.status} />
                  <span className="hidden text-xs text-gray-400 sm:block">{formatDate(q.lastMessageAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
