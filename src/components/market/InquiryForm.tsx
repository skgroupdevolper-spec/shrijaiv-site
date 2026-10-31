'use client';
import { useState } from 'react';
import { LoaderCircle, CircleCheck, Send } from 'lucide-react';
import { useT } from '@/components/site/SiteProvider';
import SmartLink from '@/components/ui/SmartLink';

/** Buyer → seller inquiry. Works for guests (name, email, phone) and logged-in buyers (prefilled, hidden). */
export default function InquiryForm({ sellerId, sellerName, productId, productName, user, compact }: { sellerId: string; sellerName: string; productId?: string; productName?: string; user?: { name: string; email: string; phone?: string | null } | null; compact?: boolean }) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<null | { ref: string; href?: string; held?: boolean }>(null);
  const [error, setError] = useState('');
  const hasPhone = !!user?.phone && user.phone.replace(/\D/g, '').length >= 10;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const f = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    const body = { ...f, city: [f.city, f.country && f.country !== 'India' ? f.country : ''].filter(Boolean).join(', ') };
    try {
      const r = await fetch('/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, sellerId, productId }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Error');
      setDone({ ref: d.refNo, href: d.href, held: !!d.held });
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }
  if (done)
    return (
      <div className="rounded-3xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-100">
        <CircleCheck className="mx-auto h-10 w-10 text-emerald-600" />
        <p className="mt-3 font-display text-xl font-semibold text-ink">{done.held ? t('Inquiry received!') : t('Inquiry sent!')}</p>
        <p className="mt-1 text-sm text-ink/65">
          {t('Reference')} <b>{done.ref}</b>.{' '}
          {done.held ? `${t('Our team checks it and forwards it to')} ${sellerName} ${t('shortly — you will get an email.')}` : `${sellerName} ${t('will reply by email, WhatsApp or in your dashboard.')}`}
        </p>
        {done.href && <SmartLink href={done.href} className="btn btn-gold btn-sm mt-4">{t('Open conversation')}</SmartLink>}
      </div>
    );
  return (
    <form onSubmit={submit} className="space-y-3">
      {!user && (
        <>
          <input name="name" required placeholder={t('Your name')} className="field" autoComplete="name" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="email" type="email" required placeholder={t('Email')} className="field" autoComplete="email" />
            <input name="phone" required inputMode="tel" pattern="[0-9+ ()-]{10,}" title={t('Please enter a valid mobile number')} placeholder={t('Mobile / WhatsApp')} className="field" autoComplete="tel" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select name="country" className="field" defaultValue="India" aria-label={t('Country')}>
              {['India', 'UAE', 'Saudi Arabia', 'USA', 'UK', 'Nepal', 'Bangladesh', 'Sri Lanka', 'Other'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input name="city" placeholder={t('City / State')} className="field" autoComplete="address-level2" />
          </div>
          {!compact && <input name="company" placeholder={t('Company (optional)')} className="field" autoComplete="organization" />}
        </>
      )}
      {user && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-sand/70 px-3 py-2.5 ring-1 ring-ink/5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold/15 text-sm font-bold text-gold-deep">{(user.name || user.email || '?').charAt(0).toUpperCase()}</span>
          <div className="min-w-0 text-xs leading-tight">
            <p className="text-ink/50">{t('Sending as')}</p>
            <p className="truncate font-bold text-ink">{user.name} · <span className="font-medium text-ink/60">{user.email}</span></p>
          </div>
        </div>
      )}
      {user && !hasPhone && <input name="phone" required inputMode="tel" pattern="[0-9+ ()-]{10,}" title={t('Please enter a valid mobile number')} placeholder={t('Mobile / WhatsApp')} className="field" autoComplete="tel" />}
      <input name="quantity" placeholder={t('Quantity needed (e.g. 500 kg / month)')} className="field" />
      <textarea name="message" required minLength={10} rows={compact ? 3 : 4} defaultValue={productName ? `${t('I am interested in')} ${productName}. ${t('Please share your best price, MOQ and delivery time.')}` : ''} placeholder={t('Tell the seller what you need: product, quantity, packaging, delivery location…')} className="field" />
      <label className="flex items-start gap-2 text-xs text-ink/60">
        <input type="checkbox" required defaultChecked={!!user} className="mt-0.5 h-4 w-4 accent-[var(--brand-gold)]" />
        <span>{t('I have read and agree to the')} <SmartLink href="/terms" className="font-bold text-gold-deep">{t('Terms & Conditions')}</SmartLink>.</span>
      </label>
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="btn btn-gold w-full">
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {t('Send inquiry')}
      </button>
      {!user && (
        <p className="text-center text-xs text-ink/50">
          {t('Have a buyer account?')} <SmartLink href="/login" className="font-bold text-gold-deep">{t('Sign in')}</SmartLink> {t('to track replies in your dashboard.')}
        </p>
      )}
    </form>
  );
}
