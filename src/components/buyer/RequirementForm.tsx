'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Send } from 'lucide-react';
import { dapi } from '@/lib/dashboard/api';
import { toast } from '@/components/admin/ui';
import { Field, FileInput, INDIAN_STATES } from '@/components/dashboard/fields';

type Cat = { id: string; name: string; parentId: string | null };

export default function RequirementForm({ initial, categories, units, defaultState, defaultCity }: { initial: any | null; categories: Cat[]; units: string[]; defaultState?: string | null; defaultCity?: string | null }) {
  const router = useRouter();
  const [r, setR] = useState<any>(() => ({ title: '', details: '', categoryId: '', quantity: '', unit: units[0] || 'kg', budgetMin: '', budgetMax: '', deliveryCity: defaultCity || '', deliveryState: defaultState || '', neededBy: '', attachment: '', ...(initial || {}), budgetMin: initial?.budgetMin ?? '', budgetMax: initial?.budgetMax ?? '', categoryId: initial?.categoryId || '', neededBy: initial?.neededBy ? String(initial.neededBy).slice(0, 10) : '', attachment: (() => { try { return JSON.parse(initial?.attachments || '[]')[0] || ''; } catch { return ''; } })() }));
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setR((x: any) => ({ ...x, [k]: v }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { ...r, attachments: r.attachment ? [r.attachment] : [] };
      const d = initial?.id ? await dapi(`/api/buyer/requirements/${initial.id}`, 'PUT', body) : await dapi('/api/buyer/requirements', 'POST', body);
      toast(initial?.id ? 'Requirement updated' : d.item.status === 'pending' ? 'Posted — waiting for approval' : 'Requirement posted — sellers are notified');
      router.replace(`/buyer/requirements/${d.item.id}`);
    } catch (err: any) {
      toast(err.message, 'error');
    }
    setBusy(false);
  }
  const roots = categories.filter((c) => !c.parentId);
  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-5 rounded-2xl bg-white p-5 ring-1 ring-gray-200/70 md:p-7">
      <Field label="What do you need?" required><input value={r.title} onChange={(e) => set('title', e.target.value)} className="admin-input" placeholder="e.g. Organic turmeric powder, 5% curcumin, 500 kg monthly" required /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category"><select value={r.categoryId} onChange={(e) => set('categoryId', e.target.value)} className="admin-input"><option value="">Choose…</option>{roots.map((root) => (<optgroup key={root.id} label={root.name}><option value={root.id}>{root.name} (general)</option>{categories.filter((c) => c.parentId === root.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>))}</select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity"><input value={r.quantity} onChange={(e) => set('quantity', e.target.value)} className="admin-input" placeholder="500" /></Field>
          <Field label="Unit"><input value={r.unit} onChange={(e) => set('unit', e.target.value)} list="runits" className="admin-input" /><datalist id="runits">{units.map((u) => <option key={u} value={u} />)}{['kg / month', 'ton / month', 'pieces / month'].map((u) => <option key={u} value={u} />)}</datalist></Field>
        </div>
      </div>
      <Field label="Details" hint="grade, packaging, certification needed, payment terms, samples…"><textarea value={r.details} onChange={(e) => set('details', e.target.value)} rows={5} className="admin-input" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Budget from (₹, optional)"><input type="number" min={0} value={r.budgetMin} onChange={(e) => set('budgetMin', e.target.value)} className="admin-input" /></Field>
        <Field label="Budget to (₹, optional)"><input type="number" min={0} value={r.budgetMax} onChange={(e) => set('budgetMax', e.target.value)} className="admin-input" /></Field>
        <Field label="Delivery city"><input value={r.deliveryCity} onChange={(e) => set('deliveryCity', e.target.value)} className="admin-input" /></Field>
        <Field label="Delivery state"><select value={r.deliveryState} onChange={(e) => set('deliveryState', e.target.value)} className="admin-input"><option value="">Choose…</option>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Needed by (optional)"><input type="date" value={r.neededBy} onChange={(e) => set('neededBy', e.target.value)} className="admin-input" /></Field>
        <Field label="Attachment (spec sheet, photo)"><FileInput value={r.attachment} onChange={(v) => set('attachment', v)} /></Field>
      </div>
      <p className="text-xs text-gray-400">Your requirement is visible to all registered sellers. Your contact details are shared only with sellers who send a quote.</p>
      <button disabled={busy} className="btn btn-gold">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {initial?.id ? 'Save changes' : 'Post requirement'}</button>
    </form>
  );
}
