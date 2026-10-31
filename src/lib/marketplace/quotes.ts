import { prisma } from '@/lib/db';
import { sendMail } from '@/lib/mail';
import { emailHtml, notifyUser } from './notify';
import { inr } from './format';

/** Tell the buyer about a quote (immediately, or when the admin forwards it) */
export async function deliverQuote(quoteId: string) {
  const q = await prisma.quote.findUnique({ where: { id: quoteId }, include: { seller: { select: { companyName: true, email: true, user: { select: { email: true } } } }, requirement: { include: { buyer: { include: { user: { select: { email: true } } } } } } } });
  if (!q) return;
  const r = q.requirement;
  const rows: [string, string | null | undefined][] = [['Requirement', r.title], ['Seller', q.seller.companyName], ['Price', q.price != null ? `${inr(q.price)} ${q.priceUnit || ''}` : 'On request'], ['Delivery', q.deliveryTime], ['Message', q.message]];
  await notifyUser(r.buyer.userId, { type: 'quote', title: `New quote from ${q.seller.companyName}`, body: `${r.title} · ${q.price != null ? inr(q.price) : 'price on request'}`, href: `/buyer/requirements/${r.id}` });
  if (r.buyer.user?.email) sendMail({ to: r.buyer.user.email, subject: `New quote for "${r.title}" from ${q.seller.companyName}`, html: await emailHtml('You received a quote', `${q.seller.companyName} sent a quote for your requirement. Compare all quotes in your dashboard.`, rows, { label: 'Compare quotes', href: `/buyer/requirements/${r.id}` }), replyTo: q.seller.email || q.seller.user?.email || undefined }).catch(() => null);
}
