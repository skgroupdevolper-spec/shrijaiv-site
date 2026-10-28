import { redirect } from 'next/navigation';
import { getCurrentUser, homeFor } from '@/lib/auth';

/** /my-account (original "My Account" page): the right dashboard for the signed-in user, else login */
export default async function MyAccount() {
  const user = await getCurrentUser();
  redirect(user ? homeFor(user.role) : '/login');
}
