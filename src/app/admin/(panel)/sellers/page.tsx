import { SellersManager } from '@/components/admin/MarketplaceManagers';

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  return <SellersManager initialStatus={status} />;
}
