import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/db';
import Thread from '@/components/dashboard/Thread';
import { formatDateTime } from '@/lib/utils';

export default async function AdminInquiry({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = await prisma.inquiry.findUnique({ where: { id }, include: { seller: { select: { id: true, companyName: true, slug: true } }, product: { select: { name: true, slug: true } }, messages: { orderBy: { createdAt: 'asc' } } } });
  if (!q) notFound();
  await prisma.inquiry.update({ where: { id }, data: { seenByAdmin: true } });
  return (
    <div className="max-w-6xl">
      <Link href="/admin/inquiries" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> Inquiries</Link>
      {q.status === 'review' && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <span><b>Waiting for your review.</b> The seller cannot see this inquiry until you forward it.</span>
          <Link href="/admin/review" className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-white">Open review queue</Link>
        </div>
      )}
      <div className="mb-4 rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
        <p className="text-xs text-gray-400">{q.refNo} · {formatDateTime(q.createdAt)} · status {q.status}{q.contactUnlocked ? '' : ' · contact locked for the seller'}</p>
        <p className="mt-1 font-bold text-gray-900">{q.name}{q.company ? ` (${q.company})` : ''} → <Link href={`/admin/sellers/${q.seller.id}`} className="text-gold-deep">{q.seller.companyName}</Link>{q.product ? ` · ${q.product.name}` : ''}</p>
        <p className="text-sm text-gray-600">{q.email} · {q.phone}{q.city ? ` · ${q.city}` : ''}{q.quantity ? ` · ${q.quantity}` : ''}</p>
      </div>
      <div className="flex h-[65vh] flex-col overflow-hidden rounded-2xl bg-[#f7fbf8] ring-1 ring-gray-200/70">
        <Thread messages={JSON.parse(JSON.stringify(q.messages))} me="admin" postUrl={`/api/admin/inquiries/${q.id}/messages`} placeholder="Write as the SHRIJAIV team (both sides see this)…" />
      </div>
    </div>
  );
}
