import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BadgeCheck, MapPin } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireBuyer } from '@/lib/auth';
import { images } from '@/lib/marketplace/data';
import { formatDateTime, waLink } from '@/lib/utils';
import Thread from '@/components/dashboard/Thread';
import { StatusPill } from '@/components/dashboard/fields';
import { Rating } from '@/components/market/Rating';

export default async function BuyerInquiry({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { buyer } = (await requireBuyer())!;
  const q = await prisma.inquiry.findFirst({ where: { id, buyerId: buyer.id }, include: { seller: { select: { slug: true, companyName: true, verified: true, city: true, state: true, logo: true, ratingAvg: true, ratingCount: true, whatsapp: true, phone: true } }, product: { select: { name: true, slug: true, images: true } }, messages: { orderBy: { createdAt: 'asc' } } } });
  if (!q) notFound();
  await prisma.inquiry.update({ where: { id }, data: { seenByBuyer: true } });
  await prisma.inquiryMessage.updateMany({ where: { inquiryId: id, senderRole: { in: ['seller', 'admin'] }, read: false }, data: { read: true } });
  const img = q.product ? images(q.product.images)[0] : null;
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/buyer/inquiries" className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> Inquiries</Link>
        <span className="text-xs text-gray-400">{q.refNo} · {formatDateTime(q.createdAt)}</span>
        <StatusPill status={q.status} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex h-[70vh] min-h-[480px] flex-col overflow-hidden rounded-2xl bg-[#f7fbf8] ring-1 ring-gray-200/70">
          <Thread messages={JSON.parse(JSON.stringify(q.messages))} me="buyer" postUrl={`/api/buyer/inquiries/${q.id}/messages`} disabled={q.status === 'closed' || q.status === 'spam'} />
        </div>
        <div className="space-y-4">
          <Link href={`/sellers/${q.seller.slug}`} target="_blank" className="block rounded-2xl bg-white p-5 ring-1 ring-gray-200/70 hover:bg-gray-50">
            <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-gray-400">Seller</p>
            <p className="mt-1 flex items-center gap-1 font-bold text-gray-900">{q.seller.companyName} {q.seller.verified && <BadgeCheck className="h-4 w-4 text-emerald-600" />}</p>
            {(q.seller.city || q.seller.state) && <p className="inline-flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3 w-3" /> {[q.seller.city, q.seller.state].filter(Boolean).join(', ')}</p>}
            <Rating value={q.seller.ratingAvg} count={q.seller.ratingCount} className="mt-1" />
          </Link>
          {(q.seller.whatsapp || q.seller.phone) && <a href={waLink(q.seller.whatsapp || q.seller.phone || '', `Hello ${q.seller.companyName}, about my inquiry ${q.refNo} on SHRIJAIV.`)} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full">WhatsApp the seller</a>}
          {q.product && (
            <Link href={`/products/${q.product.slug}`} target="_blank" className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-gray-200/70 hover:bg-gray-50">
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">{img && <img src={img} alt="" className="h-full w-full object-cover" />}</span>
              <div className="min-w-0"><p className="text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-gray-400">Product</p><p className="truncate text-sm font-semibold text-gray-900">{q.product.name}</p></div>
            </Link>
          )}
          <Link href={`/sellers/${q.seller.slug}#reviews`} className="block rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-100 hover:bg-emerald-100">Deal done? Rate {q.seller.companyName} →</Link>
        </div>
      </div>
    </div>
  );
}
