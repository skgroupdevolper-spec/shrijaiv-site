'use client';
// Admin screens for the marketplace, built on the generic ResourceManager (full CRUD + delete).
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, ExternalLink, Check, X, Star, MessageSquare } from 'lucide-react';
import ResourceManager from './ResourceManager';
import { api, toast } from './ui';
import type { Field } from '@/components/blocks/types';
import { formatDate, formatDateTime } from '@/lib/utils';
import { INDIAN_STATES } from '@/components/dashboard/fields';

const pill = (v: string) => {
  const map: Record<string, string> = { approved: 'bg-emerald-100 text-emerald-700', open: 'bg-emerald-100 text-emerald-700', active: 'bg-emerald-100 text-emerald-700', paid: 'bg-emerald-100 text-emerald-700', pending: 'bg-amber-100 text-amber-700', new: 'bg-amber-100 text-amber-700', created: 'bg-amber-100 text-amber-700', rejected: 'bg-red-100 text-red-700', suspended: 'bg-red-100 text-red-700', spam: 'bg-red-100 text-red-700', failed: 'bg-red-100 text-red-700', hidden: 'bg-gray-100 text-gray-500', draft: 'bg-gray-100 text-gray-500', closed: 'bg-gray-100 text-gray-500', expired: 'bg-gray-100 text-gray-500', cancelled: 'bg-gray-100 text-gray-500' };
  return <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-extrabold uppercase ${map[v] || 'bg-gray-100 text-gray-500'}`}>{v}</span>;
};
const opts = (list: string[]) => list.map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1).replace('_', ' ') }));
const stateOpts = INDIAN_STATES.map((s) => ({ value: s, label: s }));
const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN');

function useCategoryOptions() {
  const [cats, setCats] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    api<{ items: any[] }>('/api/admin/categories?take=200').then((d) => {
      const roots = d.items.filter((c) => !c.parentId);
      const out: { value: string; label: string }[] = [];
      for (const r of roots) {
        out.push({ value: r.id, label: r.name });
        for (const c of d.items.filter((x) => x.parentId === r.id)) out.push({ value: c.id, label: `— ${c.name}` });
      }
      setCats(out);
    }).catch(() => null);
  }, []);
  return cats;
}

/** Sellers / buyers as select options (for adding products or buy leads on their behalf) */
function useOwnerOptions(kind: 'sellers' | 'buyers') {
  const [opts, setOpts] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    api<{ items: any[] }>(`/api/admin/${kind}?take=500`).then((d) => setOpts(d.items.map((x) => ({ value: x.id, label: kind === 'sellers' ? `${x.companyName}${x.city ? ` · ${x.city}` : ''}` : `${x.user?.name || x.companyName || 'Buyer'}${x.companyName ? ` (${x.companyName})` : ''}` })))).catch(() => null);
  }, [kind]);
  return opts;
}

const ACCOUNT_FIELDS: Field[] = [
  { name: '_acc', label: 'Login account (the owner signs in with this email)', type: 'heading' },
  { name: 'ownerName', label: 'Owner name', type: 'text', half: true },
  { name: 'ownerEmail', label: 'Login email', type: 'text', half: true },
  { name: 'ownerPhone', label: 'Mobile', type: 'text', half: true },
  { name: 'ownerPassword', label: 'Password (min 8, leave empty to send a set-password link)', type: 'text', half: true },
];

/** Quick approve / reject buttons used in several lists */
function Approve({ row, resource, reload, approved = 'approved', rejected = 'rejected' }: { row: any; resource: string; reload: () => void; approved?: string; rejected?: string }) {
  async function set(status: string) {
    let adminNote: string | undefined;
    if (status === rejected) adminNote = window.prompt('Reason (sent to the member):') || undefined;
    try {
      await api(`/api/admin/${resource}/${row.id}`, 'PUT', { status, seen: true, ...(adminNote ? { adminNote } : {}) });
      toast(status === approved ? 'Approved' : 'Updated');
      reload();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  }
  if (row.status === approved) return <button onClick={() => set(rejected === 'rejected' && resource === 'products' ? 'hidden' : rejected)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" title={resource === 'products' ? 'Hide' : 'Reject / suspend'}><X className="h-4 w-4" /></button>;
  return (
    <>
      <button onClick={() => set(approved)} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" title="Approve"><Check className="h-4 w-4" /></button>
      {row.status !== rejected && <button onClick={() => set(rejected)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Reject"><X className="h-4 w-4" /></button>}
    </>
  );
}

/* ---------------------------------------------------------------- categories */
export function CategoriesManager() {
  const cats = useCategoryOptions();
  const fields: Field[] = [
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'slug', label: 'Web address (slug)', type: 'text' },
    { name: 'parentId', label: 'Parent category (empty = main category)', type: 'select', options: [{ value: '', label: '— Main category —' }, ...cats] },
    { name: 'description', label: 'Description (shown on the category page)', type: 'textarea' },
    { name: 'icon', label: 'Icon', type: 'icon', half: true },
    { name: 'order', label: 'Sort order', type: 'number', half: true },
    { name: 'image', label: 'Image', type: 'image' },
    { name: 'featured', label: 'Featured on the home page', type: 'boolean', half: true },
    { name: 'active', label: 'Active', type: 'boolean', half: true },
    { name: 'metaTitle', label: 'Google title', type: 'text' },
    { name: 'metaDescription', label: 'Google description', type: 'textarea' },
  ];
  return (
    <ResourceManager
      config={{
        resource: 'categories', title: 'Categories', subtitle: 'Unlimited tree: main categories and sub-categories. Sellers pick one per product.', singular: 'Category', fields, pageSize: 200,
        defaults: { active: true, order: 0, icon: 'leaf', parentId: '' },
        columns: [
          { key: 'name', label: 'Category', render: (r) => <div><p className="font-semibold text-gray-900">{r.parent ? <span className="text-gray-400">{r.parent.name} › </span> : null}{r.name}</p><p className="text-xs text-gray-400">/category/{r.slug}</p></div> },
          { key: '_count', label: 'Products', render: (r) => <span>{r._count?.products ?? 0}{r._count?.children ? ` · ${r._count.children} sub` : ''}</span> },
          { key: 'featured', label: 'Featured', render: (r) => (r.featured ? <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> : <span className="text-gray-300">—</span>) },
          { key: 'active', label: 'Status', render: (r) => pill(r.active ? 'active' : 'hidden') },
        ],
        extraActions: (r) => <a href={`/category/${r.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100" title="View"><ExternalLink className="h-4 w-4" /></a>,
      }}
    />
  );
}

