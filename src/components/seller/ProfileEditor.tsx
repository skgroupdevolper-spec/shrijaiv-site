'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Save, Sparkles, ShieldCheck } from 'lucide-react';
import { dapi } from '@/lib/dashboard/api';
import { toast } from '@/components/admin/ui';
import { Field, ImageInput, FileInput, INDIAN_STATES } from '@/components/dashboard/fields';

const CERTS = ['NPOP (India Organic)', 'PGS-India Organic', 'PGS-India Green', 'Jaivik Bharat', 'USDA Organic', 'EU Organic', 'FSSAI licence', 'GST certificate', 'ISO 22000', 'HACCP', 'APEDA registration', 'Other'];

export default function ProfileEditor({ initial, types, aiTools }: { initial: any; types: string[]; aiTools: boolean }) {
  const router = useRouter();
  const [p, setP] = useState<any>(() => ({ ...initial, certifications: (() => { try { return JSON.parse(initial.certifications || '[]'); } catch { return []; } })() }));
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState(false);
  const set = (k: string, v: any) => setP((x: any) => ({ ...x, [k]: v }));
  async function save() {
    setBusy(true);
    try {
      const d = await dapi('/api/seller/profile', 'PUT', p);
      setP((x: any) => ({ ...x, slug: d.item.slug }));
      toast('Profile saved');
      router.refresh();
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setBusy(false);
  }
  async function writeAbout() {
    setAi(true);
    try {
      const d = await dapi('/api/seller/ai', 'POST', { task: 'about', notes: p.about || '' });
      set('about', d.result.text);
      toast('About text written — review and edit');
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setAi(false);
  }
  const certs: { name: string; number?: string; file?: string }[] = p.certifications;
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
        <h2 className="mb-4 font-bold text-gray-900">Identity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company / farm / brand name" required><input value={p.companyName || ''} onChange={(e) => set('companyName', e.target.value)} className="admin-input" /></Field>
          <Field label="Showroom link" hint={`/sellers/${p.slug}`}><input value={p.slug || ''} onChange={(e) => set('slug', e.target.value)} className="admin-input" /></Field>
          <Field label="Business type"><select value={p.businessType || ''} onChange={(e) => set('businessType', e.target.value)} className="admin-input"><option value="">Choose…</option>{types.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Established (year)"><input type="number" value={p.yearEstablished || ''} onChange={(e) => set('yearEstablished', e.target.value)} className="admin-input" placeholder="2015" /></Field>
          <Field label="Employees"><select value={p.employees || ''} onChange={(e) => set('employees', e.target.value)} className="admin-input"><option value="">—</option>{['1-10', '11-50', '51-200', '201-500', '500+'].map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Annual turnover"><select value={p.annualTurnover || ''} onChange={(e) => set('annualTurnover', e.target.value)} className="admin-input"><option value="">—</option>{['Under ₹25 lakh', '₹25 lakh – 1 crore', '₹1 – 5 crore', '₹5 – 25 crore', '₹25 – 100 crore', '₹100 crore+'].map((t) => <option key={t}>{t}</option>)}</select></Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Logo"><ImageInput value={p.logo} onChange={(v) => set('logo', v)} /></Field>
          <Field label="Banner (wide photo of your farm / unit)"><ImageInput value={p.banner} onChange={(v) => set('banner', v)} /></Field>
        </div>
        <Field label="About your company" className="mt-4">
          <div className="mb-2 flex justify-end"><button type="button" onClick={writeAbout} disabled={ai || !aiTools} className="btn btn-outline btn-sm">{ai ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />} Write with AI</button></div>
          <textarea value={p.about || ''} onChange={(e) => set('about', e.target.value)} rows={7} className="admin-input" placeholder="Who you are, what you grow or make, your land/unit, certifications, who you supply…" />
        </Field>
      </div>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
        <h2 className="mb-4 font-bold text-gray-900">Contact & location</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone"><input value={p.phone || ''} onChange={(e) => set('phone', e.target.value)} className="admin-input" /></Field>
          <Field label="WhatsApp"><input value={p.whatsapp || ''} onChange={(e) => set('whatsapp', e.target.value)} className="admin-input" placeholder="919876543210" /></Field>
          <Field label="Business email"><input type="email" value={p.email || ''} onChange={(e) => set('email', e.target.value)} className="admin-input" /></Field>
          <Field label="Website"><input value={p.website || ''} onChange={(e) => set('website', e.target.value)} className="admin-input" placeholder="https://" /></Field>
          <Field label="Address" className="sm:col-span-2"><input value={p.address || ''} onChange={(e) => set('address', e.target.value)} className="admin-input" /></Field>
          <Field label="City"><input value={p.city || ''} onChange={(e) => set('city', e.target.value)} className="admin-input" /></Field>
          <Field label="State"><select value={p.state || ''} onChange={(e) => set('state', e.target.value)} className="admin-input"><option value="">Choose…</option>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="PIN code"><input value={p.pincode || ''} onChange={(e) => set('pincode', e.target.value)} className="admin-input" /></Field>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200/70" id="certifications">
        <h2 className="flex items-center gap-2 font-bold text-gray-900"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Verification documents</h2>
        <p className="mt-1 text-sm text-gray-500">Upload your GST certificate, FSSAI licence and organic certificates. Our team checks them and awards the <b>Verified</b> badge. Numbers are shown publicly only after verification.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="GST number"><input value={p.gstNumber || ''} onChange={(e) => set('gstNumber', e.target.value.toUpperCase())} className="admin-input" placeholder="22AAAAA0000A1Z5" /></Field>
          <Field label="FSSAI licence number"><input value={p.fssaiNumber || ''} onChange={(e) => set('fssaiNumber', e.target.value)} className="admin-input" placeholder="10012345678901" /></Field>
        </div>
        <div className="mt-4 space-y-3">
          {certs.map((c, i) => (
            <div key={i} className="grid gap-2 rounded-xl bg-gray-50 p-3 sm:grid-cols-[1fr_1fr_auto_auto]">
              <select value={c.name} onChange={(e) => set('certifications', certs.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} className="admin-input">{CERTS.map((n) => <option key={n}>{n}</option>)}</select>
              <input value={c.number || ''} onChange={(e) => set('certifications', certs.map((x, k) => (k === i ? { ...x, number: e.target.value } : x)))} placeholder="Certificate number" className="admin-input" />
              <FileInput value={c.file} onChange={(v) => set('certifications', certs.map((x, k) => (k === i ? { ...x, file: v } : x)))} label="Upload" />
              <button type="button" onClick={() => set('certifications', certs.filter((_, k) => k !== i))} className="btn btn-outline btn-sm text-red-600">Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => set('certifications', [...certs, { name: CERTS[0], number: '', file: '' }])} className="btn btn-outline btn-sm">+ Add document</button>
        </div>
        <p className="mt-3 text-xs text-gray-500">Status: <b>{p.verified ? 'Verified ✓' : p.status === 'pending' ? 'Account pending approval' : 'Not verified yet'}</b>{p.verifiedAt ? ` · since ${new Date(p.verifiedAt).toLocaleDateString('en-IN')}` : ''}</p>
      </div>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
        <h2 className="mb-4 font-bold text-gray-900">Google (SEO)</h2>
        <div className="grid gap-4">
          <Field label="Showroom title" hint={`${(p.metaTitle || '').length}/60`}><input value={p.metaTitle || ''} onChange={(e) => set('metaTitle', e.target.value)} className="admin-input" /></Field>
          <Field label="Showroom description" hint={`${(p.metaDescription || '').length}/155`}><textarea value={p.metaDescription || ''} onChange={(e) => set('metaDescription', e.target.value)} rows={2} className="admin-input" /></Field>
        </div>
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <button onClick={save} disabled={busy} className="btn btn-gold shadow-xl">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save profile</button>
      </div>
    </div>
  );
}
