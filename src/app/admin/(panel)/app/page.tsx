import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AppSettingsEditor from '@/components/admin/AppSettingsEditor';

export default async function Page() {
  const s = await getSession();
  if (s?.role !== 'ADMIN') redirect('/admin');
  return <AppSettingsEditor />;
}
