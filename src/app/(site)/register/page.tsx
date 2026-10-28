import { getI18n } from '@/lib/i18n/server';
import AuthShell from '@/components/portal/AuthShell';
import { RegisterForm } from '@/components/portal/AuthForms';
import { getMarketplace } from '@/lib/marketplace/settings';

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t('Create Account'), robots: { index: false } };
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const { as } = await searchParams;
  const mp = await getMarketplace();
  const role = as === 'seller' ? 'seller' : 'buyer';
  return (
    <AuthShell title={role === 'seller' ? 'Start selling on SHRIJAIV' : 'Create your buyer account'} subtitle={role === 'seller' ? 'List your organic products and receive inquiries from buyers across India.' : 'Find verified organic sellers, post requirements and compare quotes.'}>
      <RegisterForm initialRole={role} sellerTypes={mp.sellerTypes} buyerTypes={mp.buyerTypes} />
    </AuthShell>
  );
}
