'use client';
import { useEffect, useState } from 'react';
import { FileBarChart, FileText, FileSpreadsheet, Printer, LoaderCircle, RefreshCw } from 'lucide-react';
import type { Report, ReportType } from '@/lib/reports';
import ReportView from './ReportView';
import { cn } from '@/lib/utils';

const iso = (d: Date) => d.toISOString().slice(0, 10);
function preset(k: string): [string, string] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (k === '7d') return [iso(new Date(+now - 6 * 864e5)), iso(now)];
  if (k === '30d') return [iso(new Date(+now - 29 * 864e5)), iso(now)];
  if (k === 'month') return [iso(new Date(y, m, 1)), iso(now)];
  if (k === 'lastmonth') return [iso(new Date(y, m - 1, 1)), iso(new Date(y, m, 0))];
  if (k === 'quarter') return [iso(new Date(y, Math.floor(m / 3) * 3, 1)), iso(now)];
  if (k === 'year') return [iso(new Date(m >= 3 ? y : y - 1, 3, 1)), iso(now)]; // Indian financial year (Apr–Mar)
  return ['', ''];
}
const PRESETS = [
  ['7d', 'Last 7 days'],
  ['30d', 'Last 30 days'],
  ['month', 'This month'],
  ['lastmonth', 'Last month'],
  ['quarter', 'This quarter'],
  ['year', 'This financial year'],
  ['all', 'All time'],
];

/** Pick a report and a period, preview it, then download PDF / Excel / CSV */
export default function ReportBuilder({ types, title = 'Reports' }: { types: ReportType[]; title?: string }) {
  const [type, setType] = useState(types[0]?.key || 'overview');
  const [range, setRange] = useState<[string, string]>(() => preset('all'));
  const [pre, setPre] = useState('all');
  const [rep, setRep] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const qs = () => new URLSearchParams({ type, ...(range[0] ? { from: range[0] } : {}), ...(range[1] ? { to: range[1] } : {}) }).toString();
  async function preview() {
    setLoading(true);
    try {
      const r = await fetch(`/api/report?${qs()}`, { cache: 'no-store' });
      const d = await r.json();
      setRep(d.report || null);
    } catch {
      setRep(null);
    }
    setLoading(false);
  }
  useEffect(() => {
    preview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, range[0], range[1]]);
  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <FileBarChart className="h-6 w-6 text-gold-deep" /> {title}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Choose a report and a period. Download it as PDF, Excel or CSV — or print it.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {types.map((t) => (
          <button key={t.key} type="button" onClick={() => setType(t.key)} className={cn('rounded-2xl p-4 text-left ring-1 transition', type === t.key ? 'bg-gold/10 ring-gold' : 'bg-white ring-gray-200/70 hover:ring-gray-300')}>
            <p className="font-bold text-gray-900">{t.label}</p>
            <p className="mt-0.5 text-xs text-gray-500">{t.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl bg-white p-4 ring-1 ring-gray-200/70">
        {PRESETS.map(([k, l]) => (
          <button key={k} type="button" onClick={() => { setPre(k); setRange(preset(k)); }} className={cn('rounded-full px-3 py-1.5 text-xs font-bold transition', pre === k ? 'bg-ink text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
            {l}
          </button>
        ))}
        <span className="mx-1 hidden h-6 w-px bg-gray-200 sm:block" />
        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          From <input type="date" value={range[0]} onChange={(e) => { setPre('custom'); setRange([e.target.value, range[1]]); }} className="admin-input !w-auto !py-1.5" />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          To <input type="date" value={range[1]} onChange={(e) => { setPre('custom'); setRange([range[0], e.target.value]); }} className="admin-input !w-auto !py-1.5" />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a href={`/report?${qs()}&print=1`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700">
          <FileText className="h-4 w-4" /> Download PDF
        </a>
        <a href={`/api/report?${qs()}&format=xlsx`} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800">
          <FileSpreadsheet className="h-4 w-4" /> Excel (.xlsx)
        </a>
        <a href={`/api/report?${qs()}&format=csv`} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-gray-800 ring-1 ring-gray-200 hover:bg-gray-50">
          <FileSpreadsheet className="h-4 w-4" /> CSV
        </a>
        <a href={`/report?${qs()}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-gray-800 ring-1 ring-gray-200 hover:bg-gray-50">
          <Printer className="h-4 w-4" /> Print view
        </a>
        <button type="button" onClick={preview} className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-gray-200/70 sm:p-8">
        {loading && !rep ? (
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <LoaderCircle className="h-4 w-4 animate-spin" /> Building report…
          </p>
        ) : rep ? (
          <div className={cn('transition-opacity', loading && 'opacity-50')}>
            <ReportView rep={rep} />
          </div>
        ) : (
          <p className="text-sm text-gray-500">Could not build this report.</p>
        )}
      </div>
    </div>
  );
}
