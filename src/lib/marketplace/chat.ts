// Buyer ⇄ seller chat on an inquiry. With "Chat messages go to admin first" switched on (default), every
// message waits in Admin → Forward inquiry until the admin approves it — unless the admin allowed direct chat
// for that conversation. Contact details inside messages stay masked while contacts are private.
import { prisma } from '@/lib/db';
import { sendMail } from '@/lib/mail';
import { getMarketplace } from './settings';
import { emailHtml, notifyUser, notifyAdmins } from './notify';
import { maskContacts } from './unlocks';

export async function needsApproval(inq: { directChat: boolean }) {
  const mp = await getMarketplace();
  return !!mp.approval.messages && !inq.directChat;
}

/** May the buyer of this inquiry see the seller's contact details? */
async function buyerSeesSeller(inq: { buyerId: string | null; sellerId: string }) {
  const mp = await getMarketplace();
  if (!mp.leads.enabled) return true;
  if (!inq.buyerId) return false;
  const b = await prisma.buyerProfile.findUnique({ where: { id: inq.buyerId }, select: { userId: true } });
  if (!b) return false;
  return !!(await prisma.unlock.findUnique({ where: { userId_kind_targetId: { userId: b.userId, kind: 'seller', targetId: inq.sellerId } }, select: { id: true } }));
}

/** Tell the other side about an (approved) message: dashboard notification + email */
export async function deliverMessage(messageId: string) {
  const m = await prisma.inquiryMessage.findUnique({
    where: { id: messageId },
    include: { inquiry: { include: { seller: { select: { userId: true, companyName: true, email: true, user: { select: { email: true } } } }, buyer: { select: { userId: true } }, product: { select: { name: true } } } } },
  });
  if (!m) return;
  const inq = m.inquiry;
  const mp = await getMarketplace();
  if (m.senderRole === 'seller') {
    const body = (await buyerSeesSeller(inq)) ? m.body : maskContacts(m.body);
    await prisma.inquiry.update({ where: { id: inq.id }, data: { seenByBuyer: false, lastMessageAt: new Date() } });
    await notifyUser(inq.buyer?.userId, { type: 'message', title: `${inq.seller.companyName} replied${inq.product ? ` · ${inq.product.name}` : ''}`, body: body.slice(0, 140), href: `/buyer/inquiries/${inq.id}` });
    if (inq.email) sendMail({ to: inq.email, subject: `Reply from ${inq.seller.companyName} — ${inq.refNo}`, html: await emailHtml(`${inq.seller.companyName} replied to your inquiry`, body, [['Reference', inq.refNo], ['Product', inq.product?.name]], inq.buyerId ? { label: 'Open conversation', href: `/buyer/inquiries/${inq.id}` } : undefined) }).catch(() => null);
  } else if (m.senderRole === 'buyer') {
    const body = !mp.leads.enabled || inq.contactUnlocked ? m.body : maskContacts(m.body);
    await prisma.inquiry.update({ where: { id: inq.id }, data: { seenBySeller: false, lastMessageAt: new Date() } });
    await notifyUser(inq.seller.userId, { type: 'message', title: `The buyer replied${inq.product ? ` · ${inq.product.name}` : ''}`, body: body.slice(0, 140), href: `/seller/inquiries/${inq.id}` });
    const to = inq.seller.email || inq.seller.user.email;
    if (to) sendMail({ to, subject: `New message on inquiry ${inq.refNo}`, html: await emailHtml('The buyer sent a message', body, [['Reference', inq.refNo], ['Product', inq.product?.name]], { label: 'Reply', href: `/seller/inquiries/${inq.id}` }) }).catch(() => null);
  }
}

/** Saves a buyer / seller message: held for the admin, or delivered at once */
export async function postMessage(inq: { id: string; refNo: string; directChat: boolean }, sender: { userId: string; role: 'buyer' | 'seller'; name: string }, body: string, attachments: string[]) {
  const held = await needsApproval(inq);
  const msg = await prisma.inquiryMessage.create({ data: { inquiryId: inq.id, senderId: sender.userId, senderRole: sender.role, body, attachments: JSON.stringify(attachments), status: held ? 'pending' : 'approved' } });
  await prisma.inquiry.update({ where: { id: inq.id }, data: { lastMessageAt: new Date(), ...(held ? { seenByAdmin: false } : {}) } });
  if (held) await notifyAdmins({ type: 'message', title: `Review: message from the ${sender.role} · ${inq.refNo}`, body: body.slice(0, 140), href: '/admin/review' });
  else await deliverMessage(msg.id);
  return { msg, held };
}

type ViewMsg = { senderRole: string; body: string; status?: string | null };
/** What one side may see of a thread: approved messages (+ its own pending / rejected ones), contacts masked while private */
export function visibleTo<T extends ViewMsg>(messages: T[], viewer: 'buyer' | 'seller', canSeeContacts: boolean): T[] {
  return messages
    .filter((m) => m.senderRole === viewer || !m.status || m.status === 'approved')
    .map((m) => (canSeeContacts || m.senderRole === viewer || m.senderRole === 'admin' ? m : { ...m, body: maskContacts(m.body) }));
}

export { buyerSeesSeller };
