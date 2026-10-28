'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Send } from 'lucide-react';
import { dapi } from '@/lib/dashboard/api';
import { toast } from '@/components/admin/ui';
import { Field, FileInput } from '@/components/dashboard/fields';

export default function QuoteForm({ requirementId, initial, units, defaultUnit }: { requirementId: string; initial: any | null; units: string[]; defaultUnit?: string | null }) {
  const router = useRouter();
  const [q, setQ] = useState({ price: initial?.price ?? '', priceUnit: initial?.priceUnit || (defaultUnit ? `per ${defaultUnit}` : ''), quantity: initial?.quantity || '', deliveryTime: initial?.deliveryTime || '', message: initial?.message || '', attachment: (() => { try { return JSON.parse(initial?.attachments || '[]')[0] || ''; } catch { return ''; } })() });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setQ((x) => ({ ...x, [k]: v }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await dapi(`/api/seller/leads/${requirementId}/quote`, 'POST', { ...q, attachments: q.attachment ? [q.attachment] : [] });
      toast(initial ? 'Quote updated' : 'Quote sent to the buyer');
      router.refresh();
    } catch (err: any) {
      toast(err.message, 'error');
    }
    setBusy(false);
  }
  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (₹)"><input type="number" min={0} value={q.price} onChange={(e) => set('price', e.target.value)} className="admin-input" placeholder="195" /></Field>
        <Field label="Unit"><input value={q.priceUnit} onChange={(e) => set('priceUnit', e.target.value)} list="qunits" className="admin-input" placeholder="per kg" /><datalist id="qunits">{units.map((u) => <option key={u} value={`per ${u}`} />)}</datalist></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantity you can supply"><input value={q.quantity} onChange={(e) => set('quantity', e.target.value)} className="admin-input" placeholder="500 kg / month" /></Field>
        <Field label="Delivery time"><input value={q.deliveryTime} onChange={(e) => set('deliveryTime', e.target.value)} className="admin-input" placeholder="7 days" /></Field>
      </div>
      <Field label="Message"><textarea value={q.message} onChange={(e) => set('message', e.target.value)} rows={4} className="admin-input" placeholder="Grade, packaging, certification, payment terms, sample availability…" /></Field>
      <Field label="Attachment (optional)"><FileInput value={q.attachment} onChange={(v) => set('attachment', v)} label="Upload PDF / image" /></Field>
      <button disabled={busy} className="btn btn-gold w-full">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {initial ? 'Update quote' : 'Send quote'}</button>
    </form>
  );
}
