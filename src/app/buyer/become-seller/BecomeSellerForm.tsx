'use client';
import { useState } from 'react';
import { LoaderCircle, Store } from 'lucide-react';

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

export default function BecomeSellerForm({ first, last, phone, company }: { first: string; last: string; phone: string; company: string }) {
  const [shop, setShop] = useState(company);
  const [url, setUrl] = useState(slugify(company));
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const f = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const r = await fetch('/api/buyer/become-seller', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Something went wrong');
      window.location.href = d.redirect;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return (
    <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-gray-200/70">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="admin-label">First name *</span><input name="firstName" required defaultValue={first} className="admin-input" /></label>
        <label className="block"><span className="admin-label">Last name *</span><input name="lastName" required defaultValue={last} className="admin-input" /></label>
      </div>
      <label className="block">
        <span className="admin-label">Shop name *</span>
        <input name="shopName" required value={shop} onChange={(e) => { setShop(e.target.value); if (!touched) setUrl(slugify(e.target.value)); }} className="admin-input" />
      </label>
      <label className="block">
        <span className="admin-label">Shop URL *</span>
        <input name="shopUrl" required value={url} onChange={(e) => { setTouched(true); setUrl(slugify(e.target.value)); }} className="admin-input" />
        <span className="mt-1 block text-xs text-gray-500">{origin}/sellers/{url || 'your-shop'}</span>
      </label>
      <label className="block"><span className="admin-label">Phone number *</span><input name="phone" required inputMode="tel" defaultValue={phone} className="admin-input" /></label>
      <label className="flex items-start gap-2 text-sm text-gray-600">
        <input type="checkbox" name="agree" value="1" required className="mt-0.5 h-4 w-4 accent-[var(--brand-gold)]" />
        <span>I have read and agree to the <a href="/terms" target="_blank" className="font-bold text-gold-deep">Terms &amp; Conditions</a>.</span>
      </label>
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-white shadow-sm">
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />} Become a Vendor
      </button>
    </form>
  );
}
