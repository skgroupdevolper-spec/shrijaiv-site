import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireSeller } from '@/lib/auth';
import { entitlements } from '@/lib/marketplace/plans';
import { uniqueSlug } from '@/lib/marketplace/settings';
import { notifyAdmins } from '@/lib/marketplace/notify';
import { translateLater } from '@/lib/i18n/overlay';

export const dynamic = 'force-dynamic';
const str = (v: any, max = 200) => (v == null ? null : String(v).trim().slice(0, max) || null);

export async function GET() {
  const ctx = await requireSeller();
  if (!ctx) return fail('Unauthorized', 401);
  const [e, user] = await Promise.all([entitlements(ctx.seller.id), prisma.user.findUnique({ where: { id: ctx.session.sub }, select: { name: true, email: true, phone: true } })]);
  return ok({ item: ctx.seller, entitlements: e, user });
}

export async function PUT(req: Request) {
  const ctx = await requireSeller();
  if (!ctx) return fail('Unauthorized', 401);
  const b = await req.json().catch(() => ({}));
  const companyName = str(b.companyName, 160);
  if (!companyName || companyName.length < 2) return fail('Please enter your company name');
  const certs = Array.isArray(b.certifications) ? b.certifications.filter((c: any) => c && str(c.name, 80)).map((c: any) => ({ name: str(c.name, 80), number: str(c.number, 80), file: str(c.file, 500) })).slice(0, 12) : [];
  const certsChanged = JSON.stringify(certs) !== ctx.seller.certifications;
  const data: any = {
    companyName,
    about: b.about == null ? ctx.seller.about : String(b.about).slice(0, 20000),
    logo: str(b.logo, 500),
    banner: str(b.banner, 500),
    businessType: str(b.businessType, 60),
    gstNumber: str(b.gstNumber, 20),
    fssaiNumber: str(b.fssaiNumber, 20),
    yearEstablished: b.yearEstablished ? Math.min(new Date().getFullYear(), Math.max(1900, Number(b.yearEstablished) || 0)) || null : null,
    employees: str(b.employees, 40),
    annualTurnover: str(b.annualTurnover, 60),
    website: str(b.website, 200),
    phone: str(b.phone, 30),
    whatsapp: str(b.whatsapp, 30),
    email: str(b.email, 120),
    address: str(b.address, 400),
    city: str(b.city, 80),
    state: str(b.state, 80),
    pincode: str(b.pincode, 10),
    certifications: JSON.stringify(certs),
    metaTitle: str(b.metaTitle, 120),
    metaDescription: str(b.metaDescription, 200),
  };
  if (b.slug && b.slug !== ctx.seller.slug) {
    const wanted = String(b.slug).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    data.slug = await uniqueSlug(wanted || companyName, async (s) => !!(await prisma.sellerProfile.findFirst({ where: { slug: s, NOT: { id: ctx.seller.id } }, select: { id: true } })));
  }
  const item = await prisma.sellerProfile.update({ where: { id: ctx.seller.id }, data });
  translateLater('seller', item.id);
  if (certsChanged && certs.length) await notifyAdmins({ type: 'seller', title: `Verification documents from ${companyName}`, body: certs.map((c: any) => c.name).join(', '), href: `/admin/sellers/${ctx.seller.id}` });
  return ok({ item });
}
