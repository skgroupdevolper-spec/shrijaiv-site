'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Send, CircleCheck, LoaderCircle } from 'lucide-react';
import { useT } from '@/components/site/SiteProvider';
import SmartLink from '@/components/ui/SmartLink';

/** "Inquire Now" (original Inquire Now.html): name, email, phone, country, state, requirement, terms */
export default function InquireForm({ states, categories, defaultCategory }: { states: string[]; categories: string[]; defaultCategory?: string }) {
  const t = useT();
  const path = usePathname();
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('loading');
    setError('');
    const f = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    try {
      const r = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: f.name,
          email: f.email,
          phone: f.phone,
          nationality: [f.state, f.country].filter(Boolean).join(', '),
          service: f.category ? `Inquiry — ${f.category}` : 'General inquiry',
          message: [f.message, f.quantity ? `Quantity: ${f.quantity}` : '', f.iam ? `I am a: ${f.iam}` : ''].filter(Boolean).join('\n'),
          source: path,
          website: f.website,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || t('Something went wrong'));
      setState('done');
    } catch (err: any) {
      setError(err.message);
      setState('idle');
    }
  }
  if (state === 'done')
    return (
      <div className="py-10 text-center">
        <CircleCheck className="mx-auto h-14 w-14 text-emerald-500" />
        <p className="mt-4 font-display text-2xl font-semibold text-ink">{t('Thank you — inquiry received!')}</p>
        <p className="mx-auto mt-2 max-w-md text-ink/60">{t('Our team will match you with verified sellers and get back to you within 24 hours. A copy has been sent to your email.')}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <SmartLink href="/products" className="btn btn-gold">{t('Browse products')}</SmartLink>
          <SmartLink href="/register?as=buyer" className="btn btn-outline">{t('Create buyer account')}</SmartLink>
        </div>
      </div>
    );
  return (
    <form onSubmit={submit} className="space-y-4">
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-ink/5 p-1.5">
        {['Buyer', 'Supplier'].map((v, i) => (
          <label key={v} className="cursor-pointer">
            <input type="radio" name="iam" value={v} defaultChecked={i === 0} className="peer sr-only" />
            <span className="block rounded-xl px-4 py-2.5 text-center text-sm font-bold text-ink/55 transition peer-checked:bg-white peer-checked:text-ink peer-checked:shadow-sm">{v === 'Buyer' ? t('I want to buy') : t('I want to sell')}</span>
          </label>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" required placeholder={t('Name') + ' *'} className="field" autoComplete="name" />
        <input name="email" type="email" required placeholder={t('Email') + ' *'} className="field" autoComplete="email" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="phone" required inputMode="tel" placeholder={t('Phone number') + ' *'} className="field" autoComplete="tel" />
        <select name="country" className="field" defaultValue="India">
          {['India', 'UAE', 'USA', 'UK', 'Other'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="state" required className="field" defaultValue="">
          <option value="">{t('Select state')} *</option>
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select name="category" className="field" defaultValue={defaultCategory || ''}>
          <option value="">{t('Category')}</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <input name="quantity" placeholder={t('Quantity (e.g. 500 kg / month)')} className="field" />
      <textarea name="message" required rows={5} placeholder={t('Message for requirement') + ' *'} className="field" />
      <label className="flex items-start gap-2 text-sm text-ink/65">
        <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-[var(--brand-gold)]" />
        <span>{t('I have read and agree to the')} <SmartLink href="/terms" className="font-bold text-gold-deep">{t('Terms & Conditions')}</SmartLink></span>
      </label>
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <button disabled={state === 'loading'} className="btn btn-gold w-full sm:w-auto">
        {state === 'loading' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {t('Inquire Now')}
      </button>
    </form>
  );
}
