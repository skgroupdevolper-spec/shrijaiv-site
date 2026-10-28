'use client';
import { useRouter } from 'next/navigation';
import { dapi } from '@/lib/dashboard/api';
import { toast, confirmDialog } from '@/components/admin/ui';

export default function RequirementActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  async function act(action: 'close' | 'reopen' | 'delete') {
    if (action === 'delete' && !(await confirmDialog('Delete this requirement and all quotes?'))) return;
    try {
      if (action === 'delete') {
        await dapi(`/api/buyer/requirements/${id}`, 'DELETE');
        router.replace('/buyer/requirements');
        return;
      }
      await dapi(`/api/buyer/requirements/${id}`, 'PUT', { action });
      toast(action === 'close' ? 'Closed' : 'Reopened');
      router.refresh();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  }
  return (
    <>
      {status === 'open' ? <button onClick={() => act('close')} className="btn btn-outline btn-sm">Close</button> : status === 'closed' || status === 'expired' ? <button onClick={() => act('reopen')} className="btn btn-outline btn-sm">Reopen</button> : null}
      <button onClick={() => act('delete')} className="btn btn-outline btn-sm text-red-600">Delete</button>
    </>
  );
}
