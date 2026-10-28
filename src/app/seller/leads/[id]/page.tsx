import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Package, Wallet, Calendar, BadgeCheck, Mail, Phone } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireSeller } from '@/lib/auth';
import { inr } from '@/lib/marketplace/data';
import { getMarketplace } from '@/lib/marketplace/settings';
import { formatDate, waLink } from '@/lib/utils';
import QuoteForm from '@/components/seller/QuoteForm';
import { StatusPill } from '@/components/dashboard/fields';

export default async function SellerLead({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { seller } = (await requireSeller())!;
  const [r, mp] = await Promise.all([prisma.requirement.findFirst({ where: { id }, include: { category: { select: { name: true } }, buyer: { include: { user: { select: { name: true, email: true, phone: true } } } }, quotes: { where: { sellerId: seller.id } } } }), getMarketplace()]);
  if (!r) notFound();
  const mine = r.quotes[0] || null;
  const showContact = !!mine; // buyer contact after quoting
  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/seller/leads" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> Buy leads</Link>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200/70">
            <div className="flex flex-wrap items-center gap-2">
              {r.category && <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-gold-deep">{r.category.name}</span>}
              <StatusPill status={r.status} />
              <span className="text-xs text-gray-400">Posted {formatDate(r.createdAt)} · {r.quoteCount} quotes</span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">{r.title}</h1>
            <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                [Package, 'Quantity', r.quantity ? `${r.quantity} ${r.unit || ''}` : null],
                [Wallet, 'Budget', r.budgetMin != null || r.budgetMax != null ? `${r.budgetMin != null ? inr(r.budgetMin) : ''}${r.budgetMin != null && r.budgetMax != null ? ' – ' : ''}${r.budgetMax != null ? inr(r.budgetMax) : ''}` : null],
                [MapPin, 'Delivery to', [r.deliveryCity, r.deliveryState].filter(Boolean).join(', ') || null],
                [Calendar, 'Needed by', r.neededBy ? formatDate(r.neededBy) : null],
              ]
                .filter((x) => x[2])
                .map(([I, k, v]: any) => (
                  <div key={k} className="flex gap-2">
                    <I className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                    <div>
                      <dt className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">{k}</dt>
                      <dd className="font-semibold text-gray-900">{v}</dd>
                    </div>
                  </div>
                ))}
            </dl>
            {r.details && <p className="mt-5 whitespace-pre-line text-[0.95rem] leading-relaxed text-gray-700">{r.details}</p>}
          </div>
          <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200/70">
            <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-gray-400">Buyer</p>
            <p className="mt-1 flex items-center gap-1 font-bold text-gray-900">{r.buyer.companyName || r.buyer.user.name} {r.buyer.verified && <BadgeCheck className="h-4 w-4 text-emerald-600" />}</p>
            <p className="text-sm text-gray-600">{r.buyer.buyerType || 'Buyer'}{r.buyer.city || r.buyer.state ? ` · ${[r.buyer.city, r.buyer.state].filter(Boolean).join(', ')}` : ''}</p>
            {showContact && mp.showBuyerContactToSeller ? (
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {r.buyer.user.email && <a href={`mailto:${r.buyer.user.email}`} className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 font-semibold text-gray-700"><Mail className="h-4 w-4" /> {r.buyer.user.email}</a>}
                {(r.buyer.phone || r.buyer.user.phone) && <a href={`tel:${r.buyer.phone || r.buyer.user.phone}`} className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 font-semibold text-gray-700"><Phone className="h-4 w-4" /> {r.buyer.phone || r.buyer.user.phone}</a>}
                {(r.buyer.whatsapp || r.buyer.phone) && <a href={waLink(r.buyer.whatsapp || r.buyer.phone || '', `Hello, this is ${seller.companyName} from SHRIJAIV about your requirement "${r.title}".`)} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">WhatsApp</a>}
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-500">Buyer contact details appear after you send a quote.</p>
            )}
          </div>
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
            <p className="font-bold text-gray-900">{mine ? 'Your quote' : 'Send your quote'}</p>
            {mine && <p className="mt-0.5 text-xs text-gray-500">Status: <StatusPill status={mine.status} /> · you can update it below</p>}
            {r.status !== 'open' ? <p className="mt-3 text-sm text-gray-500">This requirement is closed.</p> : seller.status !== 'approved' ? <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Your seller account must be approved before you can quote.</p> : (
              <QuoteForm requirementId={r.id} initial={mine ? JSON.parse(JSON.stringify(mine)) : null} units={mp.units} defaultUnit={r.unit} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
