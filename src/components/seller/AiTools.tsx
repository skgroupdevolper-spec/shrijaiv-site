'use client';
import { useState } from 'react';
import Link from 'next/link';
import { LoaderCircle, Sparkles, Languages, Copy, Lock } from 'lucide-react';
import { dapi } from '@/lib/dashboard/api';
import { toast } from '@/components/admin/ui';
import { Field } from '@/components/dashboard/fields';

export default function AiTools({ enabled, locales }: { enabled: boolean; locales: { code: string; name: string; native: string }[] }) {
  const [d, setD] = useState({ name: '', notes: '' });
  const [out, setOut] = useState<any>(null);
  const [tr, setTr] = useState({ text: '', locale: 'hi', result: '' });
  const [busy, setBusy] = useState('');
  async function describe() {
    if (!d.name.trim()) return toast('Enter the product name', 'error');
    setBusy('d');
    try {
      const r = await dapi('/api/seller/ai', 'POST', { task: 'describe', name: d.name, notes: d.notes });
      setOut(r.result);
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setBusy('');
  }
  async function translate() {
    if (!tr.text.trim()) return;
    setBusy('t');
    try {
      const r = await dapi('/api/seller/ai', 'POST', { task: 'translate', text: tr.text, locale: tr.locale });
      setTr((x) => ({ ...x, result: r.result.text }));
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setBusy('');
  }
  const copy = (t: string) => navigator.clipboard?.writeText(t).then(() => toast('Copied'));
  if (!enabled)
    return (
      <div className="rounded-2xl bg-amber-50 p-8 text-center ring-1 ring-amber-100">
        <Lock className="mx-auto h-8 w-8 text-amber-500" />
        <p className="mt-2 font-bold text-amber-900">AI tools are part of paid plans</p>
        <Link href="/seller/membership" className="btn btn-gold mt-4">See plans</Link>
      </div>
    );
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
        <h2 className="flex items-center gap-2 font-bold text-gray-900"><Sparkles className="h-5 w-5 text-amber-500" /> Product description writer</h2>
        <Field label="Product name"><input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} className="admin-input" placeholder="Organic A2 Gir cow ghee, 1 litre" /></Field>
        <Field label="Facts to include" hint="specs, certifications, origin, MOQ…"><textarea value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} rows={4} className="admin-input" /></Field>
        <button onClick={describe} disabled={busy === 'd'} className="btn btn-gold btn-sm">{busy === 'd' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Write</button>
        {out && (
          <div className="space-y-3 rounded-xl bg-gray-50 p-4 text-sm">
            {[['Summary', out.summary], ['Google title', out.metaTitle], ['Google description', out.metaDescription], ['Tags', out.tags]].map(([k, v]: any) => (
              <div key={k}><p className="flex items-center justify-between text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">{k} <button onClick={() => copy(v)} className="text-gold-deep"><Copy className="h-3.5 w-3.5" /></button></p><p className="text-gray-800">{v}</p></div>
            ))}
            <div><p className="flex items-center justify-between text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Description (HTML) <button onClick={() => copy(out.description)} className="text-gold-deep"><Copy className="h-3.5 w-3.5" /></button></p><div className="rte mt-1" dangerouslySetInnerHTML={{ __html: out.description }} /></div>
          </div>
        )}
      </div>
      <div className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
        <h2 className="flex items-center gap-2 font-bold text-gray-900"><Languages className="h-5 w-5 text-emerald-600" /> Translator</h2>
        <Field label="Text (English or any language)"><textarea value={tr.text} onChange={(e) => setTr({ ...tr, text: e.target.value })} rows={6} className="admin-input" placeholder="Paste a product description or a reply to a buyer…" /></Field>
        <div className="flex items-center gap-2">
          <select value={tr.locale} onChange={(e) => setTr({ ...tr, locale: e.target.value })} className="admin-input !w-auto">
            {locales.map((l) => <option key={l.code} value={l.code}>{l.name} · {l.native}</option>)}
          </select>
          <button onClick={translate} disabled={busy === 't'} className="btn btn-gold btn-sm">{busy === 't' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />} Translate</button>
        </div>
        {tr.result && <div className="rounded-xl bg-gray-50 p-4 text-sm"><p className="flex items-center justify-between text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Translation <button onClick={() => copy(tr.result)} className="text-gold-deep"><Copy className="h-3.5 w-3.5" /></button></p><p className="mt-1 whitespace-pre-line text-gray-800" dir={tr.locale === 'ur' ? 'rtl' : 'ltr'}>{tr.result}</p></div>}
      </div>
    </div>
  );
}
