'use client';
import { useState } from 'react';
import SmartLink from '@/components/ui/SmartLink';
import { useT, useLocalize } from '@/components/site/SiteProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoaderCircle, Eye, EyeOff, CircleCheck } from 'lucide-react';

async function post(url: string, body: any) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Error');
  return d;
}

function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? 'text' : 'password'} className="field pr-12" />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink" aria-label="Toggle password">
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}

export function LoginForm({ admin = false }: { admin?: boolean }) {
  const t = useT();
  const L = useLocalize();
  const router = useRouter();
  const sp = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    try {
      const d = await post('/api/auth/login', { email: fd.get('email'), password: fd.get('password'), admin });
      const next = sp.get('next');
      window.location.href = next && next.startsWith('/') ? next : d.redirect;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <input name="email" type="email" required placeholder={t('Email address')} className="field" autoComplete="email" />
      <PasswordInput name="password" required placeholder={t('Password')} autoComplete="current-password" />
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="btn btn-gold w-full">
        {loading && <LoaderCircle className="h-4 w-4 animate-spin" />} {t('Sign in')}
      </button>
      {!admin && (
        <div className="flex justify-between text-sm">
          <SmartLink href="/forgot-password" className="text-ink/60 hover:text-gold-deep">{t('Forgot password?')}</SmartLink>
          <SmartLink href="/register" className="font-bold text-gold-deep">{t('Create account')}</SmartLink>
        </div>
      )}
    </form>
  );
}

/** First-run form shown on /admin/login while no admin account exists */
export function AdminSetupForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    if (fd.get('password') !== fd.get('password2')) {
      setError('The two passwords do not match');
      setLoading(false);
      return;
    }
    try {
      const d = await post('/api/auth/setup', { name: fd.get('name'), email: fd.get('email'), password: fd.get('password') });
      window.location.href = d.redirect;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="rounded-xl bg-gold/10 px-4 py-3 text-sm text-ink/70">Welcome! Create your admin account to start managing the website.</p>
      <input name="name" required placeholder="Your name" className="field" autoComplete="name" />
      <input name="email" type="email" required placeholder="Admin email address" className="field" autoComplete="email" />
      <PasswordInput name="password" required minLength={8} placeholder="Choose a password (min 8 characters)" autoComplete="new-password" />
      <PasswordInput name="password2" required minLength={8} placeholder="Repeat the password" autoComplete="new-password" />
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="btn btn-gold w-full">
        {loading && <LoaderCircle className="h-4 w-4 animate-spin" />} Create admin account
      </button>
    </form>
  );
}

const INDIAN_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman & Nicobar', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];

function Lbl({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <span className="mb-1.5 block text-[0.82rem] font-semibold text-ink/75">
      {children}
      {req && <span className="text-rose-500"> *</span>}
    </span>
  );
}

