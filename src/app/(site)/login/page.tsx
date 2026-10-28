import { getI18n } from '@/lib/i18n/server';
import { Suspense } from 'react';
import AuthShell from '@/components/portal/AuthShell';
import { LoginForm } from '@/components/portal/AuthForms';
import { getCurrentUser, homeFor } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t('Client Login'), robots: { index: false } };
}

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your buyer or seller dashboard.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
