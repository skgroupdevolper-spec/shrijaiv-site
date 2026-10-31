import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BadgeCheck, FileText, Pencil } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireBuyer } from '@/lib/auth';
import { inr } from '@/lib/marketplace/data';
import { getMarketplace } from '@/lib/marketplace/settings';
import { formatDate, waLink } from '@/lib/utils';
import { StatusPill } from '@/components/dashboard/fields';
import { Rating } from '@/components/market/Rating';
import QuoteActions from '@/components/buyer/QuoteActions';
import RequirementActions from '@/components/buyer/RequirementActions';
import RequirementForm from '@/components/buyer/RequirementForm';

export default async function BuyerRequirement({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string }> }) {
  const { id } = await params;
  const { edit } = await searchParams;
  const { buyer } = (await requireBuyer())!;
  const r = await prisma.requirement.findFirst({ where: { id, buyerId: buyer.id }, include: { category: { select: { name: true } }, quotes: { where: { status: { notIn: ['review', 'rejected'] } }, orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], include: { seller: { select: { slug: true, companyName: true, verified: true, city: true, state: true, ratingAvg: true, ratingCount: true, logo: true, phone: true, whatsapp: true, email: true, user: { select: { email: true } } } } } } } });
  if (!r) notFound();
  await prisma.quote.updateMany({ where: { requirementId: id, seenByBuyer: false }, data: { seenByBuyer: true } });
  if (edit === '1') {
    const [cats, mp] = await Promise.all([prisma.category.findMany({ where: { active: true }, orderBy: [{ order: 'asc' }, { name: 'asc' }], select: { id: true, name: true, parentId: true } }), getMarketplace()]);
    return (
      <>
        <Link href={`/buyer/requirements/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <RequirementForm initial={JSON.parse(JSON.stringify(r))} categories={cats} units={mp.units} />
      </>
    );
  }
  const accepted = r.quotes.find((q) => q.status === 'accepted');
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/buyer/requirements" className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> Requirements</Link>
        <StatusPill status={r.status} />
        <span className="text-xs text-gray-400">posted {formatDate(r.createdAt)} · {r.views} views</span>
        <div className="ml-auto flex gap-2">
          {r.status === 'open' && <Link href={`/buyer/requirements/${id}?edit=1`} className="btn btn-outline btn-sm"><Pencil className="h-4 w-4" /> Edit</Link>}
          <RequirementActions id={r.id} status={r.status} />
        </div>
      </div>
      <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200/70">
        {r.category && <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-gold-deep">{r.category.name}</p>}
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">{r.title}</h1>
        <p className="mt-2 text-sm text-gray-600">{r.quantity ? `${r.quantity} ${r.unit || ''} · ` : ''}{r.budgetMin != null || r.budgetMax != null ? `Budget ${r.budgetMin != null ? inr(r.budgetMin) : ''}${r.budgetMin != null && r.budgetMax != null ? ' – ' : ''}${r.budgetMax != null ? inr(r.budgetMax) : ''} · ` : ''}{[r.deliveryCity, r.deliveryState].filter(Boolean).join(', ')}{r.neededBy ? ` · by ${formatDate(r.neededBy)}` : ''}</p>
        {r.details && <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{r.details}</p>}
      </div>

      <h2 className="mt-8 flex items-center gap-2 text-lg font-extrabold text-gray-900"><FileText className="h-5 w-5 text-gold-deep" /> Quotes ({r.quotes.length})</h2>
      {r.quotes.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-white p-8 text-center text-sm text-gray-500 ring-1 ring-gray-200/70">No quotes yet. Sellers are notified — most quotes arrive within 24 hours.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl bg-white ring-1 ring-gray-200/70">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-[0.65rem] uppercase tracking-wider text-gray-400"><tr><th className="px-4 py-2">Seller</th><th className="px-3 py-2">Price</th><th className="px-3 py-2">Quantity</th><th className="px-3 py-2">Delivery</th><th className="px-3 py-2">Message</th><th className="px-4 py-2 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {r.quotes.map((q) => (
                <tr key={q.id} className={q.status === 'accepted' ? 'bg-emerald-50/60' : q.status === 'rejected' ? 'opacity-50' : ''}>
                  <td className="px-4 py-3 align-top">
                    <Link href={`/sellers/${q.seller.slug}`} target="_blank" className="flex items-center gap-1 font-semibold text-gray-900 hover:text-gold-deep">{q.seller.companyName} {q.seller.verified && <BadgeCheck className="h-4 w-4 text-emerald-600" />}</Link>
                    <p className="text-xs text-gray-500">{[q.seller.city, q.seller.state].filter(Boolean).join(', ')}</p>
                    <Rating value={q.seller.ratingAvg} count={q.seller.ratingCount} />
                    {(q.status === 'accepted' || q.status === 'shortlisted') && (
                      <div className="mt-1 flex flex-wrap gap-1 text-xs">
                        {(q.seller.email || q.seller.user.email) && <a href={`mailto:${q.seller.email || q.seller.user.email}`} className="rounded bg-gray-100 px-2 py-0.5 font-semibold">Email</a>}
                        {q.seller.phone && <a href={`tel:${q.seller.phone}`} className="rounded bg-gray-100 px-2 py-0.5 font-semibold">{q.seller.phone}</a>}
                        {(q.seller.whatsapp || q.seller.phone) && <a href={waLink(q.seller.whatsapp || q.seller.phone || '', `Hello ${q.seller.companyName}, about your quote on "${r.title}" (SHRIJAIV).`)} target="_blank" rel="noopener noreferrer" className="rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">WhatsApp</a>}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top font-bold text-gray-900">{q.price != null ? `${inr(q.price)} ${q.priceUnit || ''}` : 'On request'}</td>
                  <td className="px-3 py-3 align-top">{q.quantity || '—'}</td>
                  <td className="px-3 py-3 align-top">{q.deliveryTime || '—'}</td>
                  <td className="max-w-[260px] px-3 py-3 align-top text-gray-600"><p className="line-clamp-4 whitespace-pre-line">{q.message || '—'}</p>{(() => { try { const a = JSON.parse(q.attachments || '[]'); return a[0] ? <a href={a[0]} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gold-deep">Attachment</a> : null; } catch { return null; } })()}<p className="mt-1 text-[0.65rem] text-gray-400">{formatDate(q.createdAt)}</p></td>
                  <td className="px-4 py-3 text-right align-top"><QuoteActions id={q.id} status={q.status} disabled={!!accepted && q.status !== 'accepted'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
