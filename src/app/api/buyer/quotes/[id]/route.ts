import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireBuyer } from '@/lib/auth';
import { notifyUser } from '@/lib/marketplace/notify';

type P = { params: Promise<{ id: string }> };

/** Buyer acts on a quote: shortlist | accept | reject */
export async function PUT(req: Request, { params }: P) {
  const ctx = await requireBuyer();
  if (!ctx) return fail('Unauthorized', 401);
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const status = ['shortlisted', 'accepted', 'rejected', 'sent'].includes(b.status) ? b.status : null;
  if (!status) return fail('Invalid status');
  const q = await prisma.quote.findFirst({ where: { id, requirement: { buyerId: ctx.buyer.id } }, include: { seller: { select: { userId: true, companyName: true } }, requirement: { select: { id: true, title: true } } } });
  if (!q) return fail('Not found', 404);
  const item = await prisma.quote.update({ where: { id }, data: { status, seenByBuyer: true } });
  if (status === 'accepted') {
    await notifyUser(q.seller.userId, { type: 'quote', title: `🎉 Your quote was accepted: ${q.requirement.title}`, body: 'The buyer will contact you. You can also reach them from the lead page.', href: `/seller/leads/${q.requirement.id}` });
  } else if (status === 'shortlisted') {
    await notifyUser(q.seller.userId, { type: 'quote', title: `Your quote was shortlisted: ${q.requirement.title}`, href: `/seller/leads/${q.requirement.id}` });
  }
  return ok({ item });
}
