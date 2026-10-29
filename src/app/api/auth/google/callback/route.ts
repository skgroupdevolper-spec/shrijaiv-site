import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { hashPassword, startSession, homeFor } from '@/lib/auth';
import { googleConfig, baseUrl, safeNext } from '@/lib/google-auth';
import { getMarketplace, uniqueSlug } from '@/lib/marketplace/settings';
import { notifyAdmin, rowsTable } from '@/lib/mail';

export const dynamic = 'force-dynamic';

/** Google redirects back here: verify state, exchange the code, sign the user in (or create the account) */
export async function GET(req: Request) {
  const base = baseUrl(req);
  const url = new URL(req.url);
  const store = await cookies();
  const state = store.get('g_state')?.value;
  const next = safeNext(store.get('g_next')?.value);
  const fail = (why: string) => NextResponse.redirect(`${base}/login?error=${why}`);
  if (!state || state !== url.searchParams.get('state')) return fail('google-state');
  const code = url.searchParams.get('code');
  if (!code) return fail('google-cancelled');
  const cfg = await googleConfig();
  if (!cfg.enabled) return fail('google-off');
  try {
    const tok = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: cfg.id, client_secret: cfg.secret, redirect_uri: `${base}/api/auth/google/callback`, grant_type: 'authorization_code' }),
    }).then((r) => r.json());
    if (!tok.access_token) return fail('google-token');
    const info = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${tok.access_token}` } }).then((r) => r.json());
    const email = String(info.email || '').toLowerCase();
    if (!email || info.email_verified === false) return fail('google-email');
    let user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.active) return fail('account-disabled');
    if (!user) {
      const name = String(info.name || email.split('@')[0]).slice(0, 80);
      const role = cfg.newUserRole;
      user = await prisma.user.create({ data: { name, email, role, avatar: info.picture || null, passwordHash: await hashPassword(crypto.randomBytes(24).toString('hex')) } });
      if (role === 'SELLER') {
        const mp = await getMarketplace();
        const slug = await uniqueSlug(name, async (s) => !!(await prisma.sellerProfile.findUnique({ where: { slug: s }, select: { id: true } })));
        await prisma.sellerProfile.create({ data: { userId: user.id, slug, companyName: name, email, status: mp.approval.sellers ? 'pending' : 'approved' } });
      } else {
        await prisma.buyerProfile.create({ data: { userId: user.id, companyName: null } });
      }
      await prisma.notification.create({ data: { type: role === 'SELLER' ? 'seller' : 'buyer', title: `New ${role === 'SELLER' ? 'seller' : 'buyer'} (Google): ${name}`, body: email, href: role === 'SELLER' ? '/admin/sellers' : '/admin/buyers' } }).catch(() => null);
      notifyAdmin(`New account via Google: ${name}`, rowsTable([['Name', name], ['Email', email], ['Role', role]]), email, 'accounts');
    }
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => null);
    await startSession(user);
    const res = NextResponse.redirect(`${base}${next || homeFor(user.role)}`);
    res.cookies.set('g_state', '', { path: '/', maxAge: 0 });
    res.cookies.set('g_next', '', { path: '/', maxAge: 0 });
    return res;
  } catch {
    return fail('google-error');
  }
}
