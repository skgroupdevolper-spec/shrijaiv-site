import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireBuyer, startSession } from '@/lib/auth';
import { getMarketplace, uniqueSlug } from '@/lib/marketplace/settings';
import { notifyAdmins } from '@/lib/marketplace/notify';
import { notifyAdmin, rowsTable } from '@/lib/mail';

/** "Update account to Vendor": a buyer account becomes a seller account (buyer data is kept) */
export async function POST(req: Request) {
  const ctx = await requireBuyer();
  if (!ctx) return fail('Please sign in as a buyer', 401);
  const b = await req.json().catch(() => ({}));
  const firstName = String(b.firstName || '').trim();
  const lastName = String(b.lastName || '').trim();
  const shop = String(b.shopName || '').trim().slice(0, 120);
  const phone = String(b.phone || '').replace(/[^\d+]/g, '');
  if (!firstName || !lastName) return fail('Please enter your first and last name');
  if (!shop) return fail('Please enter your shop / company name');
  if (phone.replace(/\D/g, '').length < 10) return fail('Please enter a valid phone number');
  if (!b.agree) return fail('Please accept the Terms & Conditions');
  const user = await prisma.user.findUnique({ where: { id: ctx.session.sub }, include: { seller: true } });
  if (!user) return fail('Account not found', 404);
  if (!user.seller) {
    const wanted = String(b.shopUrl || shop).toLowerCase();
    const slug = await uniqueSlug(wanted, async (s) => !!(await prisma.sellerProfile.findUnique({ where: { slug: s }, select: { id: true } })));
    const mp = await getMarketplace();
    await prisma.sellerProfile.create({
      data: { userId: user.id, slug, companyName: shop, phone, whatsapp: phone, email: user.email, city: ctx.buyer.city, state: ctx.buyer.state, address: ctx.buyer.address, pincode: ctx.buyer.pincode, gstNumber: ctx.buyer.gstNumber, status: mp.approval.sellers ? 'pending' : 'approved' },
    });
  }
  const updated = await prisma.user.update({ where: { id: user.id }, data: { role: 'SELLER', name: `${firstName} ${lastName}`.slice(0, 80), phone } });
  await startSession(updated);
  await notifyAdmins({ type: 'seller', title: `Buyer upgraded to seller: ${shop}`, body: `${updated.name} · ${updated.email}`, href: '/admin/sellers' });
  notifyAdmin(`Buyer upgraded to seller: ${shop}`, rowsTable([['Name', updated.name], ['Email', updated.email], ['Phone', phone], ['Shop', shop]]), updated.email, 'accounts');
  return ok({ ok: true, redirect: '/seller/profile' });
}
