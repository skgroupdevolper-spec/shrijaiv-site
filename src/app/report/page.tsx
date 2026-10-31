import { redirect } from 'next/navigation';
import { buildReport } from '@/lib/reports';
import { reportScope } from '@/lib/report-scope';
import { getSetting } from '@/lib/settings';
import ReportView from '@/components/report/ReportView';
import PrintNow from '@/components/report/PrintNow';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Report', robots: { index: false, follow: false } };

/** Print-ready report: opens the print dialog (choose "Save as PDF") when ?print=1 */
export default async function ReportPrint({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const scope = await reportScope();
  if (!scope) redirect('/login?next=/report');
  const [rep, site] = await Promise.all([buildReport(scope, sp.type || 'overview', sp.from, sp.to), getSetting('site')]);
  return (
    <main className="report-print">
      <div className="report-toolbar">
        <PrintNow auto={sp.print === '1'} />
      </div>
      <ReportView rep={rep} logo={site.favicon || '/brand/badge-logo.webp'} />
      <footer className="report-foot">{site.name} · {site.emailGeneral} · {site.phoneDisplay}</footer>
    </main>
  );
}
