import { requireSeller } from '@/lib/auth';
import { entitlements } from '@/lib/marketplace/plans';
import { PageTitle } from '@/components/admin/ui';
import AiTools from '@/components/seller/AiTools';
import { LOCALES } from '@/lib/i18n/config';

export default async function SellerAi() {
  const { seller } = (await requireSeller())!;
  const e = await entitlements(seller.id);
  return (
    <>
      <PageTitle title="AI tools" subtitle="Write product descriptions, translate text into any Indian language and draft replies to buyers." />
      <AiTools enabled={e.aiTools} locales={LOCALES.filter((l) => l.code !== 'en').map((l) => ({ code: l.code, name: l.name, native: l.native }))} />
    </>
  );
}
