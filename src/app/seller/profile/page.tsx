import { requireSeller } from '@/lib/auth';
import { getMarketplace } from '@/lib/marketplace/settings';
import { entitlements } from '@/lib/marketplace/plans';
import { PageTitle } from '@/components/admin/ui';
import ProfileEditor from '@/components/seller/ProfileEditor';

export default async function SellerProfile() {
  const { seller } = (await requireSeller())!;
  const [mp, e] = await Promise.all([getMarketplace(), entitlements(seller.id)]);
  return (
    <>
      <PageTitle title="Company profile" subtitle="This is your public showroom. Complete it fully — verified, complete profiles get the most inquiries." actions={<a href={`/sellers/${seller.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">View showroom</a>} />
      <ProfileEditor initial={JSON.parse(JSON.stringify(seller))} types={mp.sellerTypes} aiTools={e.aiTools} />
    </>
  );
}
