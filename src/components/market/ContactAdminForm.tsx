'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { LoaderCircle, CircleCheck, Send } from 'lucide-react';
import { useT } from '@/components/site/SiteProvider';
import SmartLink from '@/components/ui/SmartLink';

/**
 * Contact form that reaches the SHRIJAIV team first (Admin → Contact messages); the team then
 * connects the person with the buyer / seller. Used on buy leads ("Contact Buyer") and listings.
 */
export default function ContactAdminForm({ subject, title, button, compact }: { subject: string; title?: string; button?: string; compact?: boolean }) {
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
      const r = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: f.name, email: f.email, phone: f.phone, nationality: f.country, service: subject, message: f.message, source: path, website: f.website }) });
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
      <div className="rounded-3xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-100">
        <CircleCheck className="mx-auto h-10 w-10 text-emerald-600" />
        <p className="mt-3 font-display text-xl font-semibold text-ink">{t('Thank you!')}</p>
        <p className="mt-1 text-sm text-ink/65">{t('Our team received your message and will connect you within 24 hours.')}</p>
      </div>
    );
  return (
    <form onSubmit={submit} className="space-y-3">
      {title && <p className="font-display text-xl font-semibold text-ink">{title}</p>}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <input name="name" required placeholder={t('Your name')} className="field" autoComplete="name" />
      <div className={compact ? 'grid gap-3' : 'grid gap-3 sm:grid-cols-2'}>
        <input name="email" type="email" required placeholder={t('Your email')} className="field" autoComplete="email" />
        <input name="phone" required inputMode="tel" placeholder={t('Phone')} className="field" autoComplete="tel" />
      </div>
      <select name="country" className="field" defaultValue="India" aria-label={t('Country')}>
        {['India', 'UAE', 'Saudi Arabia', 'USA', 'UK', 'Nepal', 'Bangladesh', 'Sri Lanka', 'Other'].map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <textarea name="message" required minLength={10} rows={4} placeholder={t('Message')} className="field" />
      <label className="flex items-start gap-2 text-xs text-ink/60">
        <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-[var(--brand-gold)]" />
        <span>{t('I have read and agree to the')} <SmartLink href="/terms" className="font-bold text-gold-deep">{t('Terms & Conditions')}</SmartLink>.</span>
      </label>
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <button disabled={state === 'loading'} className="btn btn-gold w-full">
        {state === 'loading' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {button || t('Inquire Now')}
      </button>
    </form>
  );
}
