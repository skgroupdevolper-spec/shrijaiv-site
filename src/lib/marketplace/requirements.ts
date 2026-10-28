import { prisma } from '@/lib/db';

const str = (v: any, max = 200) => (v == null ? null : String(v).trim().slice(0, max) || null);
const num = (v: any) => (v === '' || v == null || isNaN(Number(v)) ? null : Math.max(0, Number(v)));

export async function normalizeRequirement(b: any) {
  const title = str(b.title, 160);
  if (!title || title.length < 5) throw new Error('Please describe what you need (at least 5 characters)');
  let categoryId: string | null = null;
  if (b.categoryId) categoryId = (await prisma.category.findUnique({ where: { id: String(b.categoryId) }, select: { id: true } }))?.id || null;
  const neededBy = b.neededBy ? new Date(b.neededBy) : null;
  return {
    title,
    details: b.details == null ? null : String(b.details).slice(0, 6000),
    categoryId,
    quantity: str(b.quantity, 80),
    unit: str(b.unit, 30),
    budgetMin: num(b.budgetMin),
    budgetMax: num(b.budgetMax),
    deliveryCity: str(b.deliveryCity, 80),
    deliveryState: str(b.deliveryState, 80),
    neededBy: neededBy && !isNaN(neededBy.getTime()) ? neededBy : null,
    attachments: JSON.stringify(Array.isArray(b.attachments) ? b.attachments.filter((x: any) => typeof x === 'string').slice(0, 5) : []),
  };
}

