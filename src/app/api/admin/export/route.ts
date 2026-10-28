import { prisma } from '@/lib/db';
import { requireStaff } from '@/lib/auth';

function csv(rows: any[], cols: string[]) {
  const esc = (v: any) => {
    const s = v === null || v === undefined ? '' : v instanceof Date ? v.toISOString() : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

export async function GET(req: Request) {
  const s = await requireStaff();
  if (!s) return new Response('Unauthorized', { status: 401 });
  const type = new URL(req.url).searchParams.get('type') || 'leads';
  let body = '';
  if (type === 'leads') {
    const rows = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
    body = csv(rows, ['createdAt', 'name', 'phone', 'email', 'nationality', 'service', 'status', 'message', 'source', 'notes']);
  } else if (type === 'applications') {
    const rows = await prisma.application.findMany({ orderBy: { createdAt: 'desc' } });
    body = csv(rows, ['createdAt', 'refNo', 'fullName', 'email', 'phone', 'nationality', 'service', 'status', 'progress', 'propertyValue', 'familyMembers', 'passportNo']);
  } else if (type === 'subscribers') {
    const rows = await prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' } });
    body = csv(rows, ['createdAt', 'email']);
  } else if (type === 'sellers') {
    const rows = await prisma.sellerProfile.findMany({ orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true, phone: true } } } });
    body = csv(rows.map((r) => ({ ...r, ownerName: r.user.name, ownerEmail: r.user.email, ownerPhone: r.user.phone })), ['createdAt', 'companyName', 'ownerName', 'ownerEmail', 'ownerPhone', 'businessType', 'city', 'state', 'gstNumber', 'fssaiNumber', 'status', 'verified', 'ratingAvg', 'ratingCount', 'views']);
  } else if (type === 'buyers') {
    const rows = await prisma.buyerProfile.findMany({ orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true, phone: true } } } });
    body = csv(rows.map((r) => ({ ...r, ownerName: r.user.name, ownerEmail: r.user.email, ownerPhone: r.user.phone })), ['createdAt', 'ownerName', 'ownerEmail', 'ownerPhone', 'companyName', 'buyerType', 'city', 'state', 'status', 'verified']);
  } else if (type === 'products') {
    const rows = await prisma.product.findMany({ orderBy: { createdAt: 'desc' }, include: { seller: { select: { companyName: true } }, category: { select: { name: true } } } });
    body = csv(rows.map((r) => ({ ...r, sellerName: r.seller.companyName, categoryName: r.category?.name })), ['createdAt', 'name', 'slug', 'sellerName', 'categoryName', 'priceMin', 'priceMax', 'priceUnit', 'moq', 'status', 'views', 'inquiryCount', 'ratingAvg']);
  } else if (type === 'inquiries') {
    const rows = await prisma.inquiry.findMany({ orderBy: { createdAt: 'desc' }, include: { seller: { select: { companyName: true } }, product: { select: { name: true } } } });
    body = csv(rows.map((r) => ({ ...r, sellerName: r.seller.companyName, productName: r.product?.name })), ['createdAt', 'refNo', 'name', 'email', 'phone', 'company', 'city', 'sellerName', 'productName', 'quantity', 'status', 'message']);
  } else if (type === 'requirements') {
    const rows = await prisma.requirement.findMany({ orderBy: { createdAt: 'desc' }, include: { buyer: { include: { user: { select: { name: true, email: true, phone: true } } } }, category: { select: { name: true } } } });
    body = csv(rows.map((r) => ({ ...r, buyerName: r.buyer.user.name, buyerEmail: r.buyer.user.email, buyerPhone: r.buyer.user.phone, categoryName: r.category?.name })), ['createdAt', 'title', 'categoryName', 'quantity', 'unit', 'budgetMin', 'budgetMax', 'deliveryCity', 'deliveryState', 'buyerName', 'buyerEmail', 'buyerPhone', 'status', 'quoteCount']);
  } else if (type === 'payments' && s.role === 'ADMIN') {
    const rows = await prisma.payment.findMany({ orderBy: { createdAt: 'desc' }, include: { subscription: { select: { seller: { select: { companyName: true, gstNumber: true } }, plan: { select: { name: true } } } } } });
    body = csv(rows.map((r) => ({ ...r, sellerName: r.subscription?.seller.companyName, sellerGst: r.subscription?.seller.gstNumber, planName: r.subscription?.plan.name, total: r.amount + r.gst })), ['paidAt', 'invoiceNo', 'sellerName', 'sellerGst', 'planName', 'amount', 'gst', 'total', 'status', 'provider', 'method', 'providerPaymentId', 'couponCode']);
  } else if (type === 'users' && s.role === 'ADMIN') {
    const rows = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    body = csv(rows, ['createdAt', 'name', 'email', 'phone', 'nationality', 'role', 'active']);
  }
  return new Response('﻿' + body, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${type}-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
