import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireSeller } from '@/lib/auth';
import { getPayments } from '@/lib/marketplace/payments';
import { getSetting } from '@/lib/settings';
import { formatDate } from '@/lib/utils';
import PrintButton from '@/components/dashboard/PrintButton';

const inr = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function Invoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { seller, session } = (await requireSeller())!;
  const p = await prisma.payment.findFirst({ where: { id, subscription: { sellerId: seller.id }, status: 'paid' }, include: { subscription: { include: { plan: true } } } });
  if (!p) notFound();
  const [pay, site] = await Promise.all([getPayments(), getSetting('site')]);
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex justify-end print:hidden"><PrintButton /></div>
      <div className="rounded-2xl bg-white p-8 ring-1 ring-gray-200/70 print:ring-0">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-2xl font-extrabold text-gray-900">TAX INVOICE</p>
            <p className="mt-1 font-mono text-sm">{p.invoiceNo}</p>
            <p className="text-sm text-gray-500">Date: {formatDate(p.paidAt || p.createdAt)}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">{pay.companyName || site.name}</p>
            <p className="whitespace-pre-line text-gray-500">{pay.companyAddress}</p>
            {pay.companyGstin && <p className="text-gray-500">GSTIN: {pay.companyGstin}</p>}
          </div>
        </div>
        <div className="mt-8 grid gap-6 text-sm sm:grid-cols-2">
          <div><p className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Billed to</p><p className="font-bold">{seller.companyName}</p><p className="text-gray-600">{session.name} · {session.email}</p>{seller.address && <p className="text-gray-600">{seller.address}</p>}{seller.gstNumber && <p className="text-gray-600">GSTIN: {seller.gstNumber}</p>}</div>
          <div><p className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Payment</p><p className="text-gray-600">{p.provider === 'razorpay' ? 'Razorpay' : 'Bank transfer'} {p.providerPaymentId ? `· ${p.providerPaymentId}` : ''}</p><p className="text-gray-600">Status: Paid</p></div>
        </div>
        <table className="mt-8 w-full text-sm">
          <thead><tr className="border-b border-gray-200 text-left text-[0.65rem] uppercase tracking-wider text-gray-400"><th className="py-2">Description</th><th className="py-2 text-right">Amount</th></tr></thead>
          <tbody>
            <tr className="border-b border-gray-100"><td className="py-3">{p.subscription?.plan.name} membership plan{p.subscription?.endsAt ? ` (until ${formatDate(p.subscription.endsAt)})` : ''}{p.couponCode ? ` · coupon ${p.couponCode}` : ''}</td><td className="py-3 text-right">{inr(p.amount)}</td></tr>
            <tr className="border-b border-gray-100"><td className="py-2 text-gray-500">GST</td><td className="py-2 text-right">{inr(p.gst)}</td></tr>
            <tr><td className="py-3 font-bold">Total paid</td><td className="py-3 text-right font-bold">{inr(p.amount + p.gst)}</td></tr>
          </tbody>
        </table>
        <p className="mt-8 text-xs text-gray-400">This is a computer-generated invoice for a SHRIJAIV membership plan. Membership fees are for marketplace services and are not refundable except as described in the Refund Policy.</p>
      </div>
    </div>
  );
}