/** Seller / buyer registration ("Put your organization" + contact details + login) */
export function RegisterForm({ initialRole = 'buyer', sellerTypes = [], buyerTypes = [], categories = [] }: { initialRole?: 'buyer' | 'seller'; sellerTypes?: string[]; buyerTypes?: string[]; categories?: { id: string; name: string }[] }) {
  const t = useT();
  const [role, setRole] = useState<'buyer' | 'seller'>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const seller = role === 'seller';
  const types = seller ? sellerTypes : buyerTypes;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    try {
      const body: Record<string, any> = { ...Object.fromEntries(fd.entries()), role, categories: fd.getAll('categories') };
      const d = await post('/api/auth/register', body);
      window.location.href = d.redirect;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-ink/5 p-1.5" role="tablist" aria-label={t('I want to')}>
        {(['seller', 'buyer'] as const).map((r) => (
          <button key={r} type="button" role="tab" aria-selected={role === r} onClick={() => setRole(r)} className={`rounded-xl px-4 py-3 text-sm font-bold transition ${role === r ? (r === 'seller' ? 'bg-gold text-white shadow-sm' : 'bg-amber-400 text-amber-950 shadow-sm') : 'text-ink/55 hover:text-ink'}`}>
            {r === 'buyer' ? t('I am a Buyer') : t('I am a Supplier')}
          </button>
        ))}
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-1 font-display text-lg font-semibold text-ink">{t('Your organization')}</legend>
        <label className="block">
          <Lbl req={seller}>{t('Company name')}</Lbl>
          <input name="company" required={seller} placeholder={seller ? t('Company / farm / brand name') : t('Company name (optional for individuals)')} className="field" autoComplete="organization" />
        </label>
        <label className="block">
          <Lbl req>{seller ? t("I'm a supplier of") : t("I'm a buyer of")}</Lbl>
          <input name="deals" required placeholder={seller ? t('e.g. organic wheat, turmeric, cold-pressed oils') : t('e.g. organic atta, honey, A2 ghee')} className="field" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <Lbl req>{seller ? t('Your primary business') : t('Buyer type')}</Lbl>
            <select name="type" required className="field" defaultValue="">
              <option value="" disabled>{t('Select…')}</option>
              {types.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <Lbl>{t('GST number')}</Lbl>
            <input name="gst" placeholder="22AAAAA0000A1Z5" className="field uppercase" maxLength={15} />
          </label>
        </div>
        {seller && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <Lbl>{t('Year your business was established')}</Lbl>
                <input name="year" inputMode="numeric" placeholder="2018" className="field" maxLength={4} />
              </label>
              <label className="block">
                <Lbl>{t('Approx. annual sales (₹)')}</Lbl>
                <select name="turnover" className="field" defaultValue="">
                  <option value="">{t('Select…')}</option>
                  {['Up to 40 lakh', '40 lakh – 1.5 crore', '1.5 – 5 crore', '5 – 25 crore', '25 – 100 crore', 'Above 100 crore'].map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <Lbl>{t('Certifications your company received')}</Lbl>
                <input name="certs" placeholder={t('NPOP, PGS-India, FSSAI, USDA…')} className="field" />
              </label>
              <label className="block">
                <Lbl>{t('Trade services you provide')}</Lbl>
                <input name="services" placeholder={t('Export, private label, cold storage…')} className="field" />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <Lbl>{t('FSSAI licence (food)')}</Lbl>
                <input name="fssai" className="field" maxLength={14} />
              </label>
              <label className="block">
                <Lbl>{t('Employees')}</Lbl>
                <select name="employees" className="field" defaultValue="">
                  <option value="">{t('Select…')}</option>
                  {['1-10', '11-50', '51-200', '201-500', '500+'].map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              <Lbl>{t('Website')}</Lbl>
              <input name="website" type="url" placeholder="https://" className="field" />
            </label>
          </>
        )}
        {categories.length > 0 && (
          <div>
            <Lbl>{seller ? t('Categories you sell') : t('Categories you buy')}</Lbl>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <label key={c.id} className="cursor-pointer">
                  <input type="checkbox" name="categories" value={c.id} className="peer sr-only" />
                  <span className="inline-block rounded-full border border-ink/10 bg-white px-3.5 py-1.5 text-sm font-semibold text-ink/70 transition peer-checked:border-transparent peer-checked:bg-ink peer-checked:text-white">{c.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-1 font-display text-lg font-semibold text-ink">{t('Contact details')}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <Lbl req>{t('Your name')}</Lbl>
            <input name="name" required className="field" autoComplete="name" />
          </label>
          <label className="block">
            <Lbl req>{t('Phone number')}</Lbl>
            <input name="phone" required inputMode="tel" placeholder="+91" className="field" autoComplete="tel" />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <Lbl req>{t('Email')}</Lbl>
            <input name="email" type="email" required className="field" autoComplete="email" />
          </label>
          <label className="block">
            <Lbl>{t('WhatsApp (if different)')}</Lbl>
            <input name="whatsapp" inputMode="tel" className="field" />
          </label>
        </div>
        <label className="block">
          <Lbl req={seller}>{t('Address')}</Lbl>
          <input name="address" required={seller} className="field" autoComplete="street-address" />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <Lbl req>{t('State')}</Lbl>
            <select name="state" required className="field" defaultValue="">
              <option value="" disabled>{t('Select…')}</option>
              {INDIAN_STATES.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <Lbl req>{t('City')}</Lbl>
            <input name="city" required className="field" autoComplete="address-level2" />
          </label>
          <label className="block">
            <Lbl>{t('PIN code')}</Lbl>
            <input name="pincode" inputMode="numeric" maxLength={6} className="field" autoComplete="postal-code" />
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-1 font-display text-lg font-semibold text-ink">{t('Login')}</legend>
        <PasswordInput name="password" required minLength={8} placeholder={t('Password (min 8 characters)')} autoComplete="new-password" />
      </fieldset>

      <label className="flex items-start gap-2 text-xs text-ink/60">
        <input type="checkbox" name="agree" required className="mt-0.5 h-4 w-4 accent-[var(--brand-gold)]" />
        <span>{t('I have read and agree to the')} <SmartLink href="/terms" className="font-bold text-gold-deep">{t('Terms & Conditions')}</SmartLink> {t('and')} <SmartLink href="/privacy" className="font-bold text-gold-deep">{t('Privacy Policy')}</SmartLink>, {t('and to receive inquiries and updates by email / WhatsApp.')}</span>
      </label>
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="btn btn-gold w-full">
        {loading && <LoaderCircle className="h-4 w-4 animate-spin" />} {seller ? t('Become a Seller') : t('Create my buyer account')}
      </button>
      <p className="text-center text-sm text-ink/60">
        {t('Already have an account?')} <SmartLink href="/login" className="font-bold text-gold-deep">{t('Sign in')}</SmartLink>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const t = useT();
  const L = useLocalize();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await post('/api/auth/forgot', { email: fd.get('email') }).catch(() => {});
    setDone(true);
    setLoading(false);
  }
  if (done)
    return (
      <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-ink/5">
        <CircleCheck className="mx-auto h-10 w-10 text-emerald-500" />
        <p className="mt-3 text-ink/70">{t('If an account exists for that email, we have sent a password reset link. Please check your inbox.')}</p>
        <SmartLink href="/login" className="mt-4 inline-block font-bold text-gold-deep">{t('Back to login')}</SmartLink>
      </div>
    );
  return (
    <form onSubmit={submit} className="space-y-4">
      <input name="email" type="email" required placeholder={t('Email address')} className="field" />
      <button disabled={loading} className="btn btn-gold w-full">
        {loading && <LoaderCircle className="h-4 w-4 animate-spin" />} {t('Send reset link')}
      </button>
      <p className="text-center text-sm"><SmartLink href="/login" className="text-ink/60 hover:text-gold-deep">{t('Back to login')}</SmartLink></p>
    </form>
  );
}

export function ResetForm() {
  const t = useT();
  const L = useLocalize();
  const sp = useSearchParams();
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('loading');
    setError('');
    const fd = new FormData(e.currentTarget);
    try {
      await post('/api/auth/reset', { token: sp.get('token'), password: fd.get('password') });
      setState('done');
    } catch (err: any) {
      setError(err.message);
      setState('idle');
    }
  }
  if (state === 'done')
    return (
      <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-ink/5">
        <CircleCheck className="mx-auto h-10 w-10 text-emerald-500" />
        <p className="mt-3 text-ink/70">{t('Your password has been updated.')}</p>
        <SmartLink href="/login" className="btn btn-gold mt-5">{t('Sign in')}</SmartLink>
      </div>
    );
  return (
    <form onSubmit={submit} className="space-y-4">
      <PasswordInput name="password" required minLength={8} placeholder={t('New password (min 8 characters)')} />
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <button disabled={state === 'loading'} className="btn btn-gold w-full">{t('Set new password')}</button>
    </form>
  );
}
