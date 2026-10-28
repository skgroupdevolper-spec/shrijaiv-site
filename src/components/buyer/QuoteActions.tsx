'use client';
import { useRouter } from 'next/navigation';
import { dapi } from '@/lib/dashboard/api';
import { toast, confirmDialog } from '@/components/admin/ui';
import { StatusPill } from '@/components/dashboard/fields';

export default function QuoteActions({ id, status, disabled }: { id: string; status: string; disabled?: boolean }) {
  const router = useRouter();
  async function set(s: string) {
    if (s === 'accepted' && !(await confirmDialog('Accept this quote? The seller is notified and other quotes are marked as not chosen.'))) return;
    try {
      await dapi(`/api/buyer/quotes/${id}`, 'PUT', { status: s });
      toast('Updated');
      router.refresh();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  }
  return (
    <div className="flex flex-col items-end gap-1">
      <StatusPill status={status} />
      {!disabled && status !== 'accepted' && (
        <div className="flex gap-1 text-xs font-bold">
          {status !== 'shortlisted' && <button onClick={() => set('shortlisted')} className="text-sky-700">Shortlist</button>}
          <button onClick={() => set('accepted')} className="text-emerald-700">Accept</button>
          {status !== 'rejected' && <button onClick={() => set('rejected')} className="text-gray-400">Decline</button>}
        </div>
      )}
      {status === 'accepted' && <button onClick={() => set('sent')} className="text-xs text-gray-400">Undo</button>}
    </div>
  );
}
