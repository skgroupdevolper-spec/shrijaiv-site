import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/db';
import Thread from '@/components/dashboard/Thread';
import { formatDateTime } from '@/lib/utils';

export default async function AdminInquiry({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = await prisma.inquiry.findUnique({ where: { id }, include: { seller: { select: { id: true, companyName: true, slug: true } }, product: { select: { id: true, name: true, slug: true, images: true, priceMin: true, priceMax: true, priceUnit: true, moq: true, inquiryCount: true } }, messages: { orderBy: { createdAt: 'asc' } } } });
  if (!q) notFound();
  await prisma.inquiry.update({ where: { id }, data: { seenByAdmin: true } });
  let img = '';
  try {
    img = (JSON.parse(q.product?.images || '[]') as string[])[0] || '';
  } catch {}
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
        {q.product ? (
          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-emerald-50/70 p-3 ring-1 ring-emerald-100">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt="" className="h-16 w-16 rounded-lg object-cover" />
            ) : (
              <span className="h-16 w-16 rounded-lg bg-emerald-100" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[0.65rem] font-extrabold uppercase tracking-widest text-emerald-700">Inquiry sent from this product</p>
              <p className="font-bold text-gray-900">{q.product.name}</p>
              <p className="text-xs text-gray-500">
                {q.product.priceMin != null ? `₹${q.product.priceMin}${q.product.priceMax != null && q.product.priceMax !== q.product.priceMin ? ` – ₹${q.product.priceMax}` : ''} ${q.product.priceUnit || ''} · ` : ''}
                {q.product.moq ? `MOQ ${q.product.moq} · ` : ''}
                {q.quantity ? `Buyer needs: ${q.quantity} · ` : ''}
                {q.product.inquiryCount} inquiries in total
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`/products/${q.product.slug}`} target="_blank" rel="noopener" className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50">View product</a>
              <Link href={`/admin/inquiries?product=${q.product.id}`} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">All inquiries for it</Link>
            </div>
          </div>
        ) : (
          <p className="mt-3 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">General inquiry (sent from the seller page, no product)</p>
        )}
      </div>
      <div className="flex h-[65vh] flex-col overflow-hidden rounded-2xl bg-[#f7fbf8] ring-1 ring-gray-200/70">
        <Thread messages={JSON.parse(JSON.stringify(q.messages))} me="admin" postUrl={`/api/admin/inquiries/${q.id}/messages`} placeholder="Write as the SHRIJAIV team (both sides see this)…" />
      </div>
    </div>
  );
}
