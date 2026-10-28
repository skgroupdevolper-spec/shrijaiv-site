'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, Pencil, Trash2, EyeOff, Upload } from 'lucide-react';
import { dapi } from '@/lib/dashboard/api';
import { toast, confirmDialog } from '@/components/admin/ui';
import { StatusPill } from '@/components/dashboard/fields';
import { images, priceLabel } from '@/lib/marketplace/format';
import { formatDate } from '@/lib/utils';

const TABS = [['', 'All'], ['approved', 'Live'], ['pending', 'Pending'], ['draft', 'Drafts'], ['hidden', 'Hidden'], ['rejected', 'Rejected']];

export default function ProductsTable({ items, status }: { items: any[]; status: string }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const list = items.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));
  async function act(p: any, action: 'hide' | 'show' | 'delete') {
    try {
      if (action === 'delete') {
        if (!(await confirmDialog(`Delete "${p.name}"?`))) return;
        await dapi(`/api/seller/products/${p.id}`, 'DELETE');
      } else {
        await dapi(`/api/seller/products/${p.id}`, 'PUT', { ...p, images: images(p.images), specs: JSON.parse(p.specs || '[]'), certifications: JSON.parse(p.certifications || '[]'), status: action === 'hide' ? 'hidden' : undefined });
      }
      toast(action === 'delete' ? 'Deleted' : action === 'hide' ? 'Hidden from the marketplace' : 'Submitted');
      router.refresh();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  }
  return (
    <div className="rounded-2xl bg-white ring-1 ring-gray-200/70">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-3">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(([v, l]) => (
            <Link key={v} href={v ? `/seller/products?status=${v}` : '/seller/products'} className={`rounded-full px-3 py-1.5 text-xs font-bold ${status === v ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{l}</Link>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="admin-input ml-auto !w-48 !py-1.5 text-sm" />
      </div>
      {list.length === 0 ? (
        <p className="p-10 text-center text-sm text-gray-400">Nothing here.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {list.map((p) => {
            const img = images(p.images)[0];
            return (
              <li key={p.id} className="flex items-center gap-4 px-4 py-3">
                <Link href={`/seller/products/${p.id}`} className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/seller/products/${p.id}`} className="block truncate font-semibold text-gray-900 hover:text-gold-deep">{p.name}</Link>
                  <p className="truncate text-xs text-gray-500">{p.category?.name || 'No category'} · {priceLabel(p)}{p.moq ? ` · MOQ ${p.moq}` : ''}</p>
                </div>
                <div className="hidden text-right text-xs text-gray-500 sm:block">
                  <p>{p.views} views · {p.inquiryCount} inquiries</p>
                  <p>{formatDate(p.updatedAt)}</p>
                </div>
                <StatusPill status={p.status} />
                <div className="flex gap-1">
                  {p.status === 'approved' && <a href={`/products/${p.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900" title="View"><Eye className="h-4 w-4" /></a>}
                  <Link href={`/seller/products/${p.id}`} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900" title="Edit"><Pencil className="h-4 w-4" /></Link>
                  {p.status === 'hidden' || p.status === 'draft' ? (
                    <button onClick={() => act(p, 'show')} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900" title="Publish"><Upload className="h-4 w-4" /></button>
                  ) : (
                    <button onClick={() => act(p, 'hide')} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900" title="Hide"><EyeOff className="h-4 w-4" /></button>
                  )}
                  <button onClick={() => act(p, 'delete')} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
