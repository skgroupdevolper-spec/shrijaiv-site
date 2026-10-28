import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireBuyer } from '@/lib/auth';

const str = (v: any, max = 200) => (v == null ? null : String(v).trim().slice(0, max) || null);

export async function PUT(req: Request) {
  const ctx = await requireBuyer();
  if (!ctx) return fail('Unauthorized', 401);
  const b = await req.json().catch(() => ({}));
  const item = await prisma.buyerProfile.update({
    where: { id: ctx.buyer.id },
    data: { companyName: str(b.companyName, 160), buyerType: str(b.buyerType, 60), gstNumber: str(b.gstNumber, 20), phone: str(b.phone, 30), whatsapp: str(b.whatsapp, 30), address: str(b.address, 400), city: str(b.city, 80), state: str(b.state, 80), pincode: str(b.pincode, 10), interests: JSON.stringify(Array.isArray(b.interests) ? b.interests.filter((x: any) => typeof x === 'string').slice(0, 30) : []) },
  });
  return ok({ item });
}
