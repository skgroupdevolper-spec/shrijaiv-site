import { Star } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireSeller } from '@/lib/auth';
import { PageTitle } from '@/components/admin/ui';
import { Rating } from '@/components/market/Rating';
import ReviewReply from '@/components/seller/ReviewReply';
import { formatDate } from '@/lib/utils';

export default async function SellerReviews() {
  const { seller } = (await requireSeller())!;
  const items = await prisma.review.findMany({ where: { sellerId: seller.id, status: { in: ['approved', 'pending'] } }, orderBy: { createdAt: 'desc' }, include: { product: { select: { name: true } } } });
  await prisma.review.updateMany({ where: { sellerId: seller.id, seen: false }, data: { seen: true } });
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: items.filter((r) => r.status === 'approved' && r.rating === n).length }));
  return (
    <>
      <PageTitle title="Reviews" subtitle="Reply publicly to every review — buyers read your answers. Flag anything abusive and our team will check it." />
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200/70 lg:self-start">
          <p className="font-display text-5xl font-semibold text-gray-900">{seller.ratingCount ? seller.ratingAvg.toFixed(1) : '—'}</p>
          <Rating value={seller.ratingAvg} count={seller.ratingCount} size="md" className="mt-1" />
          <ul className="mt-4 space-y-1.5">
            {dist.map((d) => (
              <li key={d.n} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-gray-500">{d.n}★</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100"><span className="block h-full rounded-full bg-amber-400" style={{ width: `${seller.ratingCount ? (d.c / seller.ratingCount) * 100 : 0}%` }} /></span>
                <span className="w-6 text-right text-gray-400">{d.c}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-gray-200/70"><Star className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-3 text-sm text-gray-500">No reviews yet. After a deal, ask your buyer to rate you on your showroom page.</p></div>
          ) : (
            items.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-gray-900">{r.authorName} {r.verifiedPurchase && <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.6rem] font-bold text-emerald-700">Verified buyer</span>} {r.status === 'pending' && <span className="ml-1 rounded-full bg-amber-50 px-2 py-0.5 text-[0.6rem] font-bold text-amber-700">Awaiting moderation</span>}</p>
                  <span className="text-xs text-gray-400">{formatDate(r.createdAt)}{r.product ? ` · ${r.product.name}` : ''}</span>
                </div>
                <Rating value={r.rating} className="mt-1" />
                {r.title && <p className="mt-2 font-semibold text-gray-900">{r.title}</p>}
                <p className="mt-1 text-sm leading-relaxed text-gray-700">{r.body}</p>
                <ReviewReply id={r.id} reply={r.reply} />
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
