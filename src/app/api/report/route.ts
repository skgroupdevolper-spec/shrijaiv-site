import { buildReport, toCsv, toXlsx, fileName } from '@/lib/reports';
import { reportScope } from '@/lib/report-scope';

export const dynamic = 'force-dynamic';

/** GET /api/report?type=overview&from=2026-01-01&to=2026-01-31&format=json|csv|xlsx */
export async function GET(req: Request) {
  const scope = await reportScope();
  if (!scope) return Response.json({ error: 'Please sign in' }, { status: 401 });
  const u = new URL(req.url);
  const rep = await buildReport(scope, u.searchParams.get('type') || 'overview', u.searchParams.get('from'), u.searchParams.get('to'));
  const format = u.searchParams.get('format') || 'json';
  if (format === 'csv') return new Response(toCsv(rep), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${fileName(rep, 'csv')}"`, 'Cache-Control': 'no-store' } });
  if (format === 'xlsx') return new Response(new Uint8Array(toXlsx(rep)), { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${fileName(rep, 'xlsx')}"`, 'Cache-Control': 'no-store' } });
  return Response.json({ report: rep }, { headers: { 'Cache-Control': 'no-store' } });
}
