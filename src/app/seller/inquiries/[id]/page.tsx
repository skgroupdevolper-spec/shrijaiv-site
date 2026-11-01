import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Package, BadgeCheck } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireSeller } from '@/lib/auth';
import { images } from '@/lib/marketplace/data';
import { formatDateTime } from '@/lib/utils';
import { getMarketplace } from '@/lib/marketplace/settings';
import { visibleTo } from '@/lib/marketplace/chat';
import PrivateContact from '@/components/market/PrivateContact';
import Thread from '@/components/dashboard/Thread';
import InquiryStatus from '@/components/seller/InquiryStatus';
import { StatusPill } from '@/components/dashboard/fields';
import { SELLER_VISIBLE } from '@/lib/marketplace/moderation';

export default async function SellerInquiry({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { seller } = (await requireSeller())!;
  const q = await prisma.inquiry.findFirst({ where: { id, sellerId: seller.id, ...SELLER_VISIBLE }, include: { product: { select: { name: true, slug: true, images: true } }, messages: { orderBy: { createdAt: 'asc' } }, buyer: { select: { companyName: true, buyerType: true, city: true, state: true, verified: true } } } });
  if (!q) notFound();
  await prisma.inquiry.update({ where: { id }, data: { seenBySeller: true } });
  await prisma.inquiryMessage.updateMany({ where: { inquiryId: id, senderRole: { in: ['buyer', 'admin'] }, read: false }, data: { read: true } });
  const img = q.product ? images(q.product.images)[0] : null;
  const mp = await getMarketplace();
  const open = !mp.leads.enabled || q.contactUnlocked;
  const msgs = visibleTo(q.messages, 'seller', open);
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
          <Thread messages={JSON.parse(JSON.stringify(msgs))} me="seller" note={mp.approval.messages && !q.directChat ? 'Messages are checked by the SHRIJAIV team before the buyer sees them.' : undefined} postUrl={`/api/seller/inquiries/${q.id}/messages`} disabled={q.status === 'spam'} />
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
            <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-gray-400">Buyer</p>
            <p className="mt-1 flex items-center gap-1 font-bold text-gray-900">{q.name} {q.buyer?.verified && <BadgeCheck className="h-4 w-4 text-emerald-600" />}</p>
            {(q.company || q.buyer?.companyName) && <p className="text-sm text-gray-600">{q.company || q.buyer?.companyName}{q.buyer?.buyerType ? ` · ${q.buyer.buyerType}` : ''}</p>}
            {(q.city || q.buyer?.city || q.buyer?.state) && <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3 w-3" /> {[q.city || q.buyer?.city, q.buyer?.state].filter(Boolean).join(', ')}</p>}
            <PrivateContact unlocked={open} contact={{ email: q.email, phone: q.phone }} kind="inquiry" id={q.id} waText={`Hello ${q.name}, this is ${seller.companyName} from SHRIJAIV regarding your inquiry ${q.refNo}.`} />
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
