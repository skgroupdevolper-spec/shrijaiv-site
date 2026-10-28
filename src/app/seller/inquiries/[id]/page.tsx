import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, Package, Lock, BadgeCheck } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireSeller } from '@/lib/auth';
import { images } from '@/lib/marketplace/data';
import { waLink, formatDateTime } from '@/lib/utils';
import Thread from '@/components/dashboard/Thread';
import InquiryStatus from '@/components/seller/InquiryStatus';
import { StatusPill } from '@/components/dashboard/fields';

export default async function SellerInquiry({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { seller } = (await requireSeller())!;
  const q = await prisma.inquiry.findFirst({ where: { id, sellerId: seller.id }, include: { product: { select: { name: true, slug: true, images: true } }, messages: { orderBy: { createdAt: 'asc' } }, buyer: { select: { companyName: true, buyerType: true, city: true, state: true, verified: true } } } });
  if (!q) notFound();
  await prisma.inquiry.update({ where: { id }, data: { seenBySeller: true } });
  await prisma.inquiryMessage.updateMany({ where: { inquiryId: id, senderRole: { in: ['buyer', 'admin'] }, read: false }, data: { read: true } });
  const img = q.product ? images(q.product.images)[0] : null;
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/seller/inquiries" className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> Inquiries</Link>
        <span className="text-xs text-gray-400">{q.refNo} · {formatDateTime(q.createdAt)}</span>
        <StatusPill status={q.status} />
        <div className="ml-auto"><InquiryStatus id={q.id} status={q.status} /></div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex h-[70vh] min-h-[480px] flex-col overflow-hidden rounded-2xl bg-[#f7fbf8] ring-1 ring-gray-200/70">
          <Thread messages={JSON.parse(JSON.stringify(q.messages))} me="seller" postUrl={`/api/seller/inquiries/${q.id}/messages`} disabled={q.status === 'spam'} />
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
            <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-gray-400">Buyer</p>
            <p className="mt-1 flex items-center gap-1 font-bold text-gray-900">{q.name} {q.buyer?.verified && <BadgeCheck className="h-4 w-4 text-emerald-600" />}</p>
            {(q.company || q.buyer?.companyName) && <p className="text-sm text-gray-600">{q.company || q.buyer?.companyName}{q.buyer?.buyerType ? ` · ${q.buyer.buyerType}` : ''}</p>}
            {(q.city || q.buyer?.city || q.buyer?.state) && <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3 w-3" /> {[q.city || q.buyer?.city, q.buyer?.state].filter(Boolean).join(', ')}</p>}
            {q.contactUnlocked ? (
              <div className="mt-3 space-y-1.5 text-sm">
                {q.email && <a href={`mailto:${q.email}`} className="flex items-center gap-2 text-gray-700 hover:text-gold-deep"><Mail className="h-4 w-4 text-gold-deep" /> {q.email}</a>}
                {q.phone && <a href={`tel:${q.phone}`} className="flex items-center gap-2 text-gray-700 hover:text-gold-deep"><Phone className="h-4 w-4 text-gold-deep" /> {q.phone}</a>}
                {q.phone && <a href={waLink(q.phone, `Hello ${q.name}, this is ${seller.companyName} from SHRIJAIV regarding your inquiry ${q.refNo}.`)} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm mt-1 w-full">WhatsApp the buyer</a>}
              </div>
            ) : (
              <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                <p className="flex items-center gap-1 font-bold"><Lock className="h-3.5 w-3.5" /> Contact details locked</p>
                <p className="mt-1">Your plan's monthly buyer contacts are used up. You can still reply here; the buyer sees it in their dashboard and email.</p>
                <Link href="/seller/membership" className="btn btn-gold btn-sm mt-2 w-full">Upgrade plan</Link>
              </div>
            )}
          </div>
          {q.product && (
            <Link href={`/products/${q.product.slug}`} target="_blank" className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-gray-200/70 hover:bg-gray-50">
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">{img && <img src={img} alt="" className="h-full w-full object-cover" />}</span>
              <div className="min-w-0">
                <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-gray-400">Product</p>
                <p className="truncate text-sm font-semibold text-gray-900">{q.product.name}</p>
              </div>
            </Link>
          )}
          {q.quantity && (
            <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-200/70">
              <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-gray-400">Quantity</p>
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900"><Package className="h-4 w-4 text-gold-deep" /> {q.quantity}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