/* ---------------------------------------------------------------- sellers */
export function SellersManager({ initialStatus }: { initialStatus?: string }) {
  const fields: Field[] = [
    { name: '_h', label: 'Moderation', type: 'heading' },
    { name: 'status', label: 'Account status', type: 'select', options: opts(['pending', 'approved', 'suspended', 'rejected']), half: true },
    { name: 'verified', label: 'Verified badge', type: 'boolean', half: true },
    { name: 'featured', label: 'Featured seller (home page)', type: 'boolean', half: true },
    { name: 'adminNote', label: 'Note to the seller (sent on reject / suspend)', type: 'textarea' },
    { name: '_h2', label: 'Company', type: 'heading' },
    { name: 'companyName', label: 'Company name', type: 'text' },
    { name: 'slug', label: 'Showroom slug', type: 'text', half: true },
    { name: 'businessType', label: 'Business type', type: 'text', half: true },
    { name: 'about', label: 'About', type: 'textarea' },
    { name: 'logo', label: 'Logo', type: 'image' },
    { name: 'banner', label: 'Banner', type: 'image' },
    { name: 'gstNumber', label: 'GST', type: 'text', half: true },
    { name: 'fssaiNumber', label: 'FSSAI', type: 'text', half: true },
    { name: 'phone', label: 'Phone', type: 'text', half: true },
    { name: 'whatsapp', label: 'WhatsApp', type: 'text', half: true },
    { name: 'email', label: 'Business email', type: 'text', half: true },
    { name: 'website', label: 'Website', type: 'text', half: true },
    { name: 'city', label: 'City', type: 'text', half: true },
    { name: 'state', label: 'State', type: 'select', options: [{ value: '', label: '—' }, ...stateOpts], half: true },
    { name: 'address', label: 'Address', type: 'text' },
    { name: 'metaTitle', label: 'Google title', type: 'text' },
    { name: 'metaDescription', label: 'Google description', type: 'textarea' },
  ];
  return (
    <ResourceManager
      config={{
        resource: 'sellers', exportType: 'sellers', title: 'Sellers', subtitle: 'Approve new sellers, award the Verified badge, suspend or delete. Click a seller to see documents.', singular: 'Seller', fields, createFields: ACCOUNT_FIELDS, defaults: { status: 'approved', verified: false }, pageSize: 50,
        initialFilters: initialStatus ? { status: initialStatus } : undefined,
        filters: [{ key: 'status', label: 'Status', options: opts(['pending', 'approved', 'suspended', 'rejected']) }, { key: 'state', label: 'States', options: stateOpts }],
        columns: [
          { key: 'companyName', label: 'Seller', render: (r) => <div className="flex items-center gap-3">{r.logo ? <img src={r.logo} alt="" className="h-9 w-9 rounded-lg object-cover" /> : <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 font-bold text-emerald-700">{r.companyName.charAt(0)}</span>}<div><p className="flex items-center gap-1 font-semibold text-gray-900">{r.companyName} {r.verified && <BadgeCheck className="h-4 w-4 text-emerald-600" />}{!r.seen && <span className="ml-1 rounded-full bg-red-500 px-1.5 text-[0.55rem] font-bold text-white">NEW</span>}</p><p className="text-xs text-gray-400">{r.user?.name} · {r.user?.email} · {r.user?.phone}</p></div></div> },
          { key: 'state', label: 'Location', className: 'hidden md:table-cell', render: (r) => <span className="text-gray-600">{[r.city, r.state].filter(Boolean).join(', ') || '—'}<br /><span className="text-xs text-gray-400">{r.businessType || ''}</span></span> },
          { key: '_count', label: 'Activity', className: 'hidden lg:table-cell', render: (r) => <span className="text-xs text-gray-500">{r._count?.products} products · {r._count?.inquiries} inquiries · {r.ratingCount ? `${r.ratingAvg.toFixed(1)}★` : 'no rating'}</span> },
          { key: 'plan', label: 'Plan', className: 'hidden lg:table-cell', render: (r) => <span className="text-xs">{r.subscriptions?.[0] ? `${r.subscriptions[0].plan.name}${r.subscriptions[0].endsAt ? ` · ${formatDate(r.subscriptions[0].endsAt)}` : ''}` : <span className="text-gray-400">free</span>}</span> },
          { key: 'status', label: 'Status', render: (r) => pill(r.status) },
          { key: 'createdAt', label: 'Joined', className: 'hidden md:table-cell', render: (r) => <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span> },
        ],
        extraActions: (r, reload) => (<><Link href={`/admin/sellers/${r.id}`} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100" title="Documents & details"><ExternalLink className="h-4 w-4" /></Link><Approve row={r} resource="sellers" reload={reload} rejected="suspended" /></>),
      }}
    />
  );
}

/* ---------------------------------------------------------------- buyers */
export function BuyersManager() {
  const fields: Field[] = [
    { name: 'status', label: 'Status', type: 'select', options: opts(['approved', 'suspended']), half: true },
    { name: 'verified', label: 'Verified buyer', type: 'boolean', half: true },
    { name: 'companyName', label: 'Company', type: 'text' },
    { name: 'buyerType', label: 'Buyer type', type: 'text', half: true },
    { name: 'gstNumber', label: 'GST', type: 'text', half: true },
    { name: 'phone', label: 'Phone', type: 'text', half: true },
    { name: 'whatsapp', label: 'WhatsApp', type: 'text', half: true },
    { name: 'city', label: 'City', type: 'text', half: true },
    { name: 'state', label: 'State', type: 'select', options: [{ value: '', label: '—' }, ...stateOpts], half: true },
    { name: 'address', label: 'Address', type: 'text' },
  ];
  return (
    <ResourceManager
      config={{
        resource: 'buyers', exportType: 'buyers', title: 'Buyers', subtitle: 'Buyer accounts. Suspend spammers, mark trusted buyers as verified.', singular: 'Buyer', fields, createFields: ACCOUNT_FIELDS, defaults: { status: 'approved' }, pageSize: 50,
        filters: [{ key: 'status', label: 'Status', options: opts(['approved', 'suspended']) }, { key: 'state', label: 'States', options: stateOpts }],
        columns: [
          { key: 'user', label: 'Buyer', render: (r) => <div><p className="flex items-center gap-1 font-semibold text-gray-900">{r.user?.name} {r.verified && <BadgeCheck className="h-4 w-4 text-emerald-600" />}{!r.seen && <span className="ml-1 rounded-full bg-red-500 px-1.5 text-[0.55rem] font-bold text-white">NEW</span>}</p><p className="text-xs text-gray-400">{r.companyName || '—'} · {r.user?.email} · {r.user?.phone}</p></div> },
          { key: 'buyerType', label: 'Type / location', className: 'hidden md:table-cell', render: (r) => <span className="text-gray-600">{r.buyerType || '—'}<br /><span className="text-xs text-gray-400">{[r.city, r.state].filter(Boolean).join(', ')}</span></span> },
          { key: '_count', label: 'Activity', className: 'hidden lg:table-cell', render: (r) => <span className="text-xs text-gray-500">{r._count?.requirements} requirements · {r._count?.inquiries} inquiries · {r._count?.reviews} reviews</span> },
          { key: 'status', label: 'Status', render: (r) => pill(r.status) },
          { key: 'createdAt', label: 'Joined', className: 'hidden md:table-cell', render: (r) => <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span> },
        ],
      }}
    />
  );
}

/* ---------------------------------------------------------------- products */
export function ProductsManager({ initialStatus }: { initialStatus?: string }) {
  const cats = useCategoryOptions();
  const sellers = useOwnerOptions('sellers');
  const fields: Field[] = [
    { name: '_h', label: 'Moderation', type: 'heading' },
    { name: 'status', label: 'Status', type: 'select', options: opts(['pending', 'approved', 'rejected', 'hidden', 'draft']), half: true },
    { name: 'featured', label: 'Featured (home page)', type: 'boolean', half: true },
    { name: 'adminNote', label: 'Note to the seller (sent on reject)', type: 'textarea' },
    { name: '_h2', label: 'Listing', type: 'heading' },
    { name: 'name', label: 'Product name', type: 'text' },
    { name: 'slug', label: 'Slug', type: 'text', half: true },
    { name: 'categoryId', label: 'Category', type: 'select', options: [{ value: '', label: '—' }, ...cats], half: true },
    { name: 'summary', label: 'Summary', type: 'textarea' },
    { name: 'description', label: 'Description (HTML)', type: 'richtext' },
    { name: 'priceMin', label: 'Price from (₹)', type: 'number', half: true },
    { name: 'priceMax', label: 'Price to (₹)', type: 'number', half: true },
    { name: 'priceUnit', label: 'Unit', type: 'text', half: true },
    { name: 'moq', label: 'MOQ', type: 'text', half: true },
    { name: 'images', label: 'Photos (first one is the main photo)', type: 'list', itemLabel: 'Photo', fields: [{ name: 'url', label: 'Photo', type: 'image' }] },
    { name: 'stock', label: 'Availability', type: 'select', options: opts(['in stock', 'made to order', 'limited']), half: true },
    { name: 'origin', label: 'Origin (state / region)', type: 'text', half: true },
    { name: 'brand', label: 'Brand', type: 'text', half: true },
    { name: 'packaging', label: 'Packaging', type: 'text', half: true },
    { name: 'shelfLife', label: 'Shelf life', type: 'text', half: true },
    { name: 'leadTime', label: 'Lead time', type: 'text', half: true },
    { name: 'tags', label: 'Tags', type: 'text' },
    { name: 'metaTitle', label: 'Google title', type: 'text' },
    { name: 'metaDescription', label: 'Google description', type: 'textarea' },
  ];
  return (
    <ResourceManager
      config={{
        resource: 'products', exportType: 'products', title: 'Products', subtitle: 'Approve, feature, edit or delete any product on the marketplace.', singular: 'Product', fields, createFields: [{ name: 'sellerId', label: 'Seller (who sells this product)', type: 'select', options: sellers }], defaults: { status: 'approved', stock: 'in stock', images: [] },
        transformBeforeEdit: (r) => { let imgs: string[] = []; try { imgs = JSON.parse(r.images || '[]'); } catch {} return { ...r, images: imgs.map((url) => ({ url })) }; },
        pageSize: 50,
        initialFilters: initialStatus ? { status: initialStatus } : undefined,
        filters: [{ key: 'status', label: 'Status', options: opts(['pending', 'approved', 'rejected', 'hidden', 'draft']) }, { key: 'categoryId', label: 'Categories', options: cats }],
        columns: [
          { key: 'name', label: 'Product', render: (r) => { let img = ''; try { img = JSON.parse(r.images || '[]')[0] || ''; } catch {} return <div className="flex items-center gap-3">{img ? <img src={img} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="h-10 w-10 rounded-lg bg-gray-100" />}<div><p className="font-semibold text-gray-900">{r.name}{!r.seen && r.status === 'pending' && <span className="ml-1 rounded-full bg-red-500 px-1.5 text-[0.55rem] font-bold text-white">NEW</span>}</p><p className="text-xs text-gray-400">{r.seller?.companyName}{r.seller?.verified ? ' ✓' : ''} · {r.category?.name || 'no category'}</p></div></div>; } },
          { key: 'priceMin', label: 'Price', className: 'hidden md:table-cell', render: (r) => <span className="text-gray-700">{r.priceMin != null ? `${inr(r.priceMin)}${r.priceMax != null && r.priceMax !== r.priceMin ? ` – ${inr(r.priceMax)}` : ''} ${r.priceUnit || ''}` : '—'}</span> },
          { key: 'views', label: 'Views / inq.', className: 'hidden lg:table-cell', render: (r) => <span className="text-xs text-gray-500">{r.views} / {r.inquiryCount}</span> },
          { key: 'featured', label: '★', render: (r) => (r.featured ? <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> : <span className="text-gray-300">—</span>) },
          { key: 'status', label: 'Status', render: (r) => pill(r.status) },
          { key: 'updatedAt', label: 'Updated', className: 'hidden md:table-cell', render: (r) => <span className="text-xs text-gray-400">{formatDate(r.updatedAt)}</span> },
        ],
        extraActions: (r, reload) => (<>{r.status === 'approved' && <a href={`/products/${r.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100" title="View"><ExternalLink className="h-4 w-4" /></a>}<Approve row={r} resource="products" reload={reload} /></>),
      }}
    />
  );
}

/* ---------------------------------------------------------------- requirements */
export function RequirementsManager() {
  const cats = useCategoryOptions();
  const buyers = useOwnerOptions('buyers');
  const fields: Field[] = [
    { name: 'status', label: 'Status', type: 'select', options: opts(['pending', 'open', 'closed', 'expired', 'rejected']), half: true },
    { name: 'featured', label: 'Hot lead (highlighted)', type: 'boolean', half: true },
    { name: 'title', label: 'Title', type: 'text' },
    { name: 'categoryId', label: 'Category', type: 'select', options: [{ value: '', label: '—' }, ...cats] },
    { name: 'details', label: 'Details', type: 'textarea' },
    { name: 'quantity', label: 'Quantity', type: 'text', half: true },
    { name: 'unit', label: 'Unit', type: 'text', half: true },
    { name: 'budgetMin', label: 'Budget from', type: 'number', half: true },
    { name: 'budgetMax', label: 'Budget to', type: 'number', half: true },
    { name: 'deliveryCity', label: 'Delivery city', type: 'text', half: true },
    { name: 'deliveryState', label: 'Delivery state', type: 'text', half: true },
    { name: 'adminNote', label: 'Internal note', type: 'textarea' },
  ];
  return (
    <ResourceManager
      config={{
        resource: 'requirements', exportType: 'requirements', title: 'Requirements (buy leads)', subtitle: 'Moderate, highlight or close requirements posted by buyers.', singular: 'Requirement', fields, createFields: [{ name: 'buyerId', label: 'Buyer (posted on behalf of)', type: 'select', options: buyers }], defaults: { status: 'open' }, pageSize: 50,
        filters: [{ key: 'status', label: 'Status', options: opts(['pending', 'open', 'closed', 'expired', 'rejected']) }, { key: 'categoryId', label: 'Categories', options: cats }],
        columns: [
          { key: 'title', label: 'Requirement', render: (r) => <div><p className="font-semibold text-gray-900">{r.title}{!r.seen && <span className="ml-1 rounded-full bg-red-500 px-1.5 text-[0.55rem] font-bold text-white">NEW</span>}</p><p className="text-xs text-gray-400">{r.buyer?.user?.name} · {r.buyer?.companyName || r.buyer?.buyerType || ''} · {[r.deliveryCity, r.deliveryState].filter(Boolean).join(', ')}</p></div> },
          { key: 'quantity', label: 'Qty', className: 'hidden md:table-cell', render: (r) => <span>{r.quantity ? `${r.quantity} ${r.unit || ''}` : '—'}</span> },
          { key: '_count', label: 'Quotes', render: (r) => <span>{r._count?.quotes ?? r.quoteCount}</span> },
          { key: 'status', label: 'Status', render: (r) => pill(r.status) },
          { key: 'createdAt', label: 'Posted', className: 'hidden md:table-cell', render: (r) => <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span> },
        ],
        extraActions: (r, reload) => (<><a href={`/requirements/${r.id}`} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100" title="View"><ExternalLink className="h-4 w-4" /></a>{r.status === 'pending' && <Approve row={r} resource="requirements" reload={reload} approved="open" />}</>),
      }}
    />
  );
}

/* ---------------------------------------------------------------- inquiries */
export function InquiriesManager() {
  const fields: Field[] = [
    { name: 'status', label: 'Status', type: 'select', options: opts(['new', 'replied', 'quoted', 'closed', 'spam']), half: true },
    { name: 'contactUnlocked', label: 'Buyer contact visible to the seller', type: 'boolean', half: true },
    { name: 'adminNote', label: 'Internal note', type: 'textarea' },
  ];
  return (
    <ResourceManager
      config={{
        resource: 'inquiries', exportType: 'inquiries', title: 'Inquiries', subtitle: 'Every buyer → seller inquiry. Open one to read the conversation and step in.', singular: 'Inquiry', fields, canCreate: false, pageSize: 50,
        filters: [{ key: 'status', label: 'Status', options: opts(['new', 'replied', 'quoted', 'closed', 'spam']) }],
        columns: [
          { key: 'refNo', label: 'Inquiry', render: (r) => <div><p className="font-semibold text-gray-900">{r.name}{r.company ? ` · ${r.company}` : ''}{!r.seenByAdmin && <span className="ml-1 rounded-full bg-red-500 px-1.5 text-[0.55rem] font-bold text-white">NEW</span>}</p><p className="text-xs text-gray-400">{r.refNo} → {r.seller?.companyName}{r.product ? ` · ${r.product.name}` : ''}</p></div> },
          { key: 'message', label: 'Message', className: 'hidden md:table-cell max-w-[320px]', render: (r) => <p className="line-clamp-2 text-xs text-gray-500">{r.message}</p> },
          { key: '_count', label: 'Msgs', render: (r) => <span className="inline-flex items-center gap-1 text-xs"><MessageSquare className="h-3 w-3" /> {r._count?.messages}</span> },
          { key: 'status', label: 'Status', render: (r) => pill(r.status) },
          { key: 'lastMessageAt', label: 'Last', className: 'hidden md:table-cell', render: (r) => <span className="text-xs text-gray-400">{formatDateTime(r.lastMessageAt)}</span> },
        ],
        extraActions: (r) => <Link href={`/admin/inquiries/${r.id}`} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100" title="Open conversation"><ExternalLink className="h-4 w-4" /></Link>,
      }}
    />
  );
}

/* ---------------------------------------------------------------- reviews */
export function ReviewsManager() {
  const fields: Field[] = [
    { name: 'status', label: 'Status', type: 'select', options: opts(['pending', 'approved', 'hidden', 'spam']), half: true },
    { name: 'verifiedPurchase', label: 'Verified buyer', type: 'boolean', half: true },
    { name: 'rating', label: 'Rating (1-5)', type: 'number', half: true },
    { name: 'title', label: 'Title', type: 'text', half: true },
    { name: 'body', label: 'Review', type: 'textarea' },
    { name: 'reply', label: "Seller's reply", type: 'textarea' },
  ];
  return (
    <ResourceManager
      config={{
        resource: 'reviews', title: 'Reviews & ratings', subtitle: 'Approve, hide, edit or delete reviews. Ratings recalculate automatically.', singular: 'Review', fields, canCreate: false, pageSize: 50,
        filters: [{ key: 'status', label: 'Status', options: opts(['pending', 'approved', 'hidden', 'spam']) }],
        columns: [
          { key: 'authorName', label: 'Review', render: (r) => <div><p className="font-semibold text-gray-900">{r.authorName} <span className="text-amber-500">{'★'.repeat(r.rating)}</span>{r.verifiedPurchase && <BadgeCheck className="ml-1 inline h-4 w-4 text-emerald-600" />}</p><p className="text-xs text-gray-400">for {r.seller?.companyName}{r.product ? ` · ${r.product.name}` : ''}</p></div> },
          { key: 'body', label: 'Text', className: 'hidden md:table-cell max-w-[360px]', render: (r) => <p className="line-clamp-2 text-xs text-gray-500">{r.title ? <b>{r.title} — </b> : null}{r.body}</p> },
          { key: 'status', label: 'Status', render: (r) => pill(r.status) },
          { key: 'createdAt', label: 'Date', className: 'hidden md:table-cell', render: (r) => <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span> },
        ],
        extraActions: (r, reload) => <Approve row={r} resource="reviews" reload={reload} rejected="hidden" />,
      }}
    />
  );
}

/* ---------------------------------------------------------------- plans */
export function PlansManager() {
  const fields: Field[] = [
    { name: 'name', label: 'Plan name', type: 'text', half: true },
    { name: 'slug', label: 'Slug', type: 'text', half: true },
    { name: 'description', label: 'One-line description', type: 'text' },
    { name: 'price', label: 'Price (₹, before GST; 0 = free)', type: 'number', half: true },
    { name: 'period', label: 'Billing period', type: 'select', options: [{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'yearly', label: 'Yearly' }, { value: 'lifetime', label: 'Lifetime (one payment)' }, { value: 'custom', label: 'Custom (days)' }], half: true },
    { name: 'periodDays', label: 'Days (custom period)', type: 'number', half: true },
    { name: 'trialDays', label: 'Free trial days', type: 'number', half: true },
    { name: 'autoRenew', label: 'Offer auto-renewal', type: 'boolean', half: true },
    { name: 'highlight', label: '"Most popular" label', type: 'boolean', half: true },
    { name: '_h', label: 'Limits (-1 = unlimited)', type: 'heading' },
    { name: 'maxProducts', label: 'Products', type: 'number', half: true },
    { name: 'maxImages', label: 'Images per product', type: 'number', half: true },
    { name: 'maxInquiries', label: 'Buyer contacts / month', type: 'number', half: true },
    { name: 'maxQuotes', label: 'Quotes / month', type: 'number', half: true },
    { name: 'featuredSlots', label: 'Featured product slots', type: 'number', half: true },
    { name: 'priorityRank', label: 'Priority in listings (0-10)', type: 'number', half: true },
    { name: 'verifiedBadge', label: 'Verified badge eligible', type: 'boolean', half: true },
    { name: 'analytics', label: 'Analytics', type: 'boolean', half: true },
    { name: 'aiTools', label: 'AI tools', type: 'boolean', half: true },
    { name: 'features', label: 'Feature lines on the pricing page (one per line)', type: 'lines' },
    { name: 'order', label: 'Sort order', type: 'number', half: true },
    { name: 'active', label: 'Active', type: 'boolean', half: true },
  ];
  return (
    <ResourceManager
      config={{
        resource: 'plans', title: 'Membership plans', subtitle: 'Monthly, quarterly, yearly, lifetime or custom. The Paid plans master switch is under Marketplace settings.', singular: 'Plan', fields, pageSize: 50,
        defaults: { price: 0, period: 'monthly', trialDays: 0, audience: 'seller', maxProducts: -1, maxInquiries: -1, maxQuotes: -1, maxImages: -1, featuredSlots: 0, priorityRank: 0, verifiedBadge: true, analytics: true, aiTools: true, autoRenew: true, active: true, order: 0, features: [] },
        transformBeforeEdit: (r) => ({ ...r, features: (() => { try { return JSON.parse(r.features || '[]').join('\n'); } catch { return ''; } })() }),
        columns: [
          { key: 'name', label: 'Plan', render: (r) => <div><p className="font-semibold text-gray-900">{r.name} {r.highlight && <Star className="inline h-4 w-4 fill-amber-400 text-amber-400" />}</p><p className="text-xs text-gray-400">/{r.slug} · {r._count?.subscriptions || 0} subscribers</p></div> },
          { key: 'price', label: 'Price', render: (r) => <span className="font-bold">{r.price ? inr(r.price) : 'Free'} <span className="text-xs font-normal text-gray-400">/ {r.period}{r.period === 'custom' ? ` (${r.periodDays}d)` : ''}</span></span> },
          { key: 'maxProducts', label: 'Limits', className: 'hidden md:table-cell', render: (r) => <span className="text-xs text-gray-500">{r.maxProducts < 0 ? '∞' : r.maxProducts} products · {r.maxInquiries < 0 ? '∞' : r.maxInquiries} contacts · {r.maxQuotes < 0 ? '∞' : r.maxQuotes} quotes{r.verifiedBadge ? ' · badge' : ''}{r.featuredSlots ? ` · ${r.featuredSlots} featured` : ''}</span> },
          { key: 'autoRenew', label: 'Auto-renew', className: 'hidden md:table-cell', render: (r) => <span className="text-xs">{r.autoRenew ? 'offered' : 'no'}</span> },
          { key: 'active', label: 'Status', render: (r) => pill(r.active ? 'active' : 'hidden') },
        ],
      }}
    />
  );
}

/* ---------------------------------------------------------------- coupons */
export function CouponsManager() {
  const fields: Field[] = [
    { name: 'code', label: 'Code', type: 'text', half: true },
    { name: 'type', label: 'Type', type: 'select', options: [{ value: 'percent', label: '% off' }, { value: 'flat', label: '₹ off' }], half: true },
    { name: 'value', label: 'Value', type: 'number', half: true },
    { name: 'maxUses', label: 'Max uses (0 = unlimited)', type: 'number', half: true },
    { name: 'startsAt', label: 'Valid from', type: 'text', half: true },
    { name: 'endsAt', label: 'Valid until', type: 'text', half: true },
    { name: 'active', label: 'Active', type: 'boolean' },
  ];
  return <ResourceManager config={{ resource: 'coupons', title: 'Coupons', subtitle: 'Discount codes for membership plans (one-time payments).', singular: 'Coupon', fields, defaults: { type: 'percent', value: 10, maxUses: 0, active: true, planIds: [] }, columns: [{ key: 'code', label: 'Code', render: (r) => <b>{r.code}</b> }, { key: 'value', label: 'Discount', render: (r) => <span>{r.type === 'percent' ? `${r.value}%` : inr(r.value)}</span> }, { key: 'used', label: 'Used', render: (r) => <span>{r.used}{r.maxUses ? ` / ${r.maxUses}` : ''}</span> }, { key: 'active', label: 'Status', render: (r) => pill(r.active ? 'active' : 'hidden') }] }} />;
}

/* ---------------------------------------------------------------- subscriptions & payments */
export function SubscriptionsManager() {
  const fields: Field[] = [
    { name: 'status', label: 'Status', type: 'select', options: opts(['trial', 'active', 'past_due', 'cancelled', 'expired']), half: true },
    { name: 'autoRenew', label: 'Auto-renew', type: 'boolean', half: true },
    { name: 'endsAt', label: 'Ends at (YYYY-MM-DD)', type: 'text' },
    { name: 'adminNote', label: 'Note', type: 'textarea' },
  ];
  return <ResourceManager config={{ resource: 'subscriptions', title: 'Subscriptions', subtitle: 'Active plans per seller. Extend, cancel or activate manually (bank transfer).', singular: 'Subscription', fields, canCreate: false, pageSize: 50, filters: [{ key: 'status', label: 'Status', options: opts(['trial', 'active', 'past_due', 'cancelled', 'expired']) }], columns: [{ key: 'seller', label: 'Seller', render: (r) => <div><p className="font-semibold text-gray-900">{r.seller?.companyName}</p><p className="text-xs text-gray-400">{r.plan?.name} · {r.source}{r.razorpaySubscriptionId ? ' · auto' : ''}</p></div> }, { key: 'startsAt', label: 'Period', render: (r) => <span className="text-xs">{formatDate(r.startsAt)} → {r.endsAt ? formatDate(r.endsAt) : 'lifetime'}</span> }, { key: 'autoRenew', label: 'Renew', render: (r) => <span className="text-xs">{r.autoRenew ? 'on' : 'off'}</span> }, { key: 'status', label: 'Status', render: (r) => pill(r.status) }] }} />;
}

export function PaymentsManager() {
  const fields: Field[] = [
    { name: 'status', label: 'Status', type: 'select', options: opts(['created', 'paid', 'failed', 'refunded']), half: true },
    { name: 'method', label: 'Method', type: 'text', half: true },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ];
  return <ResourceManager config={{ resource: 'payments', title: 'Payments & invoices', subtitle: 'Razorpay and manual payments. Mark a bank transfer as paid from Subscriptions → activate.', singular: 'Payment', fields, canCreate: false, pageSize: 50, exportType: 'payments', filters: [{ key: 'status', label: 'Status', options: opts(['created', 'paid', 'failed', 'refunded']) }], columns: [{ key: 'invoiceNo', label: 'Invoice', render: (r) => <div><p className="font-mono text-xs font-bold">{r.invoiceNo || '—'}</p><p className="text-xs text-gray-400">{r.subscription?.seller?.companyName || r.notes?.slice(0, 60)} · {r.subscription?.plan?.name || ''}</p></div> }, { key: 'amount', label: 'Amount', render: (r) => <span className="font-bold">{inr(r.amount + r.gst)} <span className="text-xs font-normal text-gray-400">(GST {inr(r.gst)})</span></span> }, { key: 'provider', label: 'Via', className: 'hidden md:table-cell', render: (r) => <span className="text-xs">{r.provider}{r.method ? ` · ${r.method}` : ''}</span> }, { key: 'status', label: 'Status', render: (r) => pill(r.status) }, { key: 'createdAt', label: 'Date', className: 'hidden md:table-cell', render: (r) => <span className="text-xs text-gray-400">{formatDateTime(r.paidAt || r.createdAt)}</span> }] }} />;
}

export function ReportsManager() {
  const fields: Field[] = [{ name: 'status', label: 'Status', type: 'select', options: opts(['open', 'resolved', 'dismissed']) }, { name: 'adminNote', label: 'Resolution note', type: 'textarea' }];
  return <ResourceManager config={{ resource: 'reports', title: 'Reports & flags', subtitle: 'Problems reported by members (fake listings, abusive reviews…).', singular: 'Report', fields, canCreate: false, filters: [{ key: 'status', label: 'Status', options: opts(['open', 'resolved', 'dismissed']) }], columns: [{ key: 'reason', label: 'Report', render: (r) => <div><p className="font-semibold text-gray-900">{r.reason}</p><p className="text-xs text-gray-400">{r.targetType} · {r.targetId}</p></div> }, { key: 'details', label: 'Details', className: 'hidden md:table-cell max-w-[360px]', render: (r) => <p className="line-clamp-2 text-xs text-gray-500">{r.details}</p> }, { key: 'status', label: 'Status', render: (r) => pill(r.status) }, { key: 'createdAt', label: 'Date', render: (r) => <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span> }] }} />;
}

export function RedirectsManager() {
  const fields: Field[] = [{ name: 'from', label: 'From path (e.g. /old-page)', type: 'text', half: true }, { name: 'to', label: 'To (path or URL)', type: 'text', half: true }, { name: 'code', label: 'Code', type: 'select', options: [{ value: '301', label: '301 permanent' }, { value: '302', label: '302 temporary' }], half: true }, { name: 'active', label: 'Active', type: 'boolean', half: true }];
  return <ResourceManager config={{ resource: 'redirects', title: 'Redirects', subtitle: 'Send old URLs to new ones (SEO). Applied on every request.', singular: 'Redirect', fields, defaults: { code: 301, active: true }, columns: [{ key: 'from', label: 'From', render: (r) => <code className="text-xs">{r.from}</code> }, { key: 'to', label: 'To', render: (r) => <code className="text-xs">{r.to}</code> }, { key: 'code', label: 'Code' }, { key: 'hits', label: 'Hits' }, { key: 'active', label: 'Status', render: (r) => pill(r.active ? 'active' : 'hidden') }] }} />;
}

export function AuditLogManager() {
  return <ResourceManager config={{ resource: 'auditlog', title: 'Audit log', subtitle: 'Who changed what in the admin panel.', singular: 'Entry', fields: [], canCreate: false, canEdit: false, pageSize: 100, columns: [{ key: 'createdAt', label: 'When', render: (r) => <span className="text-xs text-gray-500">{formatDateTime(r.createdAt)}</span> }, { key: 'userName', label: 'Who', render: (r) => <b>{r.userName || 'system'}</b> }, { key: 'action', label: 'Action', render: (r) => pill(r.action) }, { key: 'entity', label: 'What', render: (r) => <span className="text-xs">{r.entity} {r.entityId ? <code className="text-gray-400">{String(r.entityId).slice(-6)}</code> : ''} · {r.summary}</span> }] }} />;
}
