'use client';
import { Printer } from 'lucide-react';
export default function PrintButton() {
  return <button onClick={() => window.print()} className="btn btn-outline btn-sm"><Printer className="h-4 w-4" /> Print / save PDF</button>;
}
