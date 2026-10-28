// Server-side config for the generic admin CRUD API (/api/admin/[resource])
type FieldKind = 'string' | 'int' | 'float' | 'bool' | 'date' | 'json';

export type ResourceConfig = {
  model: string;
  search: string[];
  orderBy: any;
  fields: Record<string, FieldKind>;
  required?: string[];
  adminOnly?: boolean;
  unique?: string; // slug-like field to auto-generate
  select?: any;
  filters?: string[];
};

export const RESOURCES: Record<string, ResourceConfig> = {
  pages: {
    model: 'page',
    search: ['title', 'slug'],
    orderBy: { updatedAt: 'desc' },
    fields: { title: 'string', slug: 'string', metaTitle: 'string', metaDescription: 'string', ogImage: 'string', blocks: 'json', status: 'string', inMenu: 'bool' },
    required: ['title', 'slug'],
    unique: 'slug',
    filters: ['status'],
  },
  posts: {
    model: 'post',
    search: ['title', 'slug', 'category'],
    orderBy: { publishedAt: 'desc' },
    fields: {
      title: 'string',
      slug: 'string',
      excerpt: 'string',
      content: 'string',
      cover: 'string',
      category: 'string',
      tags: 'string',
      author: 'string',
      status: 'string',
      metaTitle: 'string',
      metaDescription: 'string',
      publishedAt: 'date',
    },
    required: ['title', 'slug'],
    unique: 'slug',
    filters: ['status', 'category'],
  },
  services: {
    model: 'service',
    search: ['title', 'subtitle'],
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
    fields: { title: 'string', slug: 'string', subtitle: 'string', description: 'string', price: 'string', icon: 'string', image: 'string', link: 'string', category: 'string', featured: 'bool', active: 'bool', order: 'int' },
    required: ['title'],
    filters: ['category'],
  },
  faqs: {
    model: 'faq',
    search: ['question', 'answer', 'group'],
    orderBy: [{ group: 'asc' }, { order: 'asc' }],
    fields: { question: 'string', answer: 'string', group: 'string', order: 'int', active: 'bool' },
    required: ['question', 'answer'],
    filters: ['group'],
  },
  testimonials: {
    model: 'testimonial',
    search: ['name', 'text', 'country'],
    orderBy: { order: 'asc' },
    fields: { name: 'string', role: 'string', country: 'string', rating: 'int', text: 'string', avatar: 'string', order: 'int', active: 'bool' },
    required: ['name', 'text'],
  },
  partners: {
    model: 'partner',
    search: ['name'],
    orderBy: { order: 'asc' },
    fields: { name: 'string', logo: 'string', url: 'string', order: 'int', active: 'bool' },
    required: ['name'],
  },
  leads: {
    model: 'lead',
    search: ['name', 'email', 'phone', 'service', 'message'],
    orderBy: { createdAt: 'desc' },
    fields: { name: 'string', email: 'string', phone: 'string', nationality: 'string', service: 'string', message: 'string', source: 'string', status: 'string', notes: 'string', seen: 'bool' },
    required: ['name'],
    filters: ['status', 'service'],
  },
  subscribers: {
    model: 'subscriber',
    search: ['email'],
    orderBy: { createdAt: 'desc' },
    fields: { email: 'string' },
    required: ['email'],
  },
  users: {
    model: 'user',
    search: ['name', 'email', 'phone'],
    orderBy: { createdAt: 'desc' },
    fields: { name: 'string', email: 'string', phone: 'string', nationality: 'string', role: 'string', active: 'bool' },
    required: ['name', 'email'],
    adminOnly: true,
    filters: ['role'],
    select: { id: true, name: true, email: true, phone: true, nationality: true, role: true, active: true, lastLoginAt: true, createdAt: true, _count: { select: { applications: true } } },
  },
  media: {
    model: 'media',
    search: ['filename', 'alt'],
    orderBy: { createdAt: 'desc' },
    fields: { alt: 'string' },
  },

  // ---------------------------------------------------------------- marketplace
  categories: {
    model: 'category',
    search: ['name', 'slug', 'description'],
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    fields: { name: 'string', slug: 'string', description: 'string', icon: 'string', image: 'string', parentId: 'string', order: 'int', featured: 'bool', active: 'bool', metaTitle: 'string', metaDescription: 'string' },
    required: ['name'],
    unique: 'slug',
    select: { id: true, name: true, slug: true, description: true, icon: true, image: true, parentId: true, order: true, featured: true, active: true, metaTitle: true, metaDescription: true, updatedAt: true, parent: { select: { name: true } }, _count: { select: { products: true, children: true } } },
  },
  sellers: {
    model: 'sellerProfile',
    search: ['companyName', 'slug', 'city', 'state', 'gstNumber', 'email', 'phone'],
    orderBy: { createdAt: 'desc' },
    fields: { companyName: 'string', slug: 'string', about: 'string', logo: 'string', banner: 'string', businessType: 'string', gstNumber: 'string', fssaiNumber: 'string', yearEstablished: 'int', employees: 'string', annualTurnover: 'string', website: 'string', phone: 'string', whatsapp: 'string', email: 'string', address: 'string', city: 'string', state: 'string', pincode: 'string', certifications: 'json', status: 'string', verified: 'bool', featured: 'bool', adminNote: 'string', seen: 'bool', metaTitle: 'string', metaDescription: 'string' },
    filters: ['status', 'state', 'businessType'],
    select: { id: true, userId: true, slug: true, companyName: true, about: true, logo: true, banner: true, businessType: true, gstNumber: true, fssaiNumber: true, yearEstablished: true, employees: true, annualTurnover: true, website: true, phone: true, whatsapp: true, email: true, address: true, city: true, state: true, pincode: true, certifications: true, status: true, verified: true, verifiedAt: true, featured: true, ratingAvg: true, ratingCount: true, views: true, adminNote: true, seen: true, metaTitle: true, metaDescription: true, createdAt: true, updatedAt: true, user: { select: { name: true, email: true, phone: true, active: true, lastLoginAt: true } }, _count: { select: { products: true, inquiries: true, reviews: true } }, subscriptions: { where: { status: { in: ['active', 'trial', 'past_due'] } }, select: { status: true, endsAt: true, autoRenew: true, plan: { select: { name: true } } }, take: 1 } },
  },
  buyers: {
    model: 'buyerProfile',
    search: ['companyName', 'city', 'state', 'phone'],
    orderBy: { createdAt: 'desc' },
    fields: { companyName: 'string', buyerType: 'string', gstNumber: 'string', phone: 'string', whatsapp: 'string', address: 'string', city: 'string', state: 'string', pincode: 'string', verified: 'bool', status: 'string', seen: 'bool' },
    filters: ['status', 'state', 'buyerType'],
    select: { id: true, userId: true, companyName: true, buyerType: true, gstNumber: true, phone: true, whatsapp: true, address: true, city: true, state: true, pincode: true, verified: true, status: true, seen: true, createdAt: true, user: { select: { name: true, email: true, phone: true, active: true, lastLoginAt: true } }, _count: { select: { requirements: true, inquiries: true, reviews: true } } },
  },
  products: {
    model: 'product',
    search: ['name', 'slug', 'summary', 'tags', 'brand'],
    orderBy: { updatedAt: 'desc' },
    fields: { name: 'string', slug: 'string', summary: 'string', description: 'string', images: 'json', video: 'string', catalogFile: 'string', priceMin: 'float', priceMax: 'float', priceUnit: 'string', moq: 'string', stock: 'string', specs: 'json', certifications: 'json', tags: 'string', origin: 'string', brand: 'string', packaging: 'string', shelfLife: 'string', leadTime: 'string', categoryId: 'string', status: 'string', featured: 'bool', adminNote: 'string', seen: 'bool', metaTitle: 'string', metaDescription: 'string' },
    filters: ['status', 'categoryId', 'sellerId'],
    unique: 'slug',
    select: { id: true, sellerId: true, categoryId: true, slug: true, name: true, summary: true, description: true, images: true, video: true, catalogFile: true, priceMin: true, priceMax: true, priceUnit: true, moq: true, stock: true, specs: true, certifications: true, tags: true, origin: true, brand: true, packaging: true, shelfLife: true, leadTime: true, status: true, featured: true, views: true, inquiryCount: true, ratingAvg: true, ratingCount: true, adminNote: true, seen: true, metaTitle: true, metaDescription: true, createdAt: true, updatedAt: true, seller: { select: { id: true, companyName: true, slug: true, verified: true, status: true } }, category: { select: { name: true } } },
  },
  requirements: {
    model: 'requirement',
    search: ['title', 'details', 'deliveryCity', 'deliveryState'],
    orderBy: { createdAt: 'desc' },
    fields: { title: 'string', details: 'string', categoryId: 'string', quantity: 'string', unit: 'string', budgetMin: 'float', budgetMax: 'float', deliveryCity: 'string', deliveryState: 'string', status: 'string', featured: 'bool', adminNote: 'string', seen: 'bool' },
    filters: ['status', 'categoryId'],
    select: { id: true, buyerId: true, categoryId: true, title: true, details: true, quantity: true, unit: true, budgetMin: true, budgetMax: true, deliveryCity: true, deliveryState: true, neededBy: true, attachments: true, status: true, featured: true, views: true, quoteCount: true, seen: true, adminNote: true, expiresAt: true, createdAt: true, updatedAt: true, buyer: { select: { id: true, companyName: true, buyerType: true, city: true, state: true, user: { select: { name: true, email: true, phone: true } } } }, category: { select: { name: true } }, _count: { select: { quotes: true } } },
  },
  inquiries: {
    model: 'inquiry',
    search: ['refNo', 'name', 'email', 'phone', 'company', 'message'],
    orderBy: { lastMessageAt: 'desc' },
    fields: { status: 'string', adminNote: 'string', seenByAdmin: 'bool', contactUnlocked: 'bool' },
    filters: ['status', 'sellerId'],
    select: { id: true, refNo: true, sellerId: true, buyerId: true, productId: true, name: true, email: true, phone: true, company: true, city: true, quantity: true, message: true, status: true, contactUnlocked: true, seenBySeller: true, seenByBuyer: true, seenByAdmin: true, adminNote: true, lastMessageAt: true, createdAt: true, seller: { select: { companyName: true, slug: true } }, product: { select: { name: true, slug: true } }, _count: { select: { messages: true } } },
  },
  reviews: {
    model: 'review',
    search: ['authorName', 'title', 'body'],
    orderBy: { createdAt: 'desc' },
    fields: { rating: 'int', title: 'string', body: 'string', reply: 'string', status: 'string', verifiedPurchase: 'bool', seen: 'bool' },
    filters: ['status', 'sellerId'],
    select: { id: true, sellerId: true, productId: true, buyerId: true, authorName: true, rating: true, title: true, body: true, reply: true, status: true, verifiedPurchase: true, createdAt: true, seller: { select: { companyName: true, slug: true } }, product: { select: { name: true } } },
  },
  plans: {
    model: 'plan',
    search: ['name', 'slug'],
    orderBy: [{ order: 'asc' }, { price: 'asc' }],
    fields: { name: 'string', slug: 'string', description: 'string', price: 'float', period: 'string', periodDays: 'int', trialDays: 'int', audience: 'string', maxProducts: 'int', maxInquiries: 'int', maxQuotes: 'int', maxImages: 'int', featuredSlots: 'int', verifiedBadge: 'bool', priorityRank: 'int', analytics: 'bool', aiTools: 'bool', features: 'json', highlight: 'bool', autoRenew: 'bool', order: 'int', active: 'bool' },
    required: ['name'],
    unique: 'slug',
    adminOnly: true,
    select: { id: true, name: true, slug: true, description: true, price: true, period: true, periodDays: true, trialDays: true, audience: true, maxProducts: true, maxInquiries: true, maxQuotes: true, maxImages: true, featuredSlots: true, verifiedBadge: true, priorityRank: true, analytics: true, aiTools: true, features: true, highlight: true, autoRenew: true, razorpayPlanId: true, order: true, active: true, _count: { select: { subscriptions: true } } },
  },
  coupons: {
    model: 'coupon',
    search: ['code'],
    orderBy: { createdAt: 'desc' },
    fields: { code: 'string', type: 'string', value: 'float', maxUses: 'int', planIds: 'json', startsAt: 'date', endsAt: 'date', active: 'bool' },
    required: ['code', 'value'],
    adminOnly: true,
  },
  subscriptions: {
    model: 'subscription',
    search: [],
    orderBy: { createdAt: 'desc' },
    fields: { status: 'string', autoRenew: 'bool', endsAt: 'date', adminNote: 'string', planId: 'string' },
    filters: ['status', 'sellerId'],
    adminOnly: true,
    select: { id: true, sellerId: true, planId: true, status: true, autoRenew: true, startsAt: true, endsAt: true, source: true, adminNote: true, razorpaySubscriptionId: true, createdAt: true, plan: { select: { name: true, price: true, period: true } }, seller: { select: { companyName: true, slug: true } }, _count: { select: { payments: true } } },
  },
  payments: {
    model: 'payment',
    search: ['invoiceNo', 'providerPaymentId', 'providerOrderId', 'couponCode', 'notes'],
    orderBy: { createdAt: 'desc' },
    fields: { status: 'string', notes: 'string', method: 'string' },
    filters: ['status', 'provider'],
    adminOnly: true,
    select: { id: true, subscriptionId: true, userId: true, amount: true, gst: true, status: true, provider: true, providerOrderId: true, providerPaymentId: true, method: true, invoiceNo: true, couponCode: true, notes: true, paidAt: true, createdAt: true, subscription: { select: { seller: { select: { companyName: true } }, plan: { select: { name: true } } } } },
  },
  reports: {
    model: 'report',
    search: ['reason', 'details', 'targetId'],
    orderBy: { createdAt: 'desc' },
    fields: { status: 'string', adminNote: 'string' },
    filters: ['status', 'targetType'],
  },
  redirects: {
    model: 'redirect',
    search: ['from', 'to'],
    orderBy: { createdAt: 'desc' },
    fields: { from: 'string', to: 'string', code: 'int', active: 'bool' },
    required: ['from', 'to'],
    adminOnly: true,
  },
  auditlog: {
    model: 'auditLog',
    search: ['userName', 'action', 'entity', 'summary'],
    orderBy: { createdAt: 'desc' },
    fields: {},
    filters: ['entity', 'action'],
    adminOnly: true,
  },
  notifications: {
    model: 'notification',
    search: ['title', 'body'],
    orderBy: { createdAt: 'desc' },
    fields: { read: 'bool' },
    filters: ['type'],
  },
  applications: {
    model: 'application',
    search: ['refNo', 'fullName', 'email', 'phone', 'service', 'passportNo'],
    orderBy: { createdAt: 'desc' },
    fields: { status: 'string', progress: 'int', adminNote: 'string', seen: 'bool', service: 'string' },
    filters: ['status', 'service'],
  },
};

export function cleanData(cfg: ResourceConfig, body: any, partial = false) {
  const out: any = {};
  for (const [k, kind] of Object.entries(cfg.fields)) {
    if (!(k in body)) continue;
    let v = body[k];
    if (kind === 'int') v = v === '' || v === null ? 0 : parseInt(v, 10) || 0;
    else if (kind === 'float') v = v === '' || v === null || v === undefined ? null : Number(v) || 0;
    else if (kind === 'bool') v = v === true || v === 'true' || v === 1 || v === '1' || v === 'on';
    else if (kind === 'date') v = v ? new Date(v) : k === 'publishedAt' ? new Date() : null;
    else if (kind === 'json') v = typeof v === 'string' ? v : JSON.stringify(v ?? []);
    else v = v === null || v === undefined ? null : String(v);
    out[k] = v;
  }
  if (!partial) {
    for (const r of cfg.required || []) {
      if (out[r] === undefined || out[r] === null || out[r] === '') throw new Error(`${r} is required`);
    }
  }
  return out;
}
