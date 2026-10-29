import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { googleConfig, baseUrl, safeNext } from '@/lib/google-auth';

export const dynamic = 'force-dynamic';

/** Start "Continue with Google": redirect to Google's consent screen */
export async function GET(req: Request) {
  const base = baseUrl(req);
  const cfg = await googleConfig();
  const url = new URL(req.url);
  if (!cfg.enabled) return NextResponse.redirect(`${base}/login?error=google-off`);
  const state = crypto.randomBytes(16).toString('hex');
  const next = safeNext(url.searchParams.get('next'));
  const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  auth.searchParams.set('client_id', cfg.id);
  auth.searchParams.set('redirect_uri', `${base}/api/auth/google/callback`);
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('scope', 'openid email profile');
  auth.searchParams.set('state', state);
  auth.searchParams.set('prompt', 'select_account');
  const res = NextResponse.redirect(auth.toString());
  const opts = { httpOnly: true, sameSite: 'lax' as const, secure: base.startsWith('https'), path: '/', maxAge: 600 };
  res.cookies.set('g_state', state, opts);
  res.cookies.set('g_next', next, opts);
  return res;
}
