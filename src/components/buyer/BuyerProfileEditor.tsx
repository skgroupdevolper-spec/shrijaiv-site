'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Save } from 'lucide-react';
import { dapi } from '@/lib/dashboard/api';
import { toast } from '@/components/admin/ui';
import { Field, INDIAN_STATES } from '@/components/dashboard/fields';

export default function BuyerProfileEditor({ initial, types, categories }: { initial: any; types: string[]; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [p, setP] = useState<any>(() => ({ ...initial, interests: (() => { try { return JSON.parse(initial.interests || '[]'); } catch { return []; } })() }));
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setP((x: any) => ({ ...x, [k]: v }));
  async function save() {
    setBusy(true);
    try {
      await dapi('/api/buyer/profile', 'PUT', p);
      toast('Profile saved');
      router.refresh();
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setBusy(false);
  }
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name"><input value={p.companyName || ''} onChange={(e) => set('companyName', e.target.value)} className="admin-input" /></Field>
          <Field label="Buyer type"><select value={p.buyerType || ''} onChange={(e) => set('buyerType', e.target.value)} className="admin-input"><option value="">Choose…</option>{types.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="GST number (optional)"><input value={p.gstNumber || ''} onChange={(e) => set('gstNumber', e.target.value.toUpperCase())} className="admin-input" /></Field>
          <Field label="WhatsApp"><input value={p.whatsapp || ''} onChange={(e) => set('whatsapp', e.target.value)} className="admin-input" /></Field>
          <Field label="Address" className="sm:col-span-2"><input value={p.address || ''} onChange={(e) => set('address', e.target.value)} className="admin-input" /></Field>
          <Field label="City"><input value={p.city || ''} onChange={(e) => set('city', e.target.value)} className="admin-input" /></Field>
          <Field label="State"><select value={p.state || ''} onChange={(e) => set('state', e.target.value)} className="admin-input"><option value="">Choose…</option>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="PIN code"><input value={p.pincode || ''} onChange={(e) => set('pincode', e.target.value)} className="admin-input" /></Field>
        </div>
        <Field label="Interested in" hint="we highlight new sellers and leads in these categories" className="mt-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const on = p.interests.includes(c.id);
              return <button key={c.id} type="button" onClick={() => set('interests', on ? p.interests.filter((x: string) => x !== c.id) : [...p.interests, c.id])} className={`rounded-full px-3 py-1.5 text-xs font-bold ${on ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{c.name}</button>;
            })}
          </div>
        </Field>
      </div>
      <div className="flex justify-end"><button onClick={save} disabled={busy} className="btn btn-gold">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button></div>
    </div>
  );
}
