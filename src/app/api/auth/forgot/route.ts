import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { ok, rateLimit, clientIp, fail } from '@/lib/api';
import { sendMail } from '@/lib/mail';

export async function POST(req: Request) {
  if (!rateLimit('forgot:' + clientIp(req), 5, 10 * 60_000)) return fail('Too many attempts', 429);
  const { email } = await req.json().catch(() => ({}));
  const user = email ? await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } }) : null;
  if (user) {
    const token = crypto.randomBytes(24).toString('hex');
    await prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetExpires: new Date(Date.now() + 60 * 60 * 1000) } });
    const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const link = `${base}/reset-password?token=${token}`;
    const sent = await sendMail({
      to: user.email,
      subject: 'Reset your password',
      html: `<p>Hello ${user.name},</p><p>Click the button below to set a new password. This link is valid for 1 hour.</p><p><a href="${link}" style="display:inline-block;background:#c8a255;color:#0a1222;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    });
    // the team always hears about it (and can set a new password in Admin → Users when the email did not arrive)
    await prisma.notification.create({ data: { userId: null, type: 'account', title: `Password reset requested: ${user.name}`, body: `${user.email} (${user.role.toLowerCase()})${sent ? '' : ' — the email could not be sent, please reset it by hand'}`, href: `/admin/users?q=${encodeURIComponent(user.email)}` } }).catch(() => null);
  }
  // Always succeed (do not reveal whether an email exists)
  return ok();
}
