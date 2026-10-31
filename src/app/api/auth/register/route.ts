import { prisma } from '@/lib/db';
import { ok, fail, rateLimit, clientIp, isEmail } from '@/lib/api';
import { hashPassword, startSession, homeFor } from '@/lib/auth';
import { notifyAdmin, rowsTable } from '@/lib/mail';
import { getMarketplace, uniqueSlug } from '@/lib/marketplace/settings';

/**
 * Creates a Buyer or Seller account (role "buyer" | "seller"; default buyer).
 * A seller gets a company profile (status "pending" when the admin approves sellers first).
 */
export async function POST(req: Request) {
  if (!rateLimit('register:' + clientIp(req), 5, 10 * 60_000)) return fail('Too many attempts. Please try later.', 429);
  const b = await req.json().catch(() => ({}));
  const role = String(b.role || 'buyer').toLowerCase() === 'seller' ? 'SELLER' : 'BUYER';
  const name = String(b.name || '').trim();
  const email = String(b.email || '').toLowerCase().trim();
  const password = String(b.password || '');
  const phone = String(b.phone || '').replace(/[^\d+]/g, '').trim();
  const company = String(b.company || '').trim();
  const city = String(b.city || '').trim();
  const state = String(b.state || '').trim();
  const type = String(b.type || '').trim();
  const str = (k: string, max = 200) => String(b[k] || '').trim().slice(0, max) || null;
  const gst = str('gst', 15)?.toUpperCase() || null;
  const fssai = str('fssai', 14);
  const whatsapp = String(b.whatsapp || '').replace(/[^\d+]/g, '').trim() || phone;
  const website = str('website');
  const address = str('address', 300);
  const pincode = str('pincode', 10);
  const deals = str('deals', 500);
  const services = str('services', 300);
  const turnover = str('turnover', 60);
  const certNames = String(b.certs || '').split(/[,;\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 10);
  const about = str('about', 2000) || ([deals ? `Supplier of: ${deals}.` : '', services ? `Trade services: ${services}.` : ''].filter(Boolean).join(' ') || null);
  const employees = str('employees', 20);
  const yearRaw = Number(b.year);
  const year = yearRaw >= 1900 && yearRaw <= new Date().getFullYear() ? yearRaw : null;
  const categories = Array.isArray(b.categories) ? b.categories.map(String).filter(Boolean).slice(0, 20) : [];
  if (!name) return fail('Please enter your name');
  if (!isEmail(email)) return fail('Please enter a valid email');
  if (!phone || phone.replace(/\D/g, '').length < 10) return fail('Please enter a valid mobile number');
  if (password.length < 8) return fail('Password must be at least 8 characters');
  if (role === 'SELLER' && !company) return fail('Please enter your company / farm / brand name');
  if (!b.agree) return fail('Please accept the Terms & Conditions');
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return fail('An account with this email already exists. Please log in.');

  const mp = await getMarketplace();
  const user = await prisma.user.create({ data: { name, email, phone, passwordHash: await hashPassword(password), role } });

  if (role === 'SELLER') {
    const slug = await uniqueSlug(company, async (s) => !!(await prisma.sellerProfile.findUnique({ where: { slug: s }, select: { id: true } })));
    await prisma.sellerProfile.create({
      data: { userId: user.id, slug, companyName: company, businessType: type || null, phone, whatsapp, email, city: city || null, state: state || null, gstNumber: gst, fssaiNumber: fssai, website, address, pincode, about, employees, yearEstablished: year, annualTurnover: turnover, certifications: JSON.stringify(certNames.map((name) => ({ name, number: '', file: '' }))), status: mp.approval.sellers ? 'pending' : 'approved' },
    });
  } else {
    await prisma.buyerProfile.create({ data: { userId: user.id, companyName: company || null, buyerType: type || null, phone, whatsapp, city: city || null, state: state || null, gstNumber: gst, address, pincode, interests: JSON.stringify(categories) } });
  }

  await prisma.notification.create({ data: { type: role === 'SELLER' ? 'seller' : 'buyer', title: `New ${role === 'SELLER' ? 'seller' : 'buyer'}: ${company || name}`, body: `${name} · ${email} · ${phone}${city ? ` · ${city}` : ''}${deals ? ` · ${role === 'SELLER' ? 'sells' : 'buys'}: ${deals}` : ''}`, href: role === 'SELLER' ? '/admin/sellers' : '/admin/buyers' } }).catch(() => null);
  await startSession(user);
  notifyAdmin(`New ${role === 'SELLER' ? 'seller' : 'buyer'} account: ${company || name}`, rowsTable([['Name', name], ['Company', company], ['Type', type], [role === 'SELLER' ? 'Supplier of' : 'Buyer of', deals], ['Email', email], ['Phone', phone], ['City', city], ['State', state], ['GST', gst]]), email, 'accounts');
  return ok({ ok: true, role, redirect: homeFor(role) });
}
