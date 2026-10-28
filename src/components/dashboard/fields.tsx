'use client';
// Small form widgets shared by the seller / buyer dashboards.
import { useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, X, FileText, Plus, Trash2 } from 'lucide-react';
import { dapi } from '@/lib/dashboard/api';
import { cn } from '@/lib/utils';

export function Label({ children, hint, required }: { children: React.ReactNode; hint?: string; required?: boolean }) {
  return (
    <label className="admin-label">
      {children}
      {required && <span className="text-red-500"> *</span>}
      {hint && <span className="ml-2 font-normal text-gray-400">{hint}</span>}
    </label>
  );
}

export function Field({ label, hint, required, children, className }: { label: string; hint?: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label hint={hint} required={required}>{label}</Label>
      {children}
    </div>
  );
}

export async function uploadToDashboard(files: FileList | File[]) {
  const fd = new FormData();
  Array.from(files).forEach((f) => fd.append('files', f));
  const d = await dapi<{ items: { url: string; name: string }[] }>('/api/seller/upload', 'POST', fd);
  return d.items;
}

/** Multiple image upload with thumbnails, reorder (move first) and remove */
export function ImagesInput({ value, onChange, max = 15, accept = 'image/*' }: { value: string[]; onChange: (v: string[]) => void; max?: number; accept?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function add(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setErr('');
    try {
      const items = await uploadToDashboard(Array.from(files).slice(0, Math.max(0, max - value.length)));
      onChange([...value, ...items.map((i) => i.url)].slice(0, max));
    } catch (e: any) {
      setErr(e.message);
    }
    setBusy(false);
  }
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {value.map((src, i) => (
          <div key={src + i} className="group relative h-24 w-24 overflow-hidden rounded-2xl ring-1 ring-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[0.55rem] font-bold text-white">MAIN</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 opacity-0 transition group-hover:opacity-100">
              {i > 0 ? (
                <button type="button" onClick={() => onChange([src, ...value.filter((_, k) => k !== i)])} className="rounded px-1 text-[0.6rem] font-bold text-white hover:bg-white/20">Main</button>
              ) : (
                <span />
              )}
              <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="rounded p-0.5 text-white hover:bg-white/20" aria-label="Remove"><X className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
        {value.length < max && (
          <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="grid h-24 w-24 place-items-center rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 transition hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)]">
            {busy ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept={accept} multiple className="hidden" onChange={(e) => add(e.target.files)} />
      <p className="mt-1.5 text-xs text-gray-400">{value.length}/{max} · JPG, PNG or WebP, up to 15 MB each. The first image is the main one.</p>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

/** Single image (logo / banner) */
export function ImageInput({ value, onChange, className, accept = 'image/*', label = 'Upload' }: { value?: string | null; onChange: (v: string) => void; className?: string; accept?: string; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  async function add(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const items = await uploadToDashboard([files[0]]);
      onChange(items[0].url);
    } catch {}
    setBusy(false);
  }
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-200">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className="h-6 w-6 text-gray-400" />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="btn btn-outline btn-sm">
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} {label}
        </button>
        {value && <button type="button" onClick={() => onChange('')} className="btn btn-outline btn-sm text-red-600"><X className="h-4 w-4" /> Remove</button>}
      </div>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => add(e.target.files)} />
    </div>
  );
}

/** File (PDF) upload */
export function FileInput({ value, onChange, label = 'Upload PDF' }: { value?: string | null; onChange: (v: string) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  async function add(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const items = await uploadToDashboard([files[0]]);
      onChange(items[0].url);
    } catch {}
    setBusy(false);
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {value && (
        <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700"><FileText className="h-4 w-4" /> View file</a>
      )}
      <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="btn btn-outline btn-sm">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} {label}</button>
      {value && <button type="button" onClick={() => onChange('')} className="btn btn-outline btn-sm text-red-600"><X className="h-4 w-4" /></button>}
      <input ref={ref} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => add(e.target.files)} />
    </div>
  );
}

/** Label/value rows (specifications) */
export function PairsInput({ value, onChange, labelPlaceholder = 'Label', valuePlaceholder = 'Value', max = 40 }: { value: { label: string; value: string }[]; onChange: (v: { label: string; value: string }[]) => void; labelPlaceholder?: string; valuePlaceholder?: string; max?: number }) {
  const set = (i: number, k: 'label' | 'value', v: string) => onChange(value.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  return (
    <div className="space-y-2">
      {value.map((r, i) => (
        <div key={i} className="flex gap-2">
          <input value={r.label} onChange={(e) => set(i, 'label', e.target.value)} placeholder={labelPlaceholder} className="admin-input w-1/3" />
          <input value={r.value} onChange={(e) => set(i, 'value', e.target.value)} placeholder={valuePlaceholder} className="admin-input flex-1" />
          <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      {value.length < max && (
        <button type="button" onClick={() => onChange([...value, { label: '', value: '' }])} className="inline-flex items-center gap-1 text-sm font-bold text-gold-deep"><Plus className="h-4 w-4" /> Add row</button>
      )}
    </div>
  );
}

/** Comma / enter separated chips */
export function ChipsInput({ value, onChange, placeholder, suggestions = [] }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; suggestions?: string[] }) {
  const [text, setText] = useState('');
  const add = (v: string) => {
    const t = v.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setText('');
  };
  return (
    <div className="admin-input flex min-h-[44px] flex-wrap items-center gap-1.5 !py-1.5">
      {value.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
          {v} <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} aria-label="Remove"><X className="h-3 w-3" /></button>
        </span>
      ))}
      <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(text); } }} onBlur={() => add(text)} placeholder={placeholder} list={suggestions.length ? 'chips-sug' : undefined} className="min-w-[120px] flex-1 bg-transparent px-1 text-sm outline-none" />
      {suggestions.length > 0 && (
        <datalist id="chips-sug">
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
    </div>
  );
}

export const INDIAN_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman & Nicobar', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = { approved: 'bg-emerald-50 text-emerald-700', open: 'bg-emerald-50 text-emerald-700', active: 'bg-emerald-50 text-emerald-700', pending: 'bg-amber-50 text-amber-700', new: 'bg-amber-50 text-amber-700', sent: 'bg-sky-50 text-sky-700', replied: 'bg-sky-50 text-sky-700', quoted: 'bg-indigo-50 text-indigo-700', shortlisted: 'bg-indigo-50 text-indigo-700', accepted: 'bg-emerald-100 text-emerald-800', draft: 'bg-gray-100 text-gray-600', hidden: 'bg-gray-100 text-gray-600', closed: 'bg-gray-100 text-gray-600', expired: 'bg-gray-100 text-gray-600', rejected: 'bg-red-50 text-red-700', suspended: 'bg-red-50 text-red-700', spam: 'bg-red-50 text-red-700', cancelled: 'bg-gray-100 text-gray-600', trial: 'bg-sky-50 text-sky-700', past_due: 'bg-amber-50 text-amber-700' };
  return <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-[0.68rem] font-extrabold uppercase tracking-wider', map[status] || 'bg-gray-100 text-gray-600')}>{status.replace('_', ' ')}</span>;
}
