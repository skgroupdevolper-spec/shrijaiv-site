import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireStaff } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Polled by the admin panel every few seconds for real-time badges & toasts
export async function GET() {
  const s = await requireStaff();
  if (!s) return fail('Unauthorized', 401);
  const [newLeads, newApps, unreadMsgs, latestLeads, latestApps, latestMsgs] = await Promise.all([
    prisma.lead.count({ where: { seen: false } }),
    prisma.application.count({ where: { seen: false } }),
    prisma.message.count({ where: { fromAdmin: false, read: false } }),
    prisma.lead.findMany({ where: { seen: false }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, service: true, createdAt: true } }),
    prisma.application.findMany({ where: { seen: false }, orderBy: { updatedAt: 'desc' }, take: 5, select: { id: true, refNo: true, fullName: true, service: true, updatedAt: true } }),
    prisma.message.findMany({ where: { fromAdmin: false, read: false }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, body: true, createdAt: true, applicationId: true, application: { select: { refNo: true, fullName: true } } } }),
  ]);
  const [pendingSellers, pendingProducts, newInquiries, pendingReviews, latest] = await Promise.all([
    prisma.sellerProfile.count({ where: { status: 'pending' } }),
    prisma.product.count({ where: { status: 'pending' } }),
    prisma.inquiry.count({ where: { seenByAdmin: false } }),
    prisma.review.count({ where: { status: 'pending' } }),
    prisma.notification.findMany({ where: { userId: null }, orderBy: { createdAt: 'desc' }, take: 12 }),
  ]);
  const unreadNotes = latest.filter((n) => !n.read).length;
  return ok({ newLeads, newApps, unreadMsgs, latestLeads, latestApps, latestMsgs, pendingSellers, pendingProducts, newInquiries, pendingReviews, latest, unreadNotes, at: Date.now() });
}

/** Mark admin notifications as read */
export async function PUT() {
  const s = await requireStaff();
  if (!s) return fail('Unauthorized', 401);
  await prisma.notification.updateMany({ where: { userId: null, read: false }, data: { read: true } });
  return ok();
}
