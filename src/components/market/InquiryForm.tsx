'use client';
import { useState } from 'react';
import { LoaderCircle, CircleCheck, Send } from 'lucide-react';
import { useT } from '@/components/site/SiteProvider';
import SmartLink from '@/components/ui/SmartLink';

/** Buyer → seller inquiry. Works for guests (name, email, phone) and logged-in buyers (prefilled, hidden). */
export default function InquiryForm({ sellerId, sellerName, productId, productName, user, compact }: { sellerId: string; sellerName: string; productId?: string; productName?: string; user?: { name: string; email: string; phone?: string | null } | null; compact?: boolean }) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<null | { ref: string; href?: string }>(null);
  const [error, setError] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const r = await fetch('/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, sellerId, productId }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Error');
      setDone({ ref: d.refNo, href: d.href });
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }
  if (done)
    return (
      <div className="rounded-3xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-100">
        <CircleCheck className="mx-auto h-10 w-10 text-emerald-600" />
        <p className="mt-3 font-display text-xl font-semibold text-ink">{t('Inquiry sent!')}</p>
        <p className="mt-1 text-sm text-ink/65">{t('Reference')} <b>{done.ref}</b>. {sellerName} {t('will reply by email, WhatsApp or in your dashboard.')}</p>
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
            <input name="phone" required inputMode="tel" placeholder={t('Mobile / WhatsApp')} className="field" autoComplete="tel" />
          </div>
          {!compact && (
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="company" placeholder={t('Company (optional)')} className="field" autoComplete="organization" />
              <input name="city" placeholder={t('City')} className="field" autoComplete="address-level2" />
            </div>
          )}
        </>
      )}
      <input name="quantity" placeholder={t('Quantity needed (e.g. 500 kg / month)')} className="field" />
      <textarea name="message" required rows={compact ? 3 : 4} placeholder={productName ? `${t('I am interested in')} ${productName}. ${t('Please share your best price, MOQ and delivery time.')}` : t('Tell the seller what you need: product, quantity, packaging, delivery location…')} className="field" />
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
