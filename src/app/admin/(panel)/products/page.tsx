import { ProductsManager } from '@/components/admin/MarketplaceManagers';

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  return <ProductsManager initialStatus={status} />;
}
