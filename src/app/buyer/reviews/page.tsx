import Link from 'next/link';
import { Star } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireBuyer } from '@/lib/auth';
import { PageTitle } from '@/components/admin/ui';
import { Rating } from '@/components/market/Rating';
import { StatusPill } from '@/components/dashboard/fields';
import { formatDate } from '@/lib/utils';

export default async function BuyerReviews() {
  const { buyer } = (await requireBuyer())!;
  const items = await prisma.review.findMany({ where: { buyerId: buyer.id }, orderBy: { createdAt: 'desc' }, include: { seller: { select: { slug: true, companyName: true } }, product: { select: { name: true, slug: true } } } });
  return (
    <>
      <PageTitle title="My reviews" subtitle="Reviews you wrote for sellers and products. Our team checks each one before it goes live." />
      {items.length === 0 ? <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-gray-200/70"><Star className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-3 text-sm text-gray-500">You have not written any reviews yet. Rate a seller from their showroom after a deal.</p></div> : (
        <div className="space-y-4">
          {items.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={r.product ? `/products/${r.product.slug}` : `/sellers/${r.seller.slug}`} className="font-bold text-gray-900 hover:text-gold-deep">{r.seller.companyName}{r.product ? ` · ${r.product.name}` : ''}</Link>
                <span className="flex items-center gap-2 text-xs text-gray-400"><StatusPill status={r.status} /> {formatDate(r.createdAt)}</span>
              </div>
              <Rating value={r.rating} className="mt-1" />
              {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
              <p className="mt-1 text-sm text-gray-700">{r.body}</p>
              {r.reply && <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm"><p className="text-xs font-bold text-gray-500">Seller's reply</p><p className="mt-1 text-gray-700">{r.reply}</p></div>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
