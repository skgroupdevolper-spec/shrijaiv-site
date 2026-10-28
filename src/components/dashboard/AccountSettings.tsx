'use client';
import { useState } from 'react';
import { LoaderCircle, Check, Trash2 } from 'lucide-react';
import { toast, confirmDialog } from '@/components/admin/ui';
import { Field } from '@/components/dashboard/fields';

/** Account (login) settings shared by the seller and buyer dashboards */
export default function AccountSettings({ user }: { user: { name: string; email: string; phone: string } }) {
  const [p, setP] = useState(user);
  const [pw, setPw] = useState({ current: '', password: '' });
  const [busy, setBusy] = useState('');
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy('a');
    const r = await fetch('/api/account/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
    const d = await r.json();
    toast(r.ok ? 'Saved' : d.error, r.ok ? 'success' : 'error');
    setBusy('');
  }
  async function change(e: React.FormEvent) {
    e.preventDefault();
    setBusy('b');
    const r = await fetch('/api/account/password', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pw) });
    const d = await r.json();
    toast(r.ok ? 'Password changed' : d.error, r.ok ? 'success' : 'error');
    if (r.ok) setPw({ current: '', password: '' });
    setBusy('');
  }
  async function del() {
    if (!(await confirmDialog('Delete your account and all your listings, inquiries and messages? This cannot be undone.'))) return;
    const r = await fetch('/api/account/profile', { method: 'DELETE' });
    if (r.ok) window.location.href = '/';
    else toast('Could not delete the account. Please contact support.', 'error');
  }
  return (
    <div className="mx-auto grid max-w-4xl gap-5 lg:grid-cols-2">
      <form onSubmit={save} className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
        <h2 className="font-bold text-gray-900">Login details</h2>
        <Field label="Your name"><input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} className="admin-input" required /></Field>
        <Field label="Email" hint="contact support to change"><input value={p.email} disabled className="admin-input opacity-60" /></Field>
        <Field label="Mobile"><input value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} className="admin-input" /></Field>
        <button className="btn btn-gold btn-sm" disabled={busy === 'a'}>{busy === 'a' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save</button>
      </form>
      <form onSubmit={change} className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
        <h2 className="font-bold text-gray-900">Change password</h2>
        <Field label="Current password"><input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className="admin-input" required /></Field>
        <Field label="New password" hint="min 8 characters"><input type="password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} minLength={8} className="admin-input" required /></Field>
        <button className="btn btn-dark btn-sm" disabled={busy === 'b'}>{busy === 'b' && <LoaderCircle className="h-4 w-4 animate-spin" />} Update password</button>
      </form>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-red-100 lg:col-span-2">
        <h2 className="font-bold text-gray-900">Delete account</h2>
        <p className="mt-1 text-sm text-gray-500">Removes your profile, listings, inquiries and messages. Invoices are kept for tax records.</p>
        <button onClick={del} className="btn btn-outline btn-sm mt-3 text-red-600"><Trash2 className="h-4 w-4" /> Delete my account</button>
      </div>
    </div>
  );
}
