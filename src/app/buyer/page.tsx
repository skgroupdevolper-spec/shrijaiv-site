import Link from 'next/link';
import { Megaphone, Inbox, FileText, Heart, PlusCircle, Search, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireBuyer } from '@/lib/auth';
import { Stat } from '@/components/dashboard/Stat';
import { Card, PageTitle } from '@/components/admin/ui';
import { formatDate } from '@/lib/utils';

export default async function BuyerOverview() {
  const { session, buyer } = (await requireBuyer())!;
  const [requirements, openReq, inquiries, quotes, favourites, latestQuotes, latestInq] = await Promise.all([
    prisma.requirement.count({ where: { buyerId: buyer.id } }),
    prisma.requirement.count({ where: { buyerId: buyer.id, status: 'open' } }),
    prisma.inquiry.count({ where: { buyerId: buyer.id } }),
    prisma.quote.count({ where: { requirement: { buyerId: buyer.id } } }),
    prisma.favourite.count({ where: { buyerId: buyer.id } }),
    prisma.quote.findMany({ where: { requirement: { buyerId: buyer.id } }, orderBy: { createdAt: 'desc' }, take: 5, include: { seller: { select: { companyName: true, slug: true, verified: true } }, requirement: { select: { title: true, id: true } } } }),
    prisma.inquiry.findMany({ where: { buyerId: buyer.id }, orderBy: { lastMessageAt: 'desc' }, take: 5, include: { seller: { select: { companyName: true } }, product: { select: { name: true } } } }),
  ]);
  return (
    <>
      <PageTitle
        title={`Namaste, ${session.name.split(' ')[0]}`}
        subtitle="Post what you need and let verified organic sellers come to you."
        actions={
          <>
            <Link href="/buyer/requirements/new" className="btn btn-gold"><PlusCircle className="h-4 w-4" /> Post a requirement</Link>
            <Link href="/products" className="btn btn-outline"><Search className="h-4 w-4" /> Browse products</Link>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Requirements" value={requirements} hint={`${openReq} open`} icon={Megaphone} href="/buyer/requirements" />
        <Stat label="Quotes received" value={quotes} icon={FileText} href="/buyer/quotes" tone="amber" />
        <Stat label="Inquiries sent" value={inquiries} icon={Inbox} href="/buyer/inquiries" tone="blue" />
        <Stat label="Favourites" value={favourites} icon={Heart} href="/buyer/favourites" tone="rose" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Latest quotes" actions={<Link href="/buyer/quotes" className="text-xs font-bold text-gold-deep">All quotes →</Link>}>
          {latestQuotes.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">No quotes yet. Post a requirement and sellers will send you their best prices.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {latestQuotes.map((q) => (
                <li key={q.id}>
                  <Link href={`/buyer/requirements/${q.requirement.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{q.seller.companyName}{q.seller.verified ? ' ✓' : ''} · {q.requirement.title}</p>
                      <p className="truncate text-xs text-gray-500">{q.price ? `₹${q.price.toLocaleString('en-IN')} ${q.priceUnit || ''}` : 'Price on request'}{q.deliveryTime ? ` · ${q.deliveryTime}` : ''}</p>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(q.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="My inquiries" actions={<Link href="/buyer/inquiries" className="text-xs font-bold text-gold-deep">All inquiries →</Link>}>
          {latestInq.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">You have not contacted any seller yet. <Link href="/products" className="font-bold text-gold-deep">Browse products <ArrowRight className="inline h-3 w-3" /></Link></p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {latestInq.map((q) => (
                <li key={q.id}>
                  <Link href={`/buyer/inquiries/${q.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${q.seenByBuyer ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{q.seller.companyName}{q.product ? ` · ${q.product.name}` : ''}</p>
                      <p className="truncate text-xs text-gray-500">{q.status}</p>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(q.lastMessageAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
