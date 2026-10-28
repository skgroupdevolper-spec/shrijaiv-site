'use client';
import { useRouter } from 'next/navigation';
import { dapi } from '@/lib/dashboard/api';
import { toast } from '@/components/admin/ui';

export default function InquiryStatus({ id, status, url = `/api/seller/inquiries/${id}` }: { id: string; status: string; url?: string }) {
  const router = useRouter();
  async function set(v: string) {
    try {
      await dapi(url, 'PUT', { status: v });
      toast('Status updated');
      router.refresh();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  }
  return (
    <select value={status} onChange={(e) => set(e.target.value)} className="admin-input !w-auto !py-1.5 text-sm">
      {['new', 'replied', 'quoted', 'closed', 'spam'].map((s) => (
        <option key={s} value={s}>{s === 'new' ? 'New' : s === 'replied' ? 'Replied' : s === 'quoted' ? 'Quote sent' : s === 'closed' ? 'Closed' : 'Spam'}</option>
      ))}
    </select>
  );
}
