import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BadgeCheck, ExternalLink, FileText } from 'lucide-react';
import { prisma } from '@/lib/db';
import { PageTitle, Card } from '@/components/admin/ui';
import SellerAdminActions from '@/components/admin/SellerAdminActions';
import { formatDate, formatDateTime } from '@/lib/utils';

export default async function AdminSeller({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await prisma.sellerProfile.findUnique({ where: { id }, include: { user: { select: { id: true, name: true, email: true, phone: true, active: true, lastLoginAt: true, createdAt: true } }, products: { orderBy: { updatedAt: 'desc' }, take: 50, select: { id: true, name: true, status: true, views: true, inquiryCount: true } }, subscriptions: { orderBy: { createdAt: 'desc' }, include: { plan: { select: { name: true } } }, take: 5 }, _count: { select: { inquiries: true, reviews: true, quotes: true } } } });
  if (!s) notFound();
  await prisma.sellerProfile.update({ where: { id }, data: { seen: true } });
  const certs: { name: string; number?: string; file?: string }[] = (() => { try { return JSON.parse(s.certifications || '[]'); } catch { return []; } })();
  return (
    <div className="max-w-5xl">
      <Link href="/admin/sellers" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> Sellers</Link>
      <PageTitle title={s.companyName} subtitle={`${s.businessType || 'Seller'} · ${[s.city, s.state].filter(Boolean).join(', ')} · joined ${formatDate(s.createdAt)}`} actions={<><a href={`/sellers/${s.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm"><ExternalLink className="h-4 w-4" /> Showroom</a><SellerAdminActions seller={{ id: s.id, status: s.status, verified: s.verified, featured: s.featured, adminNote: s.adminNote }} /></>} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Owner & contact">
          <dl className="grid grid-cols-[120px_1fr] gap-y-2 p-5 text-sm">
            <dt className="text-gray-400">Name</dt><dd className="font-semibold">{s.user.name}</dd>
            <dt className="text-gray-400">Login email</dt><dd>{s.user.email}</dd>
            <dt className="text-gray-400">Mobile</dt><dd>{s.user.phone || s.phone || '—'}</dd>
            <dt className="text-gray-400">WhatsApp</dt><dd>{s.whatsapp || '—'}</dd>
            <dt className="text-gray-400">Business email</dt><dd>{s.email || '—'}</dd>
            <dt className="text-gray-400">Website</dt><dd>{s.website ? <a href={s.website} target="_blank" rel="noopener noreferrer nofollow" className="text-gold-deep">{s.website}</a> : '—'}</dd>
            <dt className="text-gray-400">Address</dt><dd>{[s.address, s.city, s.state, s.pincode].filter(Boolean).join(', ') || '—'}</dd>
            <dt className="text-gray-400">Last login</dt><dd>{s.user.lastLoginAt ? formatDateTime(s.user.lastLoginAt) : 'never'}</dd>
            <dt className="text-gray-400">Activity</dt><dd>{s.products.length} products · {s._count.inquiries} inquiries · {s._count.quotes} quotes · {s._count.reviews} reviews · {s.views} views</dd>
          </dl>
        </Card>
        <Card title="Verification documents">
          <dl className="grid grid-cols-[120px_1fr] gap-y-2 p-5 pb-2 text-sm">
            <dt className="text-gray-400">Status</dt><dd className="font-semibold">{s.status} {s.verified && <span className="ml-1 inline-flex items-center gap-1 text-emerald-700"><BadgeCheck className="h-4 w-4" /> Verified {s.verifiedAt ? formatDate(s.verifiedAt) : ''}</span>}</dd>
            <dt className="text-gray-400">GST</dt><dd>{s.gstNumber || '—'}</dd>
            <dt className="text-gray-400">FSSAI</dt><dd>{s.fssaiNumber || '—'}</dd>
            <dt className="text-gray-400">Established</dt><dd>{s.yearEstablished || '—'} · {s.employees || '—'} employees · {s.annualTurnover || '—'}</dd>
          </dl>
          {certs.length === 0 ? <p className="px-5 pb-5 text-sm text-gray-400">No documents uploaded yet.</p> : (
            <ul className="divide-y divide-gray-100 border-t border-gray-100">
              {certs.map((c, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-2.5 text-sm"><FileText className="h-4 w-4 text-gray-400" /><span className="flex-1 font-semibold">{c.name}</span><span className="text-xs text-gray-500">{c.number}</span>{c.file ? <a href={c.file} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">Open</a> : <span className="text-xs text-gray-400">no file</span>}</li>
              ))}
            </ul>
          )}
          <p className="px-5 py-3 text-xs text-gray-400">Check NPOP numbers on APEDA TraceNet, PGS on pgsindia-ncof.gov.in, FSSAI on foscos.fssai.gov.in, GST on gst.gov.in.</p>
        </Card>
        <Card title="Products" className="lg:col-span-2">
          {s.products.length === 0 ? <p className="p-5 text-sm text-gray-400">No products.</p> : (
            <ul className="divide-y divide-gray-100">
              {s.products.map((p) => <li key={p.id} className="flex items-center gap-3 px-5 py-2 text-sm"><span className="flex-1 font-semibold">{p.name}</span><span className="text-xs text-gray-400">{p.views} views · {p.inquiryCount} inquiries</span><span className="rounded-full bg-gray-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase">{p.status}</span><Link href={`/admin/products?status=${p.status}`} className="text-xs font-bold text-gold-deep">Manage</Link></li>)}
            </ul>
          )}
        </Card>
        <Card title="Plans" className="lg:col-span-2">
          {s.subscriptions.length === 0 ? <p className="p-5 text-sm text-gray-400">No plan — free tier.</p> : (
            <ul className="divide-y divide-gray-100">
              {s.subscriptions.map((x) => <li key={x.id} className="flex items-center gap-3 px-5 py-2 text-sm"><span className="flex-1 font-semibold">{x.plan.name}</span><span className="text-xs text-gray-400">{formatDate(x.startsAt)} → {x.endsAt ? formatDate(x.endsAt) : 'lifetime'} · {x.source} · auto-renew {x.autoRenew ? 'on' : 'off'}</span><span className="rounded-full bg-gray-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase">{x.status}</span></li>)}
            </ul>
          )}
          <p className="px-5 py-3 text-xs text-gray-400">Activate a plan manually (bank transfer): Subscriptions → New is not available; use the "Activate plan" button above.</p>
        </Card>
      </div>
      {s.about && <Card title="About" className="mt-5"><div className="rte p-5 text-sm" dangerouslySetInnerHTML={{ __html: s.about }} /></Card>}
    </div>
  );
}
