import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireSeller } from '@/lib/auth';

type P = { params: Promise<{ id: string }> };

/** Reply to a review (or flag it for the admin) */
export async function PUT(req: Request, { params }: P) {
  const ctx = await requireSeller();
  if (!ctx) return fail('Unauthorized', 401);
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const review = await prisma.review.findFirst({ where: { id, sellerId: ctx.seller.id } });
  if (!review) return fail('Not found', 404);
  if (b.flag) {
    await prisma.report.create({ data: { reporterId: ctx.session.sub, targetType: 'review', targetId: id, reason: String(b.reason || 'Seller flagged this review').slice(0, 200), details: String(b.details || '').slice(0, 2000) } });
    await prisma.notification.create({ data: { userId: null, type: 'review', title: `Review flagged by ${ctx.seller.companyName}`, href: '/admin/reviews' } }).catch(() => null);
    return ok({ ok: true });
  }
  const reply = String(b.reply || '').trim().slice(0, 2000);
  const item = await prisma.review.update({ where: { id }, data: { reply: reply || null, repliedAt: reply ? new Date() : null, seen: true } });
  return ok({ item });
}
