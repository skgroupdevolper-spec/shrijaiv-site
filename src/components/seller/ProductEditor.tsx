'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoaderCircle, Save, Sparkles, Trash2, Eye, ArrowLeft } from 'lucide-react';
import { dapi } from '@/lib/dashboard/api';
import { toast, confirmDialog } from '@/components/admin/ui';
import { Field, ImagesInput, FileInput, PairsInput, ChipsInput, StatusPill } from '@/components/dashboard/fields';

type Cat = { id: string; name: string; parentId: string | null };
const CERT_SUGGEST = ['NPOP (India Organic)', 'PGS-India Organic', 'PGS-India Green', 'Jaivik Bharat', 'USDA Organic', 'EU Organic', 'FSSAI', 'ISO 22000', 'HACCP', 'GMP', 'Halal', 'Fair Trade'];

function parse<T>(json: any, fb: T): T {
  if (Array.isArray(json)) return json as T;
  try {
    const v = JSON.parse(json || '');
    return (v ?? fb) as T;
  } catch {
    return fb;
  }
}

export default function ProductEditor({ initial, categories, units, maxImages, aiTools, slugBase }: { initial: any | null; categories: Cat[]; units: string[]; maxImages: number; aiTools: boolean; slugBase?: string }) {
  const router = useRouter();
  const [p, setP] = useState<any>(() => ({
    name: '', summary: '', description: '', images: [], video: '', catalogFile: '', priceMin: '', priceMax: '', priceUnit: units[0] ? `per ${units[0]}` : '', moq: '', stock: 'In stock', specs: [], certifications: [], tags: '', origin: '', brand: '', packaging: '', shelfLife: '', leadTime: '', categoryId: '', metaTitle: '', metaDescription: '',
    ...(initial || {}),
    images: parse<string[]>(initial?.images, []),
    specs: parse<{ label: string; value: string }[]>(initial?.specs, []),
    certifications: parse<string[]>(initial?.certifications, []),
    priceMin: initial?.priceMin ?? '',
    priceMax: initial?.priceMax ?? '',
    categoryId: initial?.categoryId || '',
  }));
  const [saving, setSaving] = useState(false);
  const [ai, setAi] = useState(false);
  const [tab, setTab] = useState<'basic' | 'details' | 'seo'>('basic');
  const set = (k: string, v: any) => setP((x: any) => ({ ...x, [k]: v }));

  async function save(status?: 'draft' | 'hidden') {
    if (!p.name.trim()) return toast('Please enter the product name', 'error');
    if (!p.images.length && status !== 'draft') return toast('Please add at least one photo', 'error');
    setSaving(true);
    try {
      const body = { ...p, status };
      const d = initial?.id ? await dapi(`/api/seller/products/${initial.id}`, 'PUT', body) : await dapi('/api/seller/products', 'POST', body);
      toast(status === 'draft' ? 'Draft saved' : d.item.status === 'pending' ? 'Saved — waiting for approval' : 'Product saved');
      if (!initial?.id) router.replace(`/seller/products/${d.item.id}`);
      else router.refresh();
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setSaving(false);
  }
  async function remove() {
    if (!initial?.id || !(await confirmDialog('Delete this product? This cannot be undone.'))) return;
    await dapi(`/api/seller/products/${initial.id}`, 'DELETE');
    toast('Product deleted');
    router.replace('/seller/products');
  }
  async function writeWithAi() {
    if (!p.name.trim()) return toast('Enter the product name first', 'error');
    setAi(true);
    try {
      const cat = categories.find((c) => c.id === p.categoryId)?.name;
      const d = await dapi('/api/seller/ai', 'POST', { task: 'describe', name: p.name, category: cat, specs: p.specs.map((s: any) => `${s.label}: ${s.value}`).join('; '), certifications: p.certifications.join(', '), origin: p.origin, moq: p.moq, packaging: p.packaging, notes: p.summary });
      const r = d.result;
      setP((x: any) => ({ ...x, summary: r.summary || x.summary, description: r.description || x.description, metaTitle: r.metaTitle || x.metaTitle, metaDescription: r.metaDescription || x.metaDescription, tags: r.tags || x.tags }));
      toast('Description written — review and edit it');
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setAi(false);
  }
  const roots = categories.filter((c) => !c.parentId);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link href="/seller/products" className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> Products</Link>
        {initial?.status && <StatusPill status={initial.status} />}
        {initial?.status === 'rejected' && initial.adminNote && <span className="text-xs text-red-600">Reason: {initial.adminNote}</span>}
        <div className="ml-auto flex flex-wrap gap-2">
          {initial?.slug && initial.status === 'approved' && (
            <a href={`/products/${initial.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm"><Eye className="h-4 w-4" /> View</a>
          )}
          {initial?.id && <button type="button" onClick={remove} className="btn btn-outline btn-sm text-red-600"><Trash2 className="h-4 w-4" /> Delete</button>}
          <button type="button" onClick={() => save('draft')} disabled={saving} className="btn btn-outline btn-sm">Save draft</button>
          <button type="button" onClick={() => save()} disabled={saving} className="btn btn-gold btn-sm">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {initial?.id ? 'Save & publish' : 'Publish product'}</button>
        </div>
      </div>

      <div className="mb-4 flex gap-1 rounded-2xl bg-gray-100 p-1 text-sm font-bold">
        {(['basic', 'details', 'seo'] as const).map((k) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`flex-1 rounded-xl px-3 py-2 capitalize transition ${tab === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{k === 'seo' ? 'SEO' : k}</button>
        ))}
      </div>

      {tab === 'basic' && (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5 rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
            <Field label="Product name" required>
              <input value={p.name} onChange={(e) => set('name', e.target.value)} className="admin-input" placeholder="e.g. Organic Turmeric Powder (Lakadong), 5% curcumin" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" required>
                <select value={p.categoryId} onChange={(e) => set('categoryId', e.target.value)} className="admin-input">
                  <option value="">Choose…</option>
                  {roots.map((r) => (
                    <optgroup key={r.id} label={r.name}>
                      <option value={r.id}>{r.name} (general)</option>
                      {categories.filter((c) => c.parentId === r.id).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </Field>
              <Field label="Brand (optional)">
                <input value={p.brand || ''} onChange={(e) => set('brand', e.target.value)} className="admin-input" />
              </Field>
            </div>
            <Field label="Photos" required>
              <ImagesInput value={p.images} onChange={(v) => set('images', v)} max={maxImages < 0 ? 15 : Math.max(1, Math.min(15, maxImages))} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Price from (₹)">
                <input type="number" min={0} value={p.priceMin} onChange={(e) => set('priceMin', e.target.value)} className="admin-input" placeholder="180" />
              </Field>
              <Field label="Price to (₹)">
                <input type="number" min={0} value={p.priceMax} onChange={(e) => set('priceMax', e.target.value)} className="admin-input" placeholder="220" />
              </Field>
              <Field label="Unit">
                <input value={p.priceUnit || ''} onChange={(e) => set('priceUnit', e.target.value)} list="units" className="admin-input" placeholder="per kg" />
                <datalist id="units">{units.map((u) => <option key={u} value={`per ${u}`} />)}</datalist>
              </Field>
              <Field label="MOQ">
                <input value={p.moq || ''} onChange={(e) => set('moq', e.target.value)} className="admin-input" placeholder="100 kg" />
              </Field>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Field label="Short summary" hint="shown on the card, max 220 characters" className="flex-1">
                <textarea value={p.summary || ''} onChange={(e) => set('summary', e.target.value)} rows={2} maxLength={400} className="admin-input" />
              </Field>
            </div>
            <Field label="Description" hint="what it is, how it is grown/made, grading, uses, packaging">
              <div className="mb-2 flex justify-end">
                <button type="button" onClick={writeWithAi} disabled={ai || !aiTools} title={aiTools ? '' : 'AI tools are part of paid plans'} className="btn btn-outline btn-sm">{ai ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />} Write with AI</button>
              </div>
              <textarea value={p.description || ''} onChange={(e) => set('description', e.target.value)} rows={10} className="admin-input font-mono text-[13px]" placeholder="You can use simple HTML: <p>, <h3>, <ul><li>" />
            </Field>
          </div>
          <div className="space-y-5">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
              <Field label="Availability">
                <select value={p.stock || ''} onChange={(e) => set('stock', e.target.value)} className="admin-input">
                  {['In stock', 'Made to order', 'Limited stock', 'Seasonal', 'Pre-order'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Certifications" className="mt-4" hint="press Enter after each">
                <ChipsInput value={p.certifications} onChange={(v) => set('certifications', v)} suggestions={CERT_SUGGEST} placeholder="NPOP, FSSAI…" />
              </Field>
              <Field label="Origin (state / region)" className="mt-4">
                <input value={p.origin || ''} onChange={(e) => set('origin', e.target.value)} className="admin-input" placeholder="Meghalaya" />
              </Field>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4 text-xs text-emerald-900 ring-1 ring-emerald-100">
              <p className="font-bold">Tips for more inquiries</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                <li>Real photos in natural light (3+)</li>
                <li>A price range instead of “contact for price”</li>
                <li>MOQ, lead time and packaging filled in</li>
                <li>Certification numbers in the summary</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === 'details' && (
        <div className="space-y-5 rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Packaging"><input value={p.packaging || ''} onChange={(e) => set('packaging', e.target.value)} className="admin-input" placeholder="25 kg PP bags, 1 kg pouches" /></Field>
            <Field label="Shelf life"><input value={p.shelfLife || ''} onChange={(e) => set('shelfLife', e.target.value)} className="admin-input" placeholder="12 months" /></Field>
            <Field label="Lead time"><input value={p.leadTime || ''} onChange={(e) => set('leadTime', e.target.value)} className="admin-input" placeholder="Dispatch within 5 days" /></Field>
          </div>
          <Field label="Specifications" hint="moisture, grade, size, purity…">
            <PairsInput value={p.specs} onChange={(v) => set('specs', v)} labelPlaceholder="Moisture" valuePlaceholder="≤ 10%" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Video (YouTube link or MP4 URL)"><input value={p.video || ''} onChange={(e) => set('video', e.target.value)} className="admin-input" placeholder="https://youtube.com/watch?v=…" /></Field>
            <Field label="Catalogue / spec sheet (PDF)"><FileInput value={p.catalogFile} onChange={(v) => set('catalogFile', v)} /></Field>
          </div>
        </div>
      )}

      {tab === 'seo' && (
        <div className="space-y-5 rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
          <Field label="Search keywords / tags" hint="comma separated"><input value={p.tags || ''} onChange={(e) => set('tags', e.target.value)} className="admin-input" placeholder="organic turmeric, haldi powder, curcumin, lakadong" /></Field>
          <Field label="Google title" hint={`${(p.metaTitle || '').length}/60`}><input value={p.metaTitle || ''} onChange={(e) => set('metaTitle', e.target.value)} maxLength={120} className="admin-input" /></Field>
          <Field label="Google description" hint={`${(p.metaDescription || '').length}/155`}><textarea value={p.metaDescription || ''} onChange={(e) => set('metaDescription', e.target.value)} maxLength={200} rows={3} className="admin-input" /></Field>
          <p className="text-xs text-gray-400">Leave empty to use the product name and summary. Your product is translated automatically into all enabled languages.</p>
        </div>
      )}
    </div>
  );
}
