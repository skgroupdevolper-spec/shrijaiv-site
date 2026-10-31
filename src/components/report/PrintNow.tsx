'use client';
import { useEffect } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';

export default function PrintNow({ auto }: { auto?: boolean }) {
  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [auto]);
  return (
    <>
      <button type="button" onClick={() => (history.length > 1 ? history.back() : window.close())} className="report-btn ghost">
        <ArrowLeft size={16} /> Back
      </button>
      <button type="button" onClick={() => window.print()} className="report-btn">
        <Printer size={16} /> Print / Save as PDF
      </button>
      <span className="report-hint">
        In the print window choose <b>“Save as PDF”</b> as the printer.
      </span>
    </>
  );
}
