import Link from 'next/link';
import { Megaphone } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireSeller } from '@/lib/auth';
import { listRequirements, getCategoryTree, flattenTree, getCategory, inr } from '@/lib/marketplace/data';
import { PageTitle } from '@/components/admin/ui';
import { StatusPill } from '@/components/dashboard/fields';
import Pagination from '@/components/market/Pagination';
import { formatDate } from '@/lib/utils';

export default async function SellerLeads({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { seller } = (await requireSeller())!;
  const sp = await searchParams;
  const tree = await getCategoryTree();
  const cat = sp.cat ? await getCategory(sp.cat) : null;
  const mine = sp.tab === 'mine';
  const myQuotes = await prisma.quote.findMany({ where: { sellerId: seller.id }, include: { requirement: { include: { category: { select: { name: true } } } } }, orderBy: { createdAt: 'desc' }, take: 200 });
  const quotedIds = new Set(myQuotes.map((q) => q.requirementId));
  const res = mine ? null : await listRequirements({ q: sp.q, categoryIds: cat?.ids, state: sp.state, page: Number(sp.page) || 1 });
  return (
    <>
      <PageTitle title="Buy leads" subtitle="Requirements posted by buyers. Send a quote with your price and delivery time — the buyer compares and picks." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/seller/leads" className={`rounded-full px-3 py-1.5 text-xs font-bold ${!mine ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>Open leads</Link>
        <Link href="/seller/leads?tab=mine" className={`rounded-full px-3 py-1.5 text-xs font-bold ${mine ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>My quotes ({myQuotes.length})</Link>
        {!mine && (
          <form className="ml-auto flex gap-2">
            <input name="q" defaultValue={sp.q || ''} placeholder="Search…" className="admin-input !w-44 !py-1.5 text-sm" />
            <select name="cat" defaultValue={sp.cat || ''} className="admin-input !w-48 !py-1.5 text-sm">
              <option value="">All categories</option>
              {flattenTree(tree).map((c) => (
                <option key={c.slug} value={c.slug}>{c.parentId ? `– ${c.name}` : c.name}</option>
              ))}
            </select>
            <button className="btn btn-outline btn-sm">Filter</button>
          </form>
        )}
      </div>
      {mine ? (
        <div className="rounded-2xl bg-white ring-1 ring-gray-200/70">
          {myQuotes.length === 0 ? <p className="p-10 text-center text-sm text-gray-400">You have not sent any quotes yet.</p> : (
            <ul className="divide-y divide-gray-100">
              {myQuotes.map((q) => (
                <li key={q.id}>
                  <Link href={`/seller/leads/${q.requirementId}`} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900">{q.requirement.title}</p>
                      <p className="truncate text-xs text-gray-500">{q.requirement.category?.name || ''} · your quote: {q.price != null ? `${inr(q.price)} ${q.priceUnit || ''}` : 'on request'}{q.deliveryTime ? ` · ${q.deliveryTime}` : ''}</p>
                    </div>
                    <StatusPill status={q.status} />
                    <span className="hidden text-xs text-gray-400 sm:block">{formatDate(q.updatedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          {res!.items.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-gray-200/70">
              <Megaphone className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No open requirements match. Check back soon — buyers post daily.</p>
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {res!.items.map((r) => (
                <li key={r.id}>
                  <Link href={`/seller/leads/${r.id}`} className="flex h-full flex-col rounded-2xl bg-white p-5 ring-1 ring-gray-200/70 transition hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {r.category && <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-gold-deep">{r.category.name}</p>}
                        <p className="mt-1 line-clamp-2 font-semibold text-gray-900">{r.title}</p>
                      </div>
                      {quotedIds.has(r.id) ? <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.6rem] font-extrabold uppercase text-emerald-700">Quoted</span> : r.featured ? <span className="shrink-0 rounded-full bg-amber-400 px-2 py-0.5 text-[0.6rem] font-extrabold uppercase text-amber-950">Hot</span> : null}
                    </div>
                    {r.details && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{r.details}</p>}
                    <p className="mt-auto pt-3 text-xs text-gray-500">
                      {r.quantity ? `${r.quantity} ${r.unit || ''} · ` : ''}{[r.deliveryCity, r.deliveryState].filter(Boolean).join(', ') || r.buyer.state || ''} · {formatDate(r.createdAt)} · {r.quoteCount} quotes
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Pagination page={res!.page} pages={res!.pages} base="/seller/leads" params={sp} />
        </>
      )}
    </>
  );
}
