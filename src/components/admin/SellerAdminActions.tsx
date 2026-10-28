'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, BadgeCheck, Star, Crown } from 'lucide-react';
import { api, toast, Modal, Btn } from './ui';

export default function SellerAdminActions({ seller }: { seller: { id: string; status: string; verified: boolean; featured: boolean; adminNote: string | null } }) {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [planId, setPlanId] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { api('/api/admin/plans?take=50').then((d) => setPlans(d.items)).catch(() => null); }, []);
  async function set(data: any) {
    try {
      await api(`/api/admin/sellers/${seller.id}`, 'PUT', data);
      toast('Saved');
      router.refresh();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  }
  async function activate() {
    if (!planId) return;
    setBusy(true);
    try {
      await api('/api/admin/activate-plan', 'POST', { sellerId: seller.id, planId });
      toast('Plan activated');
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setBusy(false);
  }
  return (
    <>
      {seller.status !== 'approved' && <button onClick={() => set({ status: 'approved' })} className="btn btn-gold btn-sm"><Check className="h-4 w-4" /> Approve</button>}
      {seller.status === 'approved' && <button onClick={() => { const n = window.prompt('Reason (sent to the seller):') || ''; set({ status: 'suspended', adminNote: n }); }} className="btn btn-outline btn-sm text-red-600"><X className="h-4 w-4" /> Suspend</button>}
      {seller.status === 'pending' && <button onClick={() => { const n = window.prompt('Reason (sent to the seller):') || ''; set({ status: 'rejected', adminNote: n }); }} className="btn btn-outline btn-sm text-red-600"><X className="h-4 w-4" /> Reject</button>}
      <button onClick={() => set({ verified: !seller.verified })} className={`btn btn-sm ${seller.verified ? 'btn-outline' : 'btn-dark'}`}><BadgeCheck className="h-4 w-4" /> {seller.verified ? 'Remove badge' : 'Verify'}</button>
      <button onClick={() => set({ featured: !seller.featured })} className="btn btn-outline btn-sm"><Star className={`h-4 w-4 ${seller.featured ? 'fill-amber-400 text-amber-400' : ''}`} /> {seller.featured ? 'Unfeature' : 'Feature'}</button>
      <button onClick={() => setOpen(true)} className="btn btn-outline btn-sm"><Crown className="h-4 w-4 text-amber-500" /> Activate plan</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Activate a plan manually" footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn onClick={activate} loading={busy}>Activate</Btn></>}>
        <p className="mb-3 text-sm text-gray-500">For bank transfers or goodwill. The plan starts now for one full period; no invoice is generated unless you add a payment under Payments.</p>
        <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="admin-input"><option value="">Choose a plan…</option>{plans.map((p) => <option key={p.id} value={p.id}>{p.name} — ₹{p.price} / {p.period}</option>)}</select>
      </Modal>
    </>
  );
}
