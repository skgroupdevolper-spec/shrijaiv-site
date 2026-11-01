'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, MessagesSquare, LockKeyhole, LockKeyholeOpen } from 'lucide-react';
import { api, toast } from './ui';
import { formatDateTime } from '@/lib/utils';

type Pending = { id: string; senderRole: string; body: string; createdAt: string };

/** Admin → inquiry: approve waiting chat messages, allow direct chat, unlock the buyer contact for the seller */
export default function InquiryChatControls({ id, directChat, contactUnlocked, pending, approvalOn }: { id: string; directChat: boolean; contactUnlocked: boolean; pending: Pending[]; approvalOn: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [edit, setEdit] = useState<Record<string, string>>({});
  async function patch(data: Record<string, any>, msg: string) {
    setBusy(Object.keys(data)[0]);
    try {
      await api(`/api/admin/inquiries/${id}`, 'PUT', data);
      toast(msg);
      router.refresh();
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setBusy('');
  }
  async function act(m: Pending, action: 'forward' | 'reject') {
    setBusy(m.id);
    try {
      await api('/api/admin/review', 'POST', { kind: 'message', id: m.id, action, message: edit[m.id] });
      toast(action === 'forward' ? 'Delivered' : 'Not delivered');
      router.refresh();
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setBusy('');
  }
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {approvalOn && (
          <button type="button" disabled={busy === 'directChat'} onClick={() => patch({ directChat: !directChat }, directChat ? 'Messages need your approval again' : 'Direct chat allowed for this inquiry')} className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold ring-1 ${directChat ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50'}`}>
            <MessagesSquare className="h-4 w-4" /> {directChat ? 'Direct chat: allowed' : 'Allow direct chat'}
          </button>
        )}
        <button type="button" disabled={busy === 'contactUnlocked'} onClick={() => patch({ contactUnlocked: !contactUnlocked }, contactUnlocked ? 'Buyer contact hidden from the seller' : 'Buyer contact unlocked for the seller')} className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold ring-1 ${contactUnlocked ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50'}`}>
          {contactUnlocked ? <LockKeyholeOpen className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />} {contactUnlocked ? 'Seller sees buyer contact' : 'Unlock buyer contact for the seller (free)'}
        </button>
      </div>
      {pending.length > 0 && (
        <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <p className="text-sm font-bold text-amber-900">{pending.length} message{pending.length > 1 ? 's' : ''} waiting for your approval</p>
          <div className="mt-3 space-y-3">
            {pending.map((m) => (
              <div key={m.id} className="rounded-xl bg-white p-3 ring-1 ring-amber-100">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{m.senderRole === 'buyer' ? 'Buyer → seller' : 'Seller → buyer'} · {formatDateTime(m.createdAt)}</p>
                <textarea className="admin-input mt-2 min-h-[70px] text-sm" value={edit[m.id] ?? m.body} onChange={(e) => setEdit({ ...edit, [m.id]: e.target.value })} aria-label="Message (edit before delivering)" />
                <div className="mt-2 flex gap-2">
                  <button type="button" disabled={busy === m.id} onClick={() => act(m, 'forward')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"><Check className="h-3.5 w-3.5" /> Approve & deliver</button>
                  <button type="button" disabled={busy === m.id} onClick={() => act(m, 'reject')} className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"><X className="h-3.5 w-3.5" /> Don't deliver</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
