// Side effects of admin edits on marketplace records (approvals, badges, ratings) + the audit log.
import { prisma } from '@/lib/db';
import { notifyUser } from './notify';
import { recomputeRating } from './reviews';
import { sendMail } from '@/lib/mail';
import { emailHtml } from './notify';

export async function audit(user: { id: string; name: string }, action: string, entity: string, entityId?: string | null, summary?: string, ip?: string) {
  await prisma.auditLog.create({ data: { userId: user.id, userName: user.name, action, entity, entityId: entityId || null, summary: summary ? String(summary).slice(0, 500) : null, ip: ip || null } }).catch(() => null);
}

export async function afterAdminUpdate(resource: string, id: string, before: any, data: any, admin: { id: string; name: string }) {
  const changed = Object.keys(data).filter((k) => before && before[k] !== data[k]);
  await audit(admin, 'update', resource, id, changed.length ? `changed ${changed.join(', ')}` : 'saved');

  if (resource === 'sellers') {
    const s = await prisma.sellerProfile.findUnique({ where: { id }, include: { user: { select: { id: true, email: true, name: true } } } });
    if (!s) return;
    if (data.verified === true && !before?.verified) {
      await prisma.sellerProfile.update({ where: { id }, data: { verifiedAt: new Date() } });
      await notifyUser(s.user.id, { type: 'seller', title: '✅ Your company is now Verified', body: 'The Verified badge appears on your showroom and products.', href: '/seller/profile' });
      if (s.user.email) sendMail({ to: s.user.email, subject: 'Your SHRIJAIV showroom is Verified ✅', html: await emailHtml('You are Verified!', `${s.companyName} passed our document check. The Verified badge now appears on your showroom and every product.`, [], { label: 'View showroom', href: `/sellers/${s.slug}` }) }).catch(() => null);
    }
    if (data.status && before?.status !== data.status) {
      const msg = data.status === 'approved' ? { t: '🎉 Your seller account is approved', b: 'Your products are now visible to buyers.' } : data.status === 'rejected' ? { t: 'Your seller account was not approved', b: data.adminNote || before?.adminNote || 'Please contact support for details.' } : data.status === 'suspended' ? { t: 'Your seller account is suspended', b: data.adminNote || 'Please contact support.' } : null;
      if (msg) {
        await notifyUser(s.user.id, { type: 'seller', title: msg.t, body: msg.b, href: '/seller' });
        if (s.user.email) sendMail({ to: s.user.email, subject: msg.t, html: await emailHtml(msg.t, msg.b, [], { label: 'Open dashboard', href: '/seller' }) }).catch(() => null);
      }
      if (data.status === 'approved') {
        // products that waited for the seller approval stay as they are (pending → approved by product moderation)
      }
    }
  }

  if (resource === 'products' && data.status && before?.status !== data.status) {
    const p = await prisma.product.findUnique({ where: { id }, include: { seller: { select: { userId: true } } } });
    if (!p) return;
    if (data.status === 'approved') await notifyUser(p.seller.userId, { type: 'product', title: `Product approved: ${p.name}`, href: `/products/${p.slug}` });
    if (data.status === 'rejected') await notifyUser(p.seller.userId, { type: 'product', title: `Product needs changes: ${p.name}`, body: data.adminNote || p.adminNote || 'Please check the listing.', href: `/seller/products/${p.id}` });
  }

  if (resource === 'reviews' && (data.status !== undefined || data.rating !== undefined)) {
    const r = await prisma.review.findUnique({ where: { id }, include: { seller: { select: { userId: true } } } });
    if (!r) return;
    await recomputeRating(r.sellerId, r.productId);
    if (data.status === 'approved' && before?.status !== 'approved') await notifyUser(r.seller.userId, { type: 'review', title: `${r.rating}★ new review from ${r.authorName}`, body: r.body.slice(0, 140), href: '/seller/reviews' });
  }

  if (resource === 'requirements' && data.status === 'open' && before?.status === 'pending') {
    const r = await prisma.requirement.findUnique({ where: { id }, include: { buyer: { select: { userId: true } } } });
    if (r) await notifyUser(r.buyer.userId, { type: 'requirement', title: `Your requirement is live: ${r.title}`, href: `/buyer/requirements/${r.id}` });
  }

  if (resource === 'buyers' && data.status && before?.status !== data.status) {
    const b = await prisma.buyerProfile.findUnique({ where: { id }, select: { userId: true } });
    if (b) await notifyUser(b.userId, { type: 'buyer', title: data.status === 'suspended' ? 'Your buyer account is suspended' : 'Your buyer account is active', href: '/buyer' });
  }

  if (resource === 'subscriptions' && data.status && before?.status !== data.status) {
    const sub = await prisma.subscription.findUnique({ where: { id }, include: { seller: { select: { userId: true } }, plan: { select: { name: true } } } });
    if (sub) await notifyUser(sub.seller.userId, { type: 'plan', title: `${sub.plan.name} plan is now ${data.status}`, href: '/seller/membership' });
  }
}
