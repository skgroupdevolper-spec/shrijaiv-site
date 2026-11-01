'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Send, X, Inbox, FileText, CheckCircle2, MessageSquare } from 'lucide-react';
import { Btn, PageTitle, Spinner, api, toast } from './ui';
import { formatDateTime } from '@/lib/utils';
import SellerPicker, { type PickSeller } from './SellerPicker';

type Item = { kind: 'inquiry' | 'quote' | 'message'; inquiryId?: string; id: string; at: string; title: string; to: string; toHref: string; from: string; contact: string; message: string; extra: string; seller?: PickSeller; suggest?: PickSeller[] };

/** Admin → Forward inquiry: forward inquiries to sellers and quotes to buyers (or reject them) */
export default function ReviewQueue() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');
  const [picked, setPicked] = useState<Record<string, PickSeller[]>>({});
  const load = () =>
    api<{ inquiries: any[]; quotes: any[]; messages?: any[] }>('/api/admin/review')
      .then((d) => {
        const a: Item[] = d.inquiries.map((q) => ({ kind: 'inquiry', id: q.id, at: q.createdAt, title: `Inquiry ${q.refNo}${q.product ? ` · ${q.product.name}` : ''}`, to: q.seller.companyName, toHref: `/admin/sellers/${q.seller.id}`, from: `${q.name}${q.company ? ` (${q.company})` : ''}`, contact: [q.email, q.phone, q.city].filter(Boolean).join(' · '), message: q.message, extra: q.quantity ? `Quantity: ${q.quantity}` : '', seller: { id: q.seller.id, companyName: q.seller.companyName }, suggest: q.suggest || [] }));
        const b: Item[] = d.quotes.map((q) => ({ kind: 'quote', id: q.id, at: q.createdAt, title: `Quote · ${q.requirement.title}`, to: q.requirement.buyer?.companyName || q.requirement.buyer?.user?.name || 'Buyer', toHref: `/admin/requirements`, from: q.seller.companyName, contact: [q.price != null ? `₹${q.price} ${q.priceUnit || ''}` : 'Price on request', q.quantity, q.deliveryTime].filter(Boolean).join(' · '), message: q.message || '', extra: '' }));
        const c: Item[] = (d.messages || []).map((m) => ({ kind: 'message', id: m.id, at: m.createdAt, title: `Chat message · ${m.inquiry.refNo}${m.inquiry.product ? ` · ${m.inquiry.product.name}` : ''}`, to: m.senderRole === 'buyer' ? m.inquiry.seller.companyName : m.inquiry.name, toHref: `/admin/inquiries/${m.inquiry.id}`, from: m.senderRole === 'buyer' ? `Buyer ${m.inquiry.name}` : `Seller ${m.inquiry.seller.companyName}`, contact: '', message: m.body, extra: m.senderRole === 'buyer' ? 'Buyer → seller' : 'Seller → buyer', inquiryId: m.inquiry.id }));
        setItems([...a, ...b, ...c].sort((x, y) => +new Date(x.at) - +new Date(y.at)));
      })
      .catch((e) => toast(e.message, 'error'));
  useEffect(() => {
    load();
  }, []);
  async function act(it: Item, action: 'forward' | 'reject') {
    setBusy(it.id + action);
    try {
      const sellers = it.kind === 'inquiry' ? picked[it.id] ?? (it.seller ? [it.seller] : []) : [];
      if (it.kind === 'inquiry' && action === 'forward' && !sellers.length) throw new Error('Choose at least one seller');
      const d = await api<{ delivered?: string[] }>('/api/admin/review', 'POST', { kind: it.kind, id: it.id, action, message: edit[it.id], sellerIds: sellers.map((x) => x.id) });
      toast(action === 'forward' ? (it.kind === 'message' ? `Delivered to ${it.to}` : d.delivered?.length ? `Sent to ${d.delivered.length} seller${d.delivered.length > 1 ? 's' : ''}` : `Forwarded to ${it.to}`) : 'Rejected');
      setItems((xs) => (xs || []).filter((x) => x.id !== it.id));
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setBusy('');
  }
  return (
    <div className="max-w-5xl">
      <PageTitle title="Forward inquiry" subtitle="New inquiries, quotes and chat messages wait here. Check and edit them, choose one or more sellers, then forward. Switch this off in Marketplace settings → Approvals." />
      {!items ? (
        <Spinner />
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-gray-200/70">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
          <p className="mt-3 font-bold text-gray-900">All done — nothing waiting.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((it) => (
            <div key={it.id} className="rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                    {it.kind === 'inquiry' ? <Inbox className="h-4 w-4" /> : it.kind === 'message' ? <MessageSquare className="h-4 w-4" /> : <FileText className="h-4 w-4" />} {it.kind === 'inquiry' ? 'Buyer → seller' : it.kind === 'message' ? it.extra : 'Seller → buyer'} · {formatDateTime(it.at)}
                  </p>
                  <p className="mt-1 font-bold text-gray-900">{it.title}</p>
                  <p className="text-sm text-gray-600">
                    From <b>{it.from}</b> to{' '}
                    <Link href={it.toHref} className="font-bold text-gold-deep">{it.to}</Link>
                  </p>
                  {it.contact && <p className="text-xs text-gray-500">{it.contact}</p>}
                  {it.extra && it.kind !== 'message' && <p className="text-xs text-gray-500">{it.extra}</p>}
                </div>
                {it.kind !== 'quote' && <Link href={`/admin/inquiries/${it.inquiryId || it.id}`} className="text-sm font-semibold text-gray-500 hover:text-gray-900">Open thread →</Link>}
              </div>
              {it.kind === 'inquiry' && (
                <div className="mt-3 rounded-xl bg-emerald-50/60 p-3 ring-1 ring-emerald-100">
                  <p className="mb-2 text-xs font-bold text-emerald-900">Send to these sellers (you can choose more than one — each gets an own copy)</p>
                  <SellerPicker value={picked[it.id] ?? (it.seller ? [it.seller] : [])} onChange={(v) => setPicked({ ...picked, [it.id]: v })} suggestions={it.suggest} />
                </div>
              )}
              <textarea className="admin-input mt-3 min-h-[90px]" value={edit[it.id] ?? it.message} onChange={(e) => setEdit({ ...edit, [it.id]: e.target.value })} aria-label="Message (you can edit it before forwarding)" />
              <div className="mt-3 flex flex-wrap gap-2">
                <Btn onClick={() => act(it, 'forward')} loading={busy === it.id + 'forward'}>
                  <Send className="h-4 w-4" /> {it.kind === 'message' ? 'Approve & deliver' : it.kind === 'inquiry' ? `Forward to ${(picked[it.id] ?? [it.seller]).filter(Boolean).length} seller${(picked[it.id] ?? [it.seller]).filter(Boolean).length === 1 ? '' : 's'}` : 'Forward to buyer'}
                </Btn>
                <Btn variant="ghost" onClick={() => act(it, 'reject')} loading={busy === it.id + 'reject'}>
                  <X className="h-4 w-4" /> Reject
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
