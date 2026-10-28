'use client';
import { useEffect, useState } from 'react';
import { LoaderCircle, Save, CreditCard, Sparkles, Store } from 'lucide-react';
import { api, toast, Card, PageTitle, Toggle, Btn } from './ui';

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-md"><p className="text-sm font-bold text-gray-900">{label}</p>{hint && <p className="text-xs text-gray-500">{hint}</p>}</div>
      <div className="sm:w-64">{children}</div>
    </div>
  );
}

export default function MarketplaceSettings() {
  const [tab, setTab] = useState<'market' | 'payments' | 'ai'>('market');
  const [m, setM] = useState<any>(null);
  const [p, setP] = useState<any>(null);
  const [a, setA] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [busy, setBusy] = useState('');
  useEffect(() => {
    api('/api/admin/marketplace').then((d) => setM(d.value)).catch((e) => toast(e.message, 'error'));
    api('/api/admin/payments-settings').then((d) => setP(d.value)).catch(() => null);
    api('/api/admin/ai').then((d) => { setA(d.value); setProviders(d.providers); }).catch(() => null);
  }, []);
  async function save(kind: 'market' | 'payments' | 'ai') {
    setBusy(kind);
    try {
      if (kind === 'market') setM((await api('/api/admin/marketplace', 'PUT', { value: m })).value);
      if (kind === 'payments') setP((await api('/api/admin/payments-settings', 'PUT', { value: p })).value);
      if (kind === 'ai') setA((await api('/api/admin/ai', 'PUT', { value: a })).value);
      toast('Saved');
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setBusy('');
  }
  async function test(kind: 'payments' | 'ai', provider?: string) {
    setBusy('test');
    try {
      const d = kind === 'payments' ? await api('/api/admin/payments-settings', 'POST') : await api('/api/admin/ai', 'POST', { provider });
      toast(d.message || `OK · ${d.answer?.slice(0, 80) || ''} (${d.ms || 0} ms)`);
    } catch (e: any) {
      toast(e.message, 'error');
    }
    setBusy('');
  }
  const num = (v: any) => (v === '' ? 0 : Number(v));
  if (!m) return <p className="p-10 text-center text-gray-400"><LoaderCircle className="mx-auto h-6 w-6 animate-spin" /></p>;
  return (
    <div className="max-w-4xl">
      <PageTitle title="Marketplace settings" subtitle="The master switch for paid plans, approvals, payments and AI." />
      <div className="mb-5 flex gap-1 rounded-2xl bg-gray-100 p-1 text-sm font-bold">
        {([['market', 'Marketplace', Store], ['payments', 'Plans & payments', CreditCard], ['ai', 'AI assistant', Sparkles]] as const).map(([k, l, I]) => (
          <button key={k} onClick={() => setTab(k)} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 transition ${tab === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}><I className="h-4 w-4" /> {l}</button>
        ))}
      </div>

      {tab === 'market' && (
        <>
          <Card className="mb-5 overflow-hidden">
            <div className={`px-5 py-5 ${m.paidPlans ? 'bg-amber-50' : 'bg-emerald-50'}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div><p className="text-lg font-extrabold text-gray-900">Paid plans: {m.paidPlans ? 'ON' : 'OFF'}</p><p className="text-sm text-gray-600">{m.paidPlans ? 'Sellers need an active plan; the limits of their plan apply. Sellers without a plan get the free tier below.' : 'Everything is free and unlimited for every seller. Plans are shown on the pricing page as "coming" but nothing is enforced.'}</p></div>
                <Toggle checked={m.paidPlans} onChange={(v) => setM({ ...m, paidPlans: v })} label={m.paidPlans ? 'Enforced' : 'Free for all'} />
              </div>
            </div>
            <Row label="Free tier when paid plans are ON" hint="what a seller without a plan can still do (0 products = must buy a plan first)">
              <div className="grid grid-cols-3 gap-2">
                {(['maxProducts', 'maxInquiries', 'maxQuotes'] as const).map((k) => (
                  <label key={k} className="text-[0.6rem] font-bold uppercase text-gray-400">{k.replace('max', '')}<input type="number" value={m.freeTier[k]} onChange={(e) => setM({ ...m, freeTier: { ...m.freeTier, [k]: num(e.target.value) } })} className="admin-input mt-1 !py-1.5" /></label>
                ))}
              </div>
            </Row>
            <Row label="GST on plan invoices (%)"><input type="number" value={m.gstPercent} onChange={(e) => setM({ ...m, gstPercent: num(e.target.value) })} className="admin-input" /></Row>
            <Row label="Renewal reminder (days before)"><input type="number" value={m.renewalReminderDays} onChange={(e) => setM({ ...m, renewalReminderDays: num(e.target.value) })} className="admin-input" /></Row>
            <Row label="Grace days after expiry" hint="products stay live this long after a plan ends"><input type="number" value={m.graceDays} onChange={(e) => setM({ ...m, graceDays: num(e.target.value) })} className="admin-input" /></Row>
          </Card>
          <Card title="Approvals & moderation" className="mb-5">
            <Row label="New sellers need approval" hint="off = sellers go live immediately"><Toggle checked={m.approval.sellers} onChange={(v) => setM({ ...m, approval: { ...m.approval, sellers: v } })} /></Row>
            <Row label="New / edited products need approval"><Toggle checked={m.approval.products} onChange={(v) => setM({ ...m, approval: { ...m.approval, products: v } })} /></Row>
            <Row label="Buyer requirements need approval"><Toggle checked={m.approval.requirements} onChange={(v) => setM({ ...m, approval: { ...m.approval, requirements: v } })} /></Row>
            <Row label="Reviews need approval"><Toggle checked={m.approval.reviews} onChange={(v) => setM({ ...m, approval: { ...m.approval, reviews: v } })} /></Row>
            <Row label="Guests can send inquiries" hint="without an account (name, email, mobile)"><Toggle checked={m.allowGuestInquiry} onChange={(v) => setM({ ...m, allowGuestInquiry: v })} /></Row>
            <Row label="Show buyer contact to sellers without a plan" hint="only matters when paid plans are on"><Toggle checked={m.showBuyerContactToSeller} onChange={(v) => setM({ ...m, showBuyerContactToSeller: v })} /></Row>
          </Card>
          <Card title="Lists" className="mb-5">
            {(['sellerTypes', 'buyerTypes', 'units'] as const).map((k) => (
              <Row key={k} label={k === 'sellerTypes' ? 'Seller business types' : k === 'buyerTypes' ? 'Buyer types' : 'Quantity units'} hint="one per line">
                <textarea value={m[k].join('\n')} onChange={(e) => setM({ ...m, [k]: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) })} rows={4} className="admin-input text-xs" />
              </Row>
            ))}
          </Card>
          <Btn onClick={() => save('market')} loading={busy === 'market'}><Save className="h-4 w-4" /> Save marketplace settings</Btn>
        </>
      )}

      {tab === 'payments' && p && (
        <>
          <Card title="Payment provider" className="mb-5">
            <Row label="Provider" hint="Razorpay = UPI, cards, net banking, wallets, EMI. Manual = bank transfer, you activate plans by hand.">
              <select value={p.provider} onChange={(e) => setP({ ...p, provider: e.target.value })} className="admin-input"><option value="razorpay">Razorpay (online)</option><option value="manual">Manual / bank transfer</option></select>
            </Row>
            <Row label="Razorpay Key ID" hint="rzp_test_… for testing, rzp_live_… for real money"><input value={p.razorpayKeyId} onChange={(e) => setP({ ...p, razorpayKeyId: e.target.value.trim() })} className="admin-input" /></Row>
            <Row label="Razorpay Key Secret"><input value={p.razorpayKeySecret} onChange={(e) => setP({ ...p, razorpayKeySecret: e.target.value.trim() })} className="admin-input" type="password" /></Row>
            <Row label="Webhook secret" hint={`Razorpay dashboard → Webhooks → URL: ${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/razorpay · events: subscription.charged, subscription.halted, subscription.cancelled, payment.failed`}><input value={p.razorpayWebhookSecret} onChange={(e) => setP({ ...p, razorpayWebhookSecret: e.target.value.trim() })} className="admin-input" type="password" /></Row>
            <Row label="Bank transfer instructions" hint="shown to sellers when provider = manual"><textarea value={p.manualInstructions} onChange={(e) => setP({ ...p, manualInstructions: e.target.value })} rows={4} className="admin-input text-xs" /></Row>
          </Card>
          <Card title="Invoices" className="mb-5">
            <Row label="Invoice prefix"><input value={p.invoicePrefix} onChange={(e) => setP({ ...p, invoicePrefix: e.target.value })} className="admin-input" /></Row>
            <Row label="Company name on invoices"><input value={p.companyName} onChange={(e) => setP({ ...p, companyName: e.target.value })} className="admin-input" /></Row>
            <Row label="Company address"><textarea value={p.companyAddress} onChange={(e) => setP({ ...p, companyAddress: e.target.value })} rows={3} className="admin-input text-xs" /></Row>
            <Row label="GSTIN"><input value={p.companyGstin} onChange={(e) => setP({ ...p, companyGstin: e.target.value })} className="admin-input" /></Row>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Btn onClick={() => save('payments')} loading={busy === 'payments'}><Save className="h-4 w-4" /> Save payment settings</Btn>
            <Btn variant="ghost" onClick={() => test('payments')} loading={busy === 'test'}>Test Razorpay connection</Btn>
          </div>
        </>
      )}

      {tab === 'ai' && a && (
        <>
          <Card title="AI provider keys" className="mb-5">
            <p className="px-5 pt-4 text-sm text-gray-500">Used by the website chatbot, the seller "Write with AI" tools and translations. One key is enough; the default provider is used unless the chatbot has its own.</p>
            <Row label="Default provider"><select value={a.provider} onChange={(e) => setA({ ...a, provider: e.target.value })} className="admin-input">{providers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Row>
            {providers.map((x) => (
              <Row key={x.id} label={x.name} hint={`key: ${x.keyHint} · get it at ${x.keyUrl}`}>
                <div className="space-y-1.5">
                  <input value={a.providers[x.id]?.key || ''} onChange={(e) => setA({ ...a, providers: { ...a.providers, [x.id]: { ...a.providers[x.id], key: e.target.value.trim() } } })} placeholder="API key" className="admin-input !py-1.5" type="password" />
                  <div className="flex gap-1.5"><input value={a.providers[x.id]?.model || ''} onChange={(e) => setA({ ...a, providers: { ...a.providers, [x.id]: { ...a.providers[x.id], model: e.target.value.trim() } } })} placeholder="model" className="admin-input !py-1.5 text-xs" /><button onClick={() => test('ai', x.id)} className="btn btn-outline btn-sm">Test</button></div>
                </div>
              </Row>
            ))}
            <Row label="Use the Gemini key from Languages too"><Toggle checked={a.useTranslationGeminiKey} onChange={(v) => setA({ ...a, useTranslationGeminiKey: v })} /></Row>
            <Row label="Max AI calls per day (0 = unlimited)"><input type="number" value={a.maxCallsPerDay} onChange={(e) => setA({ ...a, maxCallsPerDay: num(e.target.value) })} className="admin-input" /></Row>
          </Card>
          <Btn onClick={() => save('ai')} loading={busy === 'ai'}><Save className="h-4 w-4" /> Save AI settings</Btn>
          <p className="mt-3 text-xs text-gray-400">The chatbot itself (name, greetings, limits, on/off) is under <b>AI chatbot</b>.</p>
        </>
      )}
    </div>
  );
}
