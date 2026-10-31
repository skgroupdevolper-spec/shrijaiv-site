import Link from 'next/link';
import { FileText } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireBuyer } from '@/lib/auth';
import { inr } from '@/lib/marketplace/data';
import { PageTitle } from '@/components/admin/ui';
import { StatusPill } from '@/components/dashboard/fields';
import { formatDate } from '@/lib/utils';
import { BUYER_VISIBLE } from '@/lib/marketplace/moderation';

export default async function BuyerQuotes() {
  const { buyer } = (await requireBuyer())!;
  const items = await prisma.quote.findMany({ where: { ...BUYER_VISIBLE, requirement: { buyerId: buyer.id } }, orderBy: { createdAt: 'desc' }, include: { seller: { select: { companyName: true, verified: true } }, requirement: { select: { id: true, title: true } } }, take: 300 });
  return (
    <>
      <PageTitle title="Quotes received" subtitle="All quotes across your requirements. Open a requirement to compare and accept." />
      <div className="rounded-2xl bg-white ring-1 ring-gray-200/70">
        {items.length === 0 ? <div className="p-12 text-center"><FileText className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-3 text-sm text-gray-500">No quotes yet. <Link href="/buyer/requirements/new" className="font-bold text-gold-deep">Post a requirement</Link> to receive some.</p></div> : (
          <ul className="divide-y divide-gray-100">
            {items.map((q) => (
              <li key={q.id}>
                <Link href={`/buyer/requirements/${q.requirement.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${q.seenByBuyer ? 'bg-transparent' : 'bg-amber-500'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">{q.seller.companyName}{q.seller.verified ? ' ✓' : ''} · {q.requirement.title}</p>
                    <p className="truncate text-xs text-gray-500">{q.price != null ? `${inr(q.price)} ${q.priceUnit || ''}` : 'Price on request'}{q.deliveryTime ? ` · ${q.deliveryTime}` : ''}{q.quantity ? ` · ${q.quantity}` : ''}</p>
                  </div>
                  <StatusPill status={q.status} />
                  <span className="hidden text-xs text-gray-400 sm:block">{formatDate(q.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
