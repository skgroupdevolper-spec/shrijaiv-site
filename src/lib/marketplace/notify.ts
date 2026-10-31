// Emails + in-app notifications for marketplace events (inquiries, quotes, reviews, approvals).
import { prisma } from '@/lib/db';
import { sendMail, notifyAdmin, rowsTable, escapeHtml } from '@/lib/mail';
import { getSetting } from '@/lib/settings';

export async function notifyUser(userId: string | null | undefined, n: { type: string; title: string; body?: string; href?: string }) {
  if (!userId) return;
  await prisma.notification.create({ data: { userId, ...n } }).catch(() => null);
}

export async function notifyAdmins(n: { type: string; title: string; body?: string; href?: string }) {
  await prisma.notification.create({ data: { userId: null, ...n } }).catch(() => null);
}

/** A simple branded email body */
export async function emailHtml(title: string, intro: string, rows: [string, string | null | undefined][], cta?: { label: string; href: string }) {
  const site = await getSetting('site');
  const base = process.env.NEXT_PUBLIC_SITE_URL || '';
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0b1a10">
    <p style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#009a35;font-weight:700">${escapeHtml(site.name)}</p>
    <h2 style="margin:8px 0 12px;font-size:22px">${escapeHtml(title)}</h2>
    <p style="font-size:15px;line-height:1.6">${escapeHtml(intro)}</p>
    ${rowsTable(rows)}
    ${cta ? `<p style="margin-top:20px"><a href="${base}${cta.href}" style="display:inline-block;background:#009a35;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700">${escapeHtml(cta.label)}</a></p>` : ''}
    <p style="margin-top:28px;font-size:12px;color:#6e6e73">${escapeHtml(site.name)} · ${escapeHtml(site.tagline || '')}</p>
  </div>`;
}

type InqLite = { id: string; refNo: string; name: string; email?: string | null; phone?: string | null; message: string; quantity?: string | null };
type SellerLite = { userId: string; companyName: string; email?: string | null };
const inqRows = (inq: InqLite, productName?: string | null): [string, string | null | undefined][] => [['Reference', inq.refNo], ['Product', productName || 'General inquiry'], ['From', inq.name], ['Quantity', inq.quantity], ['Message', inq.message]];

/** Tell the seller about an inquiry (immediately, or when the admin forwards it) */
export async function deliverInquiry(inq: InqLite, seller: SellerLite, productName?: string | null) {
  const rows = inqRows(inq, productName);
  await notifyUser(seller.userId, { type: 'inquiry', title: `New inquiry from ${inq.name}${productName ? ` · ${productName}` : ''}`, body: inq.message.slice(0, 140), href: `/seller/inquiries/${inq.id}` });
  const sellerUser = await prisma.user.findUnique({ where: { id: seller.userId }, select: { email: true } });
  const to = seller.email || sellerUser?.email;
  if (to) sendMail({ to, subject: `New inquiry ${inq.refNo}${productName ? ` for ${productName}` : ''}`, html: await emailHtml('You have a new inquiry', `${inq.name} is interested in your products. Reply quickly — buyers usually choose the first good answer.`, rows, { label: 'Reply in your dashboard', href: `/seller/inquiries/${inq.id}` }), replyTo: inq.email || undefined }).catch(() => null);
  if (inq.email) sendMail({ to: inq.email, subject: `Your inquiry ${inq.refNo} was sent to ${seller.companyName}`, html: await emailHtml('Inquiry sent', `We delivered your inquiry to ${seller.companyName}. They will reply by email, WhatsApp or in your SHRIJAIV dashboard.`, rows) }).catch(() => null);
}

/** New inquiry: admins always hear about it; the seller only when it is not held for review */
export async function onNewInquiry(inq: InqLite, seller: SellerLite, productName?: string | null, held = false) {
  const rows = inqRows(inq, productName);
  await notifyAdmins({ type: 'inquiry', title: `${held ? 'Review: ' : ''}Inquiry ${inq.refNo}: ${inq.name} → ${seller.companyName}`, body: inq.message.slice(0, 140), href: `/admin/inquiries/${inq.id}` });
  notifyAdmin(`${held ? '[Needs review] ' : ''}New inquiry ${inq.refNo}: ${inq.name} → ${seller.companyName}`, rowsTable(rows), inq.email || undefined, 'leads');
  if (!held) return deliverInquiry(inq, seller, productName);
  if (inq.email) sendMail({ to: inq.email, subject: `We received your inquiry ${inq.refNo}`, html: await emailHtml('Inquiry received', `Thank you! Our team checks every inquiry and forwards it to ${seller.companyName} shortly — usually within a few working hours.`, rows) }).catch(() => null);
}
