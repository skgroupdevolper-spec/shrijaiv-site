import { Heart } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireBuyer } from '@/lib/auth';
import { PageTitle } from '@/components/admin/ui';
import ProductCard from '@/components/market/ProductCard';
import SellerCard from '@/components/market/SellerCard';

export default async function BuyerFavourites() {
  const { buyer } = (await requireBuyer())!;
  const favs = await prisma.favourite.findMany({ where: { buyerId: buyer.id }, orderBy: { createdAt: 'desc' }, include: { product: { include: { seller: { select: { slug: true, companyName: true, verified: true, city: true, state: true, logo: true } }, category: { select: { slug: true, name: true } } } }, seller: { include: { _count: { select: { products: { where: { status: 'approved' } } } }, products: { where: { status: 'approved' }, take: 3, select: { slug: true, name: true, images: true } } } } } });
  const products = favs.map((f) => f.product).filter(Boolean) as any[];
  const sellers = favs.map((f) => f.seller).filter(Boolean) as any[];
  return (
    <>
      <PageTitle title="Favourites" subtitle="Products and sellers you saved with the ♥ button." />
      {!products.length && !sellers.length && <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-gray-200/70"><Heart className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-3 text-sm text-gray-500">Nothing saved yet. Use the ♥ on any product or showroom.</p></div>}
      {products.length > 0 && (<><h2 className="mb-3 font-bold text-gray-900">Products</h2><div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{products.map((p) => <ProductCard key={p.id} p={p} compact />)}</div></>)}
      {sellers.length > 0 && (<><h2 className="mb-3 font-bold text-gray-900">Sellers</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{sellers.map((s) => <SellerCard key={s.id} s={s} />)}</div></>)}
    </>
  );
}
