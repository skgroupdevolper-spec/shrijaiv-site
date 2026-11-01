import { prisma } from '@/lib/db';
import { ok, fail, rateLimit, clientIp } from '@/lib/api';
import { requireSeller } from '@/lib/auth';
import { SELLER_VISIBLE } from '@/lib/marketplace/moderation';
import { postMessage } from '@/lib/marketplace/chat';

type P = { params: Promise<{ id: string }> };

/** Seller replies in the inquiry thread → admin approval (when switched on) → buyer dashboard + email */
export async function POST(req: Request, { params }: P) {
  const ctx = await requireSeller();
  if (!ctx) return fail('Unauthorized', 401);
  if (!rateLimit('smsg:' + clientIp(req), 60, 10 * 60_000)) return fail('Too many messages', 429);
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const body = String(b.body || '').trim().slice(0, 4000);
  if (!body) return fail('Please write a message');
  const inq = await prisma.inquiry.findFirst({ where: { id, sellerId: ctx.seller.id, ...SELLER_VISIBLE } });
  if (!inq) return fail('Not found', 404);
  const attachments = Array.isArray(b.attachments) ? b.attachments.filter((x: any) => typeof x === 'string').slice(0, 5) : [];
  const { msg, held } = await postMessage(inq, { userId: ctx.session.sub, role: 'seller', name: ctx.seller.companyName }, body, attachments);
  if (inq.status === 'new') await prisma.inquiry.update({ where: { id }, data: { status: 'replied' } });
  return ok({ item: msg, held });
}
