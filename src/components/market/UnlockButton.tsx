'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

type Info = { enabled: boolean; unlimited: boolean; free: number; used: number; left: number; price: number; period: 'month' | 'total'; note: string };

function loadRazorpay() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Payment window could not load. Please disable ad blockers and try again.'));
    document.body.appendChild(s);
  });
}

/** "Show contact details" — uses a free unlock, or opens the payment for one more contact */
export default function UnlockButton({ kind, id, what = 'contact details', className, dark }: { kind: 'inquiry' | 'requirement' | 'seller'; id: string; what?: string; className?: string; dark?: boolean }) {
  const router = useRouter();
  const [info, setInfo] = useState<Info | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/unlock?kind=${kind}&id=${encodeURIComponent(id)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => d && typeof d.left === 'number' && setInfo(d))
      .catch(() => null);
  }, [kind, id]);

  async function go() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch('/api/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, id }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Could not unlock');
      if (d.unlocked) {
        setMsg({ ok: true, text: 'Unlocked' });
        router.refresh();
      } else if (d.manual) {
        setMsg({ text: `Request sent — ₹${d.amount?.total} (incl. GST). ${d.instructions}` });
      } else if (d.pay) {
        await loadRazorpay();
        const rzp = new window.Razorpay({
          key: d.keyId,
          name: 'SHRIJAIV Organic',
          description: `Unlock ${d.label}`,
          order_id: d.orderId,
          amount: d.amount.paise,
          currency: 'INR',
          prefill: d.prefill,
          theme: { color: '#009A35' },
          handler: async (resp: any) => {
            const v = await fetch('/api/unlock/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...resp, kind, id }) });
            const vd = await v.json().catch(() => ({}));
            if (!v.ok) setMsg({ text: vd.error || 'Payment could not be verified' });
            else {
              setMsg({ ok: true, text: 'Payment received — unlocked' });
              router.refresh();
            }
          },
          modal: { ondismiss: () => setBusy(false) },
        });
        rzp.open();
        return;
      }
    } catch (e: any) {
      setMsg({ text: e.message });
    }
    setBusy(false);
  }

  const free = info && (info.unlimited || info.left > 0);
  const sub = !info ? '' : info.unlimited ? 'Included in your plan' : info.left > 0 ? `${info.left} free ${info.left === 1 ? 'contact' : 'contacts'} left${info.period === 'month' ? ' this month' : ''}` : info.price > 0 ? `Free contacts used · ₹${info.price} + GST for this one` : 'Free contacts used — ask the SHRIJAIV team';
  return (
    <div className={cn('rounded-2xl p-4 ring-1', dark ? 'bg-white/5 ring-white/10' : 'bg-amber-50/70 ring-amber-200/70', className)}>
      <p className={cn('flex items-center gap-2 text-sm font-bold', dark ? 'text-white' : 'text-gray-900')}>
        <LockKeyhole className="h-4 w-4 text-amber-600" /> {`Mobile, e-mail and address are private`}
      </p>
      {info?.note && <p className={cn('mt-0.5 text-xs', dark ? 'text-white/60' : 'text-gray-500')}>{info.note}</p>}
      <button type="button" onClick={go} disabled={busy} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60">
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        {free || !info ? `Show ${what}` : info.price > 0 ? `Pay ₹${info.price} + GST & show ${what}` : `Request ${what}`}
      </button>
      {sub && <p className={cn('mt-1.5 text-center text-[0.72rem]', dark ? 'text-white/50' : 'text-gray-500')}>{sub}</p>}
      {msg && <p className={cn('mt-2 rounded-lg px-3 py-2 text-xs', msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-gray-700 ring-1 ring-gray-200')}>{msg.text}</p>}
    </div>
  );
}
