import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getI18n } from '@/lib/i18n/server';
import { getSession } from '@/lib/auth';
import { getMarketplace } from '@/lib/marketplace/settings';
import AuthShell from '@/components/portal/AuthShell';
import { RegisterForm } from '@/components/portal/AuthForms';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t('Post a requirement — get quotes from organic sellers'), description: t('Tell verified organic sellers what you need. Quantity, delivery location, deadline — and quotes arrive in your dashboard. Free for buyers.') };
}

/** Buyers go straight to the requirement form; everyone else creates a free buyer account first */
export default async function PostRequirementPage() {
  const s = await getSession();
  if (s?.role === 'BUYER') redirect('/buyer/requirements/new');
  if (s?.role === 'SELLER') redirect('/seller/leads');
  const mp = await getMarketplace();
  return (
    <AuthShell wide title="Post a requirement" subtitle="Create a free buyer account (one minute) — then describe what you need and verified sellers will send you quotes.">
      <RegisterForm initialRole="buyer" sellerTypes={mp.sellerTypes} buyerTypes={mp.buyerTypes} />
    </AuthShell>
  );
}
