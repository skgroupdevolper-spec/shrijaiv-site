// Sign in with Google (OAuth 2.0 authorization-code flow). Keys: Admin → App & splash screen.
import { getSetting } from '@/lib/settings';

export async function googleConfig() {
  const o = await getSetting('oauth');
  const id = o.googleClientId || process.env.GOOGLE_CLIENT_ID || '';
  const secret = o.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || '';
  return { enabled: !!(o.googleEnabled && id && secret), id, secret, newUserRole: o.newUserRole === 'SELLER' ? 'SELLER' : 'BUYER' } as const;
}

/** Public base URL of this request (works behind proxies such as Codespaces / Hostinger) */
export function baseUrl(req: Request) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const h = req.headers;
  const host = h.get('x-forwarded-host') || h.get('host') || new URL(req.url).host;
  const proto = h.get('x-forwarded-proto') || new URL(req.url).protocol.replace(':', '');
  return `${proto}://${host}`;
}

/** Only same-site paths are allowed as "next" */
export function safeNext(v: string | null | undefined) {
  return v && v.startsWith('/') && !v.startsWith('//') ? v : '';
}
