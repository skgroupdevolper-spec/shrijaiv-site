'use client';
import { Save, KeyRound, Copy } from 'lucide-react';
import type { Field } from '@/components/blocks/types';
import { FieldGroup } from './FieldInput';
import { Btn, Card, PageTitle, Spinner, toast } from './ui';
import { useSetting } from './SettingsEditors';

const OAUTH: Field[] = [
  { name: 'googleEnabled', label: 'Allow sign-in with Google (login and register pages)', type: 'boolean' },
  { name: 'googleClientId', label: 'Google OAuth Client ID', type: 'text' },
  { name: 'googleClientSecret', label: 'Google OAuth Client secret', type: 'text' },
  { name: 'newUserRole', label: 'New Google users become', type: 'select', options: [{ value: 'BUYER', label: 'Buyer' }, { value: 'SELLER', label: 'Seller' }] },
];

/** Admin → Google sign-in */
export default function AppSettingsEditor() {
  const oauth = useSetting<any>('oauth');
  if (!oauth.value) return <Spinner />;
  const callback = typeof window !== 'undefined' ? `${window.location.origin}/api/auth/google/callback` : '/api/auth/google/callback';
  return (
    <div>
      <PageTitle
        title="Google sign-in"
        subtitle="Let buyers and sellers sign in with their Google account."
        actions={
          <Btn onClick={() => oauth.save()} loading={oauth.saving}>
            <Save className="h-4 w-4" /> Save
          </Btn>
        }
      />
      <div className="grid max-w-4xl gap-6">
        <Card title="Sign in with Google" className="p-6">
          <div className="mb-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
            <p className="flex items-center gap-2 font-semibold text-gray-800"><KeyRound className="h-4 w-4" /> Setup (5 minutes)</p>
            <ol className="mt-2 list-decimal space-y-1 ps-5">
              <li>Google Cloud Console → APIs & Services → Credentials → Create credentials → OAuth client ID → “Web application”.</li>
              <li>
                Authorised redirect URI:{' '}
                <button type="button" onClick={() => { navigator.clipboard?.writeText(callback); toast('Copied'); }} className="inline-flex items-center gap-1 rounded bg-white px-1.5 py-0.5 font-mono text-xs ring-1 ring-gray-200">
                  {callback} <Copy className="h-3 w-3" />
                </button>
              </li>
              <li>Paste the Client ID and secret below, switch it on and save.</li>
            </ol>
          </div>
          <FieldGroup fields={OAUTH} data={oauth.value} onChange={oauth.setValue} />
        </Card>
      </div>
    </div>
  );
}
