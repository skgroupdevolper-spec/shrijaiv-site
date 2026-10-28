import Link from 'next/link';
import { PlusCircle, Package } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireSeller } from '@/lib/auth';
import { entitlements } from '@/lib/marketplace/plans';
import { PageTitle } from '@/components/admin/ui';
import ProductsTable from '@/components/seller/ProductsTable';

export default async function SellerProducts({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { seller } = (await requireSeller())!;
  const { status } = await searchParams;
  const [items, e] = await Promise.all([
    prisma.product.findMany({ where: { sellerId: seller.id, ...(status ? { status } : {}) }, orderBy: { updatedAt: 'desc' }, include: { category: { select: { name: true } } } }),
    entitlements(seller.id),
  ]);
  const total = await prisma.product.count({ where: { sellerId: seller.id } });
  const limitHit = e.maxProducts >= 0 && total >= e.maxProducts;
  return (
    <>
      <PageTitle
        title="My products"
        subtitle={e.maxProducts < 0 ? `${total} products · unlimited` : `${total}/${e.maxProducts} products on the ${e.planName} plan`}
        actions={
          limitHit ? (
            <Link href="/seller/membership" className="btn btn-gold"><PlusCircle className="h-4 w-4" /> Upgrade to add more</Link>
          ) : (
            <Link href="/seller/products/new" className="btn btn-gold"><PlusCircle className="h-4 w-4" /> Add product</Link>
          )
        }
      />
      {items.length === 0 && !status ? (
        <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-gray-200/70">
          <Package className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 font-bold text-gray-900">No products yet</p>
          <p className="mt-1 text-sm text-gray-500">Add your first product with photos, a price range and MOQ. Buyers find you through search and categories.</p>
          <Link href="/seller/products/new" className="btn btn-gold mt-5"><PlusCircle className="h-4 w-4" /> Add your first product</Link>
        </div>
      ) : (
        <ProductsTable items={JSON.parse(JSON.stringify(items))} status={status || ''} />
      )}
    </>
  );
}
