'use client';
import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Send, CircleCheck, LoaderCircle, Check, Search } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/SiteProvider';
import SmartLink from '@/components/ui/SmartLink';

/** "Inquire Now" (original Inquire Now.html): name, email, phone, country, state, requirement, terms */
type Cat = { id: string; slug: string; name: string; icon: string | null; ids: string[]; children: { slug: string; name: string }[] };
type Prod = { id: string; slug: string; name: string; image: string; price: string; moq: string; categoryId: string | null };

export default function InquireForm({ states, categories, products, preset = [] }: { states: string[]; categories: Cat[]; products: Prod[]; preset?: string[] }) {
  const t = useT();
  const path = usePathname();
  const [cats, setCats] = useState<string[]>(preset);
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState('');
  // products of the chosen categories (sub-categories included), filtered by the search box
  const shown = useMemo(() => {
    const ids = new Set(categories.filter((c) => cats.includes(c.id)).flatMap((c) => c.ids));
    const k = q.trim().toLowerCase();
    return products.filter((p) => (ids.size ? p.categoryId && ids.has(p.categoryId) : false) || picked.includes(p.id)).filter((p) => !k || p.name.toLowerCase().includes(k) || picked.includes(p.id));
  }, [cats, q, picked, categories, products]);
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const catNames = categories.filter((c) => cats.includes(c.id)).map((c) => c.name);
  const prodNames = products.filter((p) => picked.includes(p.id)).map((p) => p.name);
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
          service: catNames.length ? `Inquiry — ${catNames.join(', ')}` : 'General inquiry',
          message: [f.message, prodNames.length ? `Products: ${prodNames.join(', ')}` : '', catNames.length ? `Categories: ${catNames.join(', ')}` : '', f.quantity ? `Quantity: ${f.quantity}` : '', f.iam ? `I am a: ${f.iam}` : ''].filter(Boolean).join('\n'),
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
      <select name="state" required className="field" defaultValue="">
        <option value="">{t('Select state')} *</option>
        {states.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
        <p className="text-sm font-bold text-ink">{t('What do you need?')} <span className="font-normal text-ink/50">— {t('choose one or more categories')}</span></p>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => {
            const on = cats.includes(c.id);
            return (
              <button key={c.id} type="button" onClick={() => setCats(toggle(cats, c.id))} aria-pressed={on} className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.82rem] font-semibold ring-1 transition', on ? 'bg-gold text-white ring-gold' : 'bg-white text-ink/75 ring-ink/10 hover:ring-gold/50')}>
                {on ? <Check className="h-3.5 w-3.5" /> : <Icon name={c.icon || 'leaf'} className="h-3.5 w-3.5 text-gold-deep" />} {c.name}
              </button>
            );
          })}
        </div>
        {(cats.length > 0 || picked.length > 0) && (
          <div className="mt-4 border-t border-ink/5 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-ink">{t('Products')} <span className="font-normal text-ink/50">— {t('tick the ones you want')} {picked.length ? `(${picked.length})` : ''}</span></p>
              <label className="relative">
                <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Search')} className="field !h-9 !w-44 !rounded-full !py-1 !ps-8 text-sm" />
              </label>
            </div>
            {shown.length === 0 ? (
              <p className="mt-3 rounded-xl bg-ink/5 px-3 py-3 text-sm text-ink/60">{t('No listed products here yet — describe what you need below and our team finds sellers for you.')}</p>
            ) : (
              <div className="thin-scroll mt-3 grid max-h-[340px] gap-2 overflow-y-auto pe-1 sm:grid-cols-2">
                {shown.map((p) => {
                  const on = picked.includes(p.id);
                  return (
                    <button key={p.id} type="button" onClick={() => setPicked(toggle(picked, p.id))} aria-pressed={on} className={cn('flex items-center gap-3 rounded-xl p-2 text-start ring-1 transition', on ? 'bg-gold/10 ring-gold' : 'bg-white ring-ink/10 hover:ring-gold/50')}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.image ? <img src={p.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <span className="h-12 w-12 shrink-0 rounded-lg bg-ink/5" />}
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-[0.84rem] font-semibold leading-tight text-ink">{p.name}</span>
                        <span className="block truncate text-[0.72rem] text-ink/55">{p.price}{p.moq ? ` · MOQ ${p.moq}` : ''}</span>
                      </span>
                      <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-md ring-1', on ? 'bg-gold text-white ring-gold' : 'ring-ink/20')}>{on && <Check className="h-3.5 w-3.5" />}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
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
