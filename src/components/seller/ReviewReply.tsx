'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, LoaderCircle } from 'lucide-react';
import { dapi } from '@/lib/dashboard/api';
import { toast } from '@/components/admin/ui';

export default function ReviewReply({ id, reply }: { id: string; reply: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(reply || '');
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      await dapi(`/api/seller/reviews/${id}`, 'PUT', { reply: text });
      toast('Reply saved');
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setBusy(false);
  }
  async function flag() {
    const reason = window.prompt('Why should our team check this review?');
    if (!reason) return;
    await dapi(`/api/seller/reviews/${id}`, 'PUT', { flag: true, reason });
    toast('Flagged — our team will review it');
  }
  return (
    <div className="mt-3">
      {reply && !open && (
        <div className="rounded-xl bg-gray-50 p-3 text-sm">
          <p className="text-xs font-bold text-gray-500">Your reply</p>
          <p className="mt-1 text-gray-700">{reply}</p>
        </div>
      )}
      {open ? (
        <div className="space-y-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="admin-input" placeholder="Thank the buyer, address any issue, invite them back…" />
          <div className="flex gap-2">
            <button onClick={save} disabled={busy} className="btn btn-gold btn-sm">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />} Save reply</button>
            <button onClick={() => setOpen(false)} className="btn btn-outline btn-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex gap-3 text-xs font-bold">
          <button onClick={() => setOpen(true)} className="text-gold-deep">{reply ? 'Edit reply' : 'Reply publicly'}</button>
          <button onClick={flag} className="inline-flex items-center gap-1 text-gray-400 hover:text-red-600"><Flag className="h-3 w-3" /> Flag</button>
        </div>
      )}
    </div>
  );
}
