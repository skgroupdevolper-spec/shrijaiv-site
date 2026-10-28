import { planMaintenance } from '@/lib/marketplace/payments';

export const dynamic = 'force-dynamic';

// Daily job (see vercel.json): renewal reminders + expiring ended plans. Also runs on server start (instrumentation).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return new Response('Unauthorized', { status: 401 });
  return Response.json(await planMaintenance());
}
