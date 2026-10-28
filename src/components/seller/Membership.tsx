'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Crown, LoaderCircle, Receipt, RefreshCw } from 'lucide-react';
import { dapi } from '@/lib/dashboard/api';
import { toast, confirmDialog } from '@/components/admin/ui';
import { StatusPill } from '@/components/dashboard/fields';
import { formatDate } from '@/lib/utils';

declare global {
  interface Window {
    Razorpay?: any;
  }
}
const inr = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
const period = (p: any) => (p.period === 'monthly' ? '/month' : p.period === 'quarterly' ? '/quarter' : p.period === 'yearly' ? '/year' : p.period === 'lifetime' ? ' once' : `/${p.periodDays || 30} days`);

export default function Membership({ e, paidPlans, gstPercent, plans, subs, payments, usage, preselect, reason, justPaid }: any) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [auto, setAuto] = useState<Record<string, boolean>>({});
  const [coupon, setCoupon] = useState('');
  const [manual, setManual] = useState<any>(null);
  const current = subs.find((s: any) => ['active', 'trial', 'past_due'].includes(s.status));

  useEffect(() => {
    if (!paidPlans || document.getElementById('rzp-js')) return;
    const s = document.createElement('script');
    s.id = 'rzp-js';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(s);
  }, [paidPlans]);
  useEffect(() => {
    if (justPaid) toast('Payment received — your plan is active 🎉');
  }, [justPaid]);

  async function buy(plan: any) {
    setBusy(plan.id);
    try {
      const d = await dapi('/api/seller/membership/checkout', 'POST', { planId: plan.id, autoRenew: auto[plan.id] ?? plan.autoRenew, coupon: coupon || undefined });
      if (d.activated) {
        toast('Plan activated');
        router.refresh();
      } else if (d.manual) {
        setManual(d);
      } else {
        if (!window.Razorpay) throw new Error('Payment window could not load. Please disable ad blockers and try again.');
        const rzp = new window.Razorpay({
          key: d.keyId,
          name: 'SHRIJAIV Organic',
          description: `${d.plan.name} plan`,
          ...(d.subscriptionId ? { subscription_id: d.subscriptionId } : { order_id: d.orderId, amount: d.amount.paise, currency: 'INR' }),
          prefill: d.prefill,
          theme: { color: '#009A35' },
          handler: async (resp: any) => {
            try {
              await dapi('/api/seller/membership/verify', 'POST', { ...resp, planId: plan.id, coupon: coupon || undefined });
              window.location.href = '/seller/membership?paid=1';
            } catch (err: any) {
              toast(err.message, 'error');
            }
          },
          modal: { ondismiss: () => setBusy('') },
        });
        rzp.open();
      }
    } catch (err: any) {
      toast(err.message, 'error');
    }
    setBusy('');
  }
  async function toggleRenew(on: boolean) {
    if (!on && !(await confirmDialog('Switch auto-renewal off? Your plan stays active until it ends.'))) return;
    try {
      await dapi('/api/seller/membership/cancel', 'POST', { autoRenew: on });
      toast(on ? 'Auto-renewal on' : 'Auto-renewal off');
      router.refresh();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  }
  const lim = (n: number, used: number, what: string) => (n < 0 ? `${used} ${what} · unlimited` : `${used}/${n} ${what}`);

  return (
    <div className="space-y-6">
      {reason === 'products' && <p className="rounded-2xl bg-amber-50 px-5 py-3 text-sm text-amber-900 ring-1 ring-amber-100">You have reached the product limit of your plan. Choose a bigger plan to add more products.</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200/70 lg:col-span-2">
          <p className="flex items-center gap-2 text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-gray-400"><Crown className="h-4 w-4 text-amber-500" /> Current plan</p>
          <p className="mt-1 text-2xl font-extrabold text-gray-900">{e.planName} <StatusPill status={e.status === 'free' ? 'active' : e.status} /></p>
          {e.endsAt && <p className="text-sm text-gray-500">{e.autoRenew ? 'Renews' : 'Ends'} on {formatDate(e.endsAt)}</p>}
          <div className="mt-4 grid gap-2 text-sm text-gray-700 sm:grid-cols-3">
            <p>{lim(e.maxProducts, usage.products, 'products')}</p>
            <p>{lim(e.maxInquiries, usage.inquiriesMonth, 'buyer contacts this month')}</p>
            <p>{lim(e.maxQuotes, usage.quotesMonth, 'quotes this month')}</p>
          </div>
          {current && paidPlans && current.endsAt && (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4 text-sm">
              <RefreshCw className="h-4 w-4 text-gray-400" />
              <span>Auto-renewal is <b>{current.autoRenew ? 'on' : 'off'}</b>.</span>
              {current.autoRenew ? <button onClick={() => toggleRenew(false)} className="font-bold text-red-600">Switch off</button> : current.razorpaySubscriptionId ? <button onClick={() => toggleRenew(true)} className="font-bold text-gold-deep">Switch on</button> : <span className="text-gray-400">Buy the plan again with auto-renew ticked to enable it.</span>}
            </div>
          )}
        </div>
        <div className="rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-900 ring-1 ring-emerald-100">
          <p className="font-bold">What plans unlock</p>
          <ul className="mt-2 space-y-1">
            {['More products & photos', 'Buyer contact details', 'Quotes on buy leads', 'Verified badge & priority ranking', 'Featured products', 'Analytics & AI tools'].map((x) => <li key={x} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" /> {x}</li>)}
          </ul>
        </div>
      </div>

      {paidPlans ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code" className="admin-input !w-48" />
            <span className="text-xs text-gray-400">Prices exclude {gstPercent}% GST. Pay by UPI, cards, net banking, wallets or EMI.</span>
          </div>
          <div className={`grid gap-4 ${plans.length >= 4 ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'}`}>
            {plans.map((p: any) => {
              const feats: string[] = (() => { try { return JSON.parse(p.features || '[]'); } catch { return []; } })();
              const isCurrent = current?.planId === p.id;
              const renew = auto[p.id] ?? p.autoRenew;
              return (
                <div key={p.id} className={`relative flex flex-col rounded-2xl bg-white p-5 ring-1 ${p.highlight ? 'ring-2 ring-[var(--brand-gold)]' : 'ring-gray-200/70'} ${preselect === p.slug ? 'shadow-xl' : ''}`}>
                  {p.highlight && <span className="absolute -top-3 left-5 rounded-full px-3 py-1 text-[0.6rem] font-extrabold uppercase tracking-wider text-white" style={{ background: 'var(--gold-grad)' }}>Most popular</span>}
                  <p className="text-lg font-extrabold text-gray-900">{p.name}</p>
                  <p className="mt-2 text-3xl font-extrabold text-gray-900">{p.price ? inr(p.price) : 'Free'}<span className="text-sm font-normal text-gray-400">{p.price ? period(p) : ''}</span></p>
                  {p.trialDays > 0 && <p className="text-xs font-bold text-emerald-700">{p.trialDays}-day free trial</p>}
                  <ul className="mt-4 space-y-1.5 text-sm text-gray-700">
                    {feats.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {f}</li>)}
                  </ul>
                  {p.price > 0 && p.autoRenew && p.period !== 'lifetime' && (
                    <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-gray-600"><input type="checkbox" checked={renew} onChange={(ev) => setAuto({ ...auto, [p.id]: ev.target.checked })} className="accent-[var(--brand-gold)]" /> Auto-renew {period(p).replace('/', 'every ')}</label>
                  )}
                  <button onClick={() => buy(p)} disabled={!!busy || (isCurrent && !current.endsAt)} className={`btn mt-4 w-full ${p.highlight ? 'btn-gold' : 'btn-outline'}`}>
                    {busy === p.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null} {isCurrent ? (current.endsAt ? 'Extend' : 'Current plan') : p.price ? 'Choose plan' : 'Start free'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-gray-200/70">
          <p className="text-lg font-extrabold text-gray-900">🎉 Everything is free right now</p>
          <p className="mt-1 text-sm text-gray-500">Unlimited products, buyer contacts, quotes, analytics and AI tools for every seller. Plans will be announced before anything changes.</p>
        </div>
      )}

      {manual && (
        <div className="rounded-2xl bg-amber-50 p-5 text-sm text-amber-900 ring-1 ring-amber-100">
          <p className="font-bold">Bank transfer</p>
          <p className="mt-1">Total {inr(manual.amount.total)} (incl. GST). After transfer, send the receipt to support — your plan is activated by our team.</p>
          <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-white p-3 text-xs">{manual.instructions || 'Bank details are not configured yet. Please contact support.'}</pre>
        </div>
      )}

      {payments.length > 0 && (
        <div className="rounded-2xl bg-white ring-1 ring-gray-200/70">
          <p className="flex items-center gap-2 border-b border-gray-100 px-5 py-3 text-sm font-bold text-gray-900"><Receipt className="h-4 w-4" /> Invoices</p>
          <ul className="divide-y divide-gray-100 text-sm">
            {payments.map((p: any) => (
              <li key={p.id} className="flex items-center gap-4 px-5 py-2.5">
                <span className="w-32 font-mono text-xs">{p.invoiceNo || '—'}</span>
                <span className="flex-1 text-gray-600">{p.subscription?.plan?.name || 'Plan'} · {formatDate(p.paidAt || p.createdAt)}</span>
                <span className="font-semibold">{inr(p.amount + p.gst)}</span>
                <StatusPill status={p.status} />
                {p.status === 'paid' && <Link href={`/seller/membership/invoice/${p.id}`} className="text-xs font-bold text-gold-deep">View</Link>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
