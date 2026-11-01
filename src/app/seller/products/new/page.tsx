import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Search, Plus, Store, Pencil, PackagePlus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireSeller } from '@/lib/auth';
import { canAddProduct } from '@/lib/marketplace/plans';
import { getMarketplace } from '@/lib/marketplace/settings';
import { images, priceLabel } from '@/lib/marketplace/format';
import { PageTitle } from '@/components/admin/ui';
import ProductEditor from '@/components/seller/ProductEditor';

/**
 * Add a product in two steps:
 *  1. search the catalogue — the product may already be listed by another seller; then the seller only adds
 *     an own offer (price, quantity, MOQ, details) to it;
 *  2. not in the catalogue → a brand-new product (checked by the admin first).
 */
export default async function NewProduct({ searchParams }: { searchParams: Promise<{ q?: string; master?: string; new?: string }> }) {
  const sp = await searchParams;
  const { seller } = (await requireSeller())!;
  const gate = await canAddProduct(seller.id);
  if (!gate.ok) redirect('/seller/membership?reason=products');
  const [cats, mp] = await Promise.all([prisma.category.findMany({ where: { active: true }, orderBy: [{ order: 'asc' }, { name: 'asc' }], select: { id: true, name: true, parentId: true } }), getMarketplace()]);

  if (sp.master) {
    const m = await prisma.product.findFirst({ where: { id: sp.master, masterId: null, status: 'approved' }, select: { id: true, name: true, images: true, categoryId: true, sellerId: true } });
    if (!m) redirect('/seller/products/new');
    if (m.sellerId === seller.id) redirect(`/seller/products/${m.id}`);
    const mine = await prisma.product.findFirst({ where: { sellerId: seller.id, masterId: m.id }, select: { id: true } });
    if (mine) redirect(`/seller/products/${mine.id}`);
    return (
      <>
        <PageTitle title={`Sell: ${m.name}`} subtitle={mp.approval.offers ? 'Add your price, quantity and details. The SHRIJAIV team checks it before it goes live.' : 'Add your price, quantity and details — it goes live in the list of sellers for this product.'} />
        <ProductEditor initial={null} master={{ id: m.id, name: m.name, image: images(m.images)[0], categoryId: m.categoryId }} categories={cats} units={mp.units} maxImages={gate.e.maxImages} aiTools={gate.e.aiTools} />
      </>
    );
  }

  if (sp.new) {
    return (
      <>
        <PageTitle title="Add a new product" subtitle={mp.approval.products ? 'New products are checked by the SHRIJAIV team before they go live. Photos, price range and MOQ matter most.' : 'Photos, price range and MOQ matter most. You can save a draft and finish later.'} />
        <ProductEditor initial={null} categories={cats} units={mp.units} maxImages={gate.e.maxImages} aiTools={gate.e.aiTools} />
      </>
    );
  }

  const q = (sp.q || '').trim();
  const where: any = { status: 'approved', masterId: null, seller: { status: 'approved' } };
  if (q) where.OR = [{ name: { contains: q } }, { tags: { contains: q } }, { brand: { contains: q } }];
  const found = await prisma.product.findMany({ where, orderBy: q ? { name: 'asc' } : { views: 'desc' }, take: 24, select: { id: true, name: true, images: true, priceMin: true, priceMax: true, priceUnit: true, sellerId: true, category: { select: { name: true } }, _count: { select: { offers: { where: { status: 'approved' } } } } } });
  const myOffers = await prisma.product.findMany({ where: { sellerId: seller.id, masterId: { in: found.map((f) => f.id) } }, select: { id: true, masterId: true } });
  const mineBy = new Map(myOffers.map((o) => [o.masterId, o.id]));

  return (
    <div className="max-w-5xl">
      <PageTitle title="Add product" subtitle="First check whether the product is already in the SHRIJAIV catalogue. If it is, just add your own price and quantity to it." />
      <form className="relative mb-5" action="/seller/products/new">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input name="q" defaultValue={q} autoFocus placeholder="Search the catalogue, e.g. apple, turmeric, ghee…" className="admin-input !h-14 !rounded-2xl !pl-12 !text-base" />
      </form>

      <p className="mb-3 text-sm font-bold text-gray-700">{q ? `${found.length} catalogue products for “${q}”` : 'Popular catalogue products'}</p>
      {found.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-gray-200/70">
          <PackagePlus className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 font-bold text-gray-900">Not in the catalogue yet</p>
          <p className="mt-1 text-sm text-gray-500">Add it as a new product — buyers will find it once the team approves it.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {found.map((f) => {
            const own = f.sellerId === seller.id;
            const offerId = mineBy.get(f.id);
            const img = images(f.images)[0];
            return (
              <div key={f.id} className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-gray-200/70">
                {img ? <img src={img} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" /> : <span className="h-16 w-16 shrink-0 rounded-xl bg-gray-100" />}
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="line-clamp-2 text-sm font-bold leading-tight text-gray-900">{f.name}</p>
                  <p className="text-xs text-gray-500">{f.category?.name || 'Uncategorised'} · {priceLabel(f)}</p>
                  <p className="inline-flex items-center gap-1 text-[0.7rem] text-gray-400"><Store className="h-3 w-3" /> {f._count.offers + 1} seller{f._count.offers ? 's' : ''}</p>
                  <div className="mt-auto pt-2">
                    {own || offerId ? (
                      <Link href={`/seller/products/${own ? f.id : offerId}`} className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200"><Pencil className="h-3.5 w-3.5" /> You sell this — edit</Link>
                    ) : (
                      <Link href={`/seller/products/new?master=${f.id}`} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"><Plus className="h-3.5 w-3.5" /> I sell this — add my price</Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200">
        <div>
          <p className="font-bold text-gray-900">Your product is not in the list?</p>
          <p className="text-sm text-gray-600">Add it as a new product{mp.approval.products ? ' — the SHRIJAIV team approves it first.' : '.'}</p>
        </div>
        <Link href="/seller/products/new?new=1" className="btn btn-gold"><PackagePlus className="h-4 w-4" /> Add a new product</Link>
      </div>
    </div>
  );
}
