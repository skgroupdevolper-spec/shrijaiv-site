'use client';
import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

/** Registers the service worker and shows a small "Install app" bar on supporting browsers */
export default function PwaRegister() {
  const [prompt, setPrompt] = useState<any>(null);
  const [hide, setHide] = useState(true);
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') navigator.serviceWorker.register('/sw.js').catch(() => null);
    const onPrompt = (e: any) => {
      e.preventDefault();
      setPrompt(e);
      try {
        if (!localStorage.getItem('pwa-dismissed')) setHide(false);
      } catch {
        setHide(false);
      }
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);
  if (hide || !prompt) return null;
  return (
    <div className="fixed inset-x-3 bottom-[88px] z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-white/90 p-3 shadow-2xl ring-1 ring-black/10 backdrop-blur lg:bottom-6 lg:left-6 lg:right-auto">
      <img src="/brand/coin.webp" alt="" className="h-10 w-10" />
      <div className="min-w-0 flex-1 text-sm"><p className="font-bold">Install SHRIJAIV</p><p className="text-xs text-gray-500">Faster, full screen, works like an app.</p></div>
      <button onClick={async () => { prompt.prompt(); await prompt.userChoice.catch(() => null); setHide(true); }} className="btn btn-gold btn-sm"><Download className="h-4 w-4" /> Install</button>
      <button onClick={() => { setHide(true); try { localStorage.setItem('pwa-dismissed', '1'); } catch {} }} className="p-1 text-gray-400" aria-label="Close"><X className="h-4 w-4" /></button>
    </div>
  );
}
