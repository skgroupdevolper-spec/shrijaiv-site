'use client';
import { Save, Smartphone, KeyRound, Copy } from 'lucide-react';
import type { Field } from '@/components/blocks/types';
import { FieldGroup } from './FieldInput';
import { Btn, Card, PageTitle, Spinner, toast } from './ui';
import { useSetting } from './SettingsEditors';

const INSTALL: Field[] = [
  { name: 'installBar', label: 'Show the “Install app” bar (comes back on every page load until the app is installed)', type: 'boolean' },
  { name: 'installTitle', label: 'Bar title', type: 'text', half: true },
  { name: 'installButton', label: 'Button label', type: 'text', half: true },
  { name: 'installText', label: 'Bar text', type: 'text' },
  { name: 'iosHint', label: 'iPhone hint (Safari has no install button)', type: 'text' },
];

const SPLASH: Field[] = [
  { name: 'splashEnabled', label: 'Show the welcome screen when the installed app is opened the first time', type: 'boolean' },
  { name: 'splashLogo', label: 'Logo on the welcome screen (empty = the site badge)', type: 'image' },
  { name: 'splashTitle', label: 'Title', type: 'text' },
  { name: 'splashText', label: 'Text', type: 'textarea' },
  { name: 'splashBg', label: 'Background colour', type: 'color', half: true },
  { name: 'splashSeconds', label: 'Seconds per image', type: 'number', half: true },
  {
    name: 'splashSlides',
    label: 'Images (add as many as you like — they slide automatically)',
    type: 'list',
    itemLabel: 'Image',
    fields: [
      { name: 'image', label: 'Image', type: 'image' },
      { name: 'title', label: 'Caption title (optional)', type: 'text', half: true },
      { name: 'text', label: 'Caption text (optional)', type: 'text', half: true },
    ],
  },
  { name: 'showGoogle', label: 'Button: Continue with Google', type: 'boolean', half: true },
  { name: 'showEmail', label: 'Button: Continue with email', type: 'boolean', half: true },
  { name: 'showSkip', label: 'Button: Skip', type: 'boolean', half: true },
  { name: 'googleLabel', label: 'Google button label', type: 'text', half: true },
  { name: 'emailLabel', label: 'Email button label', type: 'text', half: true },
  { name: 'signupLabel', label: 'Sign-up link label', type: 'text', half: true },
  { name: 'skipLabel', label: 'Skip label', type: 'text', half: true },
];

const OAUTH: Field[] = [
  { name: 'googleEnabled', label: 'Allow sign-in with Google (login page, register page and the welcome screen)', type: 'boolean' },
  { name: 'googleClientId', label: 'Google OAuth Client ID', type: 'text' },
  { name: 'googleClientSecret', label: 'Google OAuth Client secret', type: 'text' },
  { name: 'newUserRole', label: 'New Google users become', type: 'select', options: [{ value: 'BUYER', label: 'Buyer' }, { value: 'SELLER', label: 'Seller' }] },
];

/** Admin → App & splash screen */
export default function AppSettingsEditor() {
  const app = useSetting<any>('app');
  const oauth = useSetting<any>('oauth');
  if (!app.value || !oauth.value) return <Spinner />;
  const callback = typeof window !== 'undefined' ? `${window.location.origin}/api/auth/google/callback` : '/api/auth/google/callback';
  return (
    <div>
      <PageTitle
        title="App & splash screen"
        subtitle="Install bar, the welcome screen of the installed app, and Google sign-in."
        actions={
          <Btn onClick={async () => { await app.save(); await oauth.save(); }} loading={app.saving || oauth.saving}>
            <Save className="h-4 w-4" /> Save
          </Btn>
        }
      />
      <div className="grid max-w-4xl gap-6">
        <Card title="Install app bar" className="p-6">
          <FieldGroup fields={INSTALL} data={app.value} onChange={app.setValue} />
        </Card>
        <Card title="Welcome / splash screen (first open after installing)" className="p-6">
          <p className="mb-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0" /> Shown once, the first time someone opens the installed app from their home screen. The normal website never shows it.
          </p>
          <FieldGroup fields={SPLASH} data={app.value} onChange={app.setValue} />
        </Card>
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
