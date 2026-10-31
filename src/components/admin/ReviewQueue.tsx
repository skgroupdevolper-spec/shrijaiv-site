'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Send, X, Inbox, FileText, CheckCircle2 } from 'lucide-react';
import { Btn, PageTitle, Spinner, api, toast } from './ui';
import { formatDateTime } from '@/lib/utils';

type Item = { kind: 'inquiry' | 'quote'; id: string; at: string; title: string; to: string; toHref: string; from: string; contact: string; message: string; extra: string };

/** Admin → Review queue: forward inquiries to sellers and quotes to buyers (or reject them) */
export default function ReviewQueue() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');
  const load = () =>
    api<{ inquiries: any[]; quotes: any[] }>('/api/admin/review')
      .then((d) => {
        const a: Item[] = d.inquiries.map((q) => ({ kind: 'inquiry', id: q.id, at: q.createdAt, title: `Inquiry ${q.refNo}${q.product ? ` · ${q.product.name}` : ''}`, to: q.seller.companyName, toHref: `/admin/sellers/${q.seller.id}`, from: `${q.name}${q.company ? ` (${q.company})` : ''}`, contact: [q.email, q.phone, q.city].filter(Boolean).join(' · '), message: q.message, extra: q.quantity ? `Quantity: ${q.quantity}` : '' }));
        const b: Item[] = d.quotes.map((q) => ({ kind: 'quote', id: q.id, at: q.createdAt, title: `Quote · ${q.requirement.title}`, to: q.requirement.buyer?.companyName || q.requirement.buyer?.user?.name || 'Buyer', toHref: `/admin/requirements`, from: q.seller.companyName, contact: [q.price != null ? `₹${q.price} ${q.priceUnit || ''}` : 'Price on request', q.quantity, q.deliveryTime].filter(Boolean).join(' · '), message: q.message || '', extra: '' }));
        setItems([...a, ...b].sort((x, y) => +new Date(x.at) - +new Date(y.at)));
      })
      .catch((e) => toast(e.message, 'error'));
  useEffect(() => {
    load();
  }, []);
  async function act(it: Item, action: 'forward' | 'reject') {
    setBusy(it.id + action);
    try {
      await api('/api/admin/review', 'POST', { kind: it.kind, id: it.id, action, message: edit[it.id] });
      toast(action === 'forward' ? `Forwarded to ${it.to}` : 'Rejected');
      setItems((xs) => (xs || []).filter((x) => x.id !== it.id));
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setBusy('');
  }
  return (
    <div className="max-w-5xl">
      <PageTitle title="Review queue" subtitle="New inquiries and quotes wait here. Check them, edit if needed, then forward to the seller / buyer. Switch this off in Marketplace settings → Approvals." />
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
                    {it.kind === 'inquiry' ? <Inbox className="h-4 w-4" /> : <FileText className="h-4 w-4" />} {it.kind === 'inquiry' ? 'Buyer → seller' : 'Seller → buyer'} · {formatDateTime(it.at)}
                  </p>
                  <p className="mt-1 font-bold text-gray-900">{it.title}</p>
                  <p className="text-sm text-gray-600">
                    From <b>{it.from}</b> to{' '}
                    <Link href={it.toHref} className="font-bold text-gold-deep">{it.to}</Link>
                  </p>
                  {it.contact && <p className="text-xs text-gray-500">{it.contact}</p>}
                  {it.extra && <p className="text-xs text-gray-500">{it.extra}</p>}
                </div>
                {it.kind === 'inquiry' && <Link href={`/admin/inquiries/${it.id}`} className="text-sm font-semibold text-gray-500 hover:text-gray-900">Open thread →</Link>}
              </div>
              <textarea className="admin-input mt-3 min-h-[90px]" value={edit[it.id] ?? it.message} onChange={(e) => setEdit({ ...edit, [it.id]: e.target.value })} aria-label="Message (you can edit it before forwarding)" />
              <div className="mt-3 flex flex-wrap gap-2">
                <Btn onClick={() => act(it, 'forward')} loading={busy === it.id + 'forward'}>
                  <Send className="h-4 w-4" /> Forward to {it.kind === 'inquiry' ? 'seller' : 'buyer'}
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
