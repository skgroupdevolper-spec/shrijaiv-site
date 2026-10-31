import ReportBuilder from '@/components/report/ReportBuilder';
import { REPORT_TYPES } from '@/lib/reports';

export default function Page() {
  return <ReportBuilder types={REPORT_TYPES.buyer} title="My reports" />;
}
