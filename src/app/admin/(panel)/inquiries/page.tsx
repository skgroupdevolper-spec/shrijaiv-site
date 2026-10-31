import Link from 'next/link';
import { TrendingUp, X } from 'lucide-react';
import { prisma } from '@/lib/db';
import { InquiriesManager } from '@/components/admin/MarketplaceManagers';

export const dynamic = 'force-dynamic';

const firstImg = (j?: string | null) => {
  try {
    return (JSON.parse(j || '[]') as string[])[0] || '';
  } catch {
    return '';
  }
};

/** Every inquiry is tracked to the product it was sent from — see which products buyers ask about */
export default async function Page({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product = '' } = await searchParams;
  const since = new Date(Date.now() - 30 * 864e5);
  const [all, recent, general] = await Promise.all([
    prisma.inquiry.groupBy({ by: ['productId'], where: { productId: { not: null } }, _count: { _all: true } }),
    prisma.inquiry.groupBy({ by: ['productId'], where: { productId: { not: null }, createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.inquiry.count({ where: { productId: null } }),
  ]);
  const ids = all.map((g) => g.productId!).filter(Boolean);
  const prods = ids.length ? await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, slug: true, images: true, seller: { select: { companyName: true } } } }) : [];
  const byId = new Map(prods.map((p) => [p.id, p]));
  const last30 = new Map(recent.map((g) => [g.productId, g._count._all]));
  const ranked = all
    .map((g) => ({ p: byId.get(g.productId!), total: g._count._all, month: last30.get(g.productId) || 0 }))
    .filter((x) => x.p)
    .sort((a, b) => b.total - a.total || b.month - a.month);
  const options = ranked.map((x) => ({ value: x.p!.id, label: `${x.p!.name} (${x.total})` }));
  const current = product ? byId.get(product) : undefined;

  const intro = (
    <>
      {ranked.length > 0 && (
        <div className="mb-6 rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 font-bold text-gray-900">
              <TrendingUp className="h-5 w-5 text-emerald-600" /> Most inquired products
            </p>
            <p className="text-xs text-gray-400">
              Every inquiry is tracked to the product page it came from · {general} general inquiries (from seller pages)
            </p>
          </div>
          <div className="thin-scroll -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {ranked.slice(0, 12).map(({ p, total, month }, i) => (
              <Link key={p!.id} href={`/admin/inquiries?product=${p!.id}`} className={`flex w-[230px] shrink-0 items-center gap-3 rounded-xl p-2.5 ring-1 transition ${product === p!.id ? 'bg-amber-50 ring-amber-300' : 'bg-gray-50 ring-gray-200/70 hover:ring-emerald-300'}`}>
                <span className="relative shrink-0">
                  {firstImg(p!.images) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={firstImg(p!.images)} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <span className="block h-12 w-12 rounded-lg bg-emerald-100" />
                  )}
                  <span className="absolute -left-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-gray-900 text-[0.6rem] font-bold text-white">{i + 1}</span>
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-1 text-sm font-bold text-gray-900">{p!.name}</span>
                  <span className="block truncate text-[0.7rem] text-gray-400">{p!.seller.companyName}</span>
                  <span className="mt-0.5 block text-[0.72rem] font-semibold text-emerald-700">
                    {total} {total === 1 ? "inquiry" : "inquiries"}{month ? ` · ${month} in 30 days` : ''}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
      {current && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-900 ring-1 ring-amber-200">
          Showing inquiries for <b>{current.name}</b>
          <Link href="/admin/inquiries" className="ml-auto inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1 text-xs font-bold ring-1 ring-amber-200 hover:bg-amber-100">
            <X className="h-3.5 w-3.5" /> Show all
          </Link>
        </div>
      )}
    </>
  );
  return <InquiriesManager key={product || 'all'} products={options} product={current ? product : ''} intro={intro} />;
}
