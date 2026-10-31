import Link from 'next/link';
import { Inbox, Lock } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireSeller } from '@/lib/auth';
import { PageTitle } from '@/components/admin/ui';
import { StatusPill } from '@/components/dashboard/fields';
import { formatDate } from '@/lib/utils';

const TABS = [['', 'All'], ['new', 'New'], ['replied', 'Replied'], ['quoted', 'Quoted'], ['closed', 'Closed']];

export default async function SellerInquiries({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { seller } = (await requireSeller())!;
  const { status } = await searchParams;
  const items = await prisma.inquiry.findMany({ where: { sellerId: seller.id, ...(status && !['review', 'rejected'].includes(status) ? { status } : { status: { notIn: ['spam', 'review', 'rejected'] } }) }, orderBy: { lastMessageAt: 'desc' }, include: { product: { select: { name: true } }, messages: { where: { senderRole: { in: ['buyer', 'admin'] }, read: false }, select: { id: true } } }, take: 300 });
  return (
    <>
      <PageTitle title="Inquiries" subtitle="Every inquiry also reaches your email and WhatsApp. Reply here to keep the conversation in one place." />
      <div className="rounded-2xl bg-white ring-1 ring-gray-200/70">
        <div className="flex gap-1 overflow-x-auto border-b border-gray-100 p-3">
          {TABS.map(([v, l]) => (
            <Link key={v} href={v ? `/seller/inquiries?status=${v}` : '/seller/inquiries'} className={`rounded-full px-3 py-1.5 text-xs font-bold ${(status || '') === v ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{l}</Link>
          ))}
        </div>
        {items.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No inquiries here yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((q) => (
              <li key={q.id}>
                <Link href={`/seller/inquiries/${q.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${!q.seenBySeller || q.messages.length ? 'bg-amber-500' : 'bg-transparent'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-semibold text-gray-900">
                      {q.name}
                      {q.company && <span className="text-xs font-normal text-gray-500">· {q.company}</span>}
                      {!q.contactUnlocked && <Lock className="h-3.5 w-3.5 text-amber-500" />}
                    </p>
                    <p className="truncate text-xs text-gray-500">{q.product?.name ? `${q.product.name} · ` : ''}{q.message}</p>
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
