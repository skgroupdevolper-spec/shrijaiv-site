'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Forward } from 'lucide-react';
import { Btn, api, toast } from './ui';
import SellerPicker, { type PickSeller } from './SellerPicker';

/** Admin → inquiry: send the same request to more sellers (each gets an own copy) */
export default function ForwardMore({ id, suggestions, already }: { id: string; suggestions: PickSeller[]; already: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<PickSeller[]>([]);
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try {
      const d = await api<{ delivered: string[] }>('/api/admin/review', 'POST', { kind: 'inquiry', id, action: 'forward-more', sellerIds: sel.map((s) => s.id) });
      toast(d.delivered.length ? `Sent to ${d.delivered.length} more seller${d.delivered.length > 1 ? 's' : ''}` : 'These sellers already have it');
      setSel([]);
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setBusy(false);
  }
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-bold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50">
        <Forward className="h-4 w-4" /> Forward to more sellers
      </button>
    );
  return (
    <div className="w-full rounded-2xl bg-emerald-50/60 p-4 ring-1 ring-emerald-100">
      <p className="mb-2 text-sm font-bold text-emerald-900">Forward this inquiry to more sellers</p>
      {already.length > 0 && <p className="mb-2 text-xs text-gray-500">Already sent to: {already.join(', ')}</p>}
      <SellerPicker value={sel} onChange={setSel} suggestions={suggestions} />
      <div className="mt-3 flex gap-2">
        <Btn onClick={go} loading={busy}>
          <Send className="h-4 w-4" /> Forward to {sel.length} seller{sel.length === 1 ? '' : 's'}
        </Btn>
        <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
      </div>
    </div>
  );
}
