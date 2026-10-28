'use client';
// Inquiry conversation thread used by the seller, buyer and admin dashboards.
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, LoaderCircle, Paperclip } from 'lucide-react';
import { dapi } from '@/lib/dashboard/api';
import { toast } from '@/components/admin/ui';
import { uploadToDashboard } from '@/components/dashboard/fields';
import { formatDateTime, cn } from '@/lib/utils';

type Msg = { id: string; senderRole: string; body: string; attachments?: string; createdAt: string };

export default function Thread({ messages, me, postUrl, placeholder = 'Write a reply…', disabled, refreshSeconds = 15, uploadUrl }: { messages: Msg[]; me: 'seller' | 'buyer' | 'admin'; postUrl: string; placeholder?: string; disabled?: boolean; refreshSeconds?: number; uploadUrl?: string }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [up, setUp] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [messages.length]);
  useEffect(() => {
    if (!refreshSeconds) return;
    const t = setInterval(() => router.refresh(), refreshSeconds * 1000);
    return () => clearInterval(t);
  }, [router, refreshSeconds]);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && !files.length) return;
    setBusy(true);
    try {
      await dapi(postUrl, 'POST', { body: text.trim() || (files.length ? 'Attachment' : ''), attachments: files });
      setText('');
      setFiles([]);
      router.refresh();
    } catch (err: any) {
      toast(err.message, 'error');
    }
    setBusy(false);
  }
  async function attach(list: FileList | null) {
    if (!list?.length) return;
    setUp(true);
    try {
      const items = await uploadToDashboard(Array.from(list).slice(0, 5), uploadUrl || (me === 'admin' ? '/api/admin/upload' : '/api/seller/upload'));
      setFiles((f) => [...f, ...items.map((i) => i.url)].slice(0, 5));
    } catch (err: any) {
      toast(err.message, 'error');
    }
    setUp(false);
  }
  const name = (r: string) => (r === 'seller' ? 'Seller' : r === 'buyer' ? 'Buyer' : r === 'admin' ? 'SHRIJAIV team' : 'System');
  return (
    <div className="flex h-full flex-col">
      <div className="thin-scroll flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => {
          const mine = m.senderRole === me;
          let atts: string[] = [];
          try {
            atts = JSON.parse(m.attachments || '[]');
          } catch {}
          return (
            <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm', mine ? 'rounded-br-md bg-emerald-600 text-white' : m.senderRole === 'admin' ? 'rounded-bl-md bg-amber-50 text-amber-950 ring-1 ring-amber-100' : 'rounded-bl-md bg-white text-gray-900 ring-1 ring-gray-200')}>
                {!mine && <p className="mb-0.5 text-[0.65rem] font-bold uppercase tracking-wider opacity-60">{name(m.senderRole)}</p>}
                <p className="whitespace-pre-line">{m.body}</p>
                {atts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {atts.map((a) => (
                      /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(a) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <a key={a} href={a} target="_blank" rel="noopener noreferrer"><img src={a} alt="" className="h-24 w-24 rounded-xl object-cover" /></a>
                      ) : (
                        <a key={a} href={a} target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold', mine ? 'bg-white/20' : 'bg-gray-100')}><Paperclip className="h-3 w-3" /> File</a>
                      )
                    ))}
                  </div>
                )}
                <p className={cn('mt-1 text-[0.62rem]', mine ? 'text-white/70' : 'text-gray-400')}>{formatDateTime(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      {!disabled && (
        <form onSubmit={send} className="border-t border-gray-100 p-3">
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {files.map((f) => (
                <span key={f} className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs"><Paperclip className="h-3 w-3" /> attached <button type="button" onClick={() => setFiles(files.filter((x) => x !== f))} className="text-red-500">×</button></span>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={up} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-gray-400 hover:bg-gray-100" aria-label="Attach">{up ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}</button>
            <input ref={fileRef} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={(e) => attach(e.target.files)} />
            <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement).requestSubmit(); } }} rows={1} placeholder={placeholder} className="admin-input max-h-40 min-h-[44px] flex-1 resize-y" />
            <button disabled={busy || (!text.trim() && !files.length)} className="btn btn-gold !min-h-[44px] !px-4">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
          </div>
        </form>
      )}
    </div>
  );
}
