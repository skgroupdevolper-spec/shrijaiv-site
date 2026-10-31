import { getI18n } from '@/lib/i18n/server';
import AuthShell from '@/components/portal/AuthShell';
import { RegisterForm } from '@/components/portal/AuthForms';
import GoogleButton from '@/components/portal/GoogleButton';
import { getMarketplace } from '@/lib/marketplace/settings';
import { getCategoryTree } from '@/lib/marketplace/data';
import { getCurrentUser, homeFor } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t('Create Account'), robots: { index: false } };
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const { as } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  const [mp, tree] = await Promise.all([getMarketplace(), getCategoryTree().catch(() => [])]);
  const role = as === 'seller' ? 'seller' : 'buyer';
  return (
    <AuthShell tab="register" wide title={role === 'seller' ? 'Start selling on SHRIJAIV' : 'Create your buyer account'} subtitle={role === 'seller' ? 'List your organic products and receive inquiries from buyers across India.' : 'Find verified organic sellers, post requirements and compare quotes.'}>
      <GoogleButton />
      <RegisterForm initialRole={role} sellerTypes={mp.sellerTypes} buyerTypes={mp.buyerTypes} categories={tree.map((c) => ({ id: c.id, name: c.name }))} />
    </AuthShell>
  );
}
