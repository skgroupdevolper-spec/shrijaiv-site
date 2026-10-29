'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Download, X, Share, Mail } from 'lucide-react';
import type { AppSettings } from '@/lib/defaults';
import { cn } from '@/lib/utils';

type Props = { app: AppSettings; googleEnabled: boolean; logo: string };

const isStandalone = () => {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches || (navigator as any).standalone === true;
  } catch {
    return false;
  }
};
const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
};

/**
 * Service worker + "Install app" bar + the welcome screen of the installed app.
 * - The bar shows on every page load until the app is installed; closing it only hides it until the next load.
 * - The welcome screen (Admin → App & splash screen) shows once, the first time the installed app opens.
 */
export default function PwaRegister({ app, googleEnabled, logo }: Props) {
  const path = usePathname() || '/';
  const [prompt, setPrompt] = useState<any>(null);
  const [ios, setIos] = useState(false);
  const [closed, setClosed] = useState(false);
  const [installed, setInstalled] = useState(true);
  const [splash, setSplash] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') navigator.serviceWorker.register('/sw.js').catch(() => null);
    const standalone = isStandalone();
    setInstalled(standalone);
    if (standalone && app.splashEnabled && !store.get('app-welcome-done')) setSplash(true);
    if (!standalone) {
      const ua = navigator.userAgent;
      setIos(/iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua));
    }
    const onPrompt = (e: any) => {
      e.preventDefault();
      setPrompt(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [app.splashEnabled]);

  const onAdmin = path.startsWith('/admin');
  const showBar = app.installBar && !installed && !closed && !onAdmin && (prompt || ios);

  return (
    <>
      {showBar && (
        <div className="install-bar" role="dialog" aria-label={app.installTitle}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="" className="h-11 w-11 shrink-0 rounded-xl bg-white object-contain p-0.5 shadow-sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.9rem] font-bold text-ink">{app.installTitle}</p>
            <p className="line-clamp-2 text-[0.72rem] leading-snug text-ink/60">
              {prompt ? app.installText : (
                <>
                  <Share className="me-1 inline h-3.5 w-3.5 align-[-2px] text-[#007aff]" />
                  {app.iosHint}
                </>
              )}
            </p>
          </div>
          {prompt && (
            <button
              onClick={async () => {
                prompt.prompt();
                const r = await prompt.userChoice.catch(() => null);
                if (r?.outcome === 'accepted') setInstalled(true);
                setPrompt(null);
              }}
              className="btn btn-gold btn-sm !min-h-[36px] shrink-0 !px-3.5"
            >
              <Download className="h-4 w-4" /> {app.installButton}
            </button>
          )}
          <button onClick={() => setClosed(true)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink/40 hover:bg-ink/5" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {splash && <Welcome app={app} logo={app.splashLogo || logo} googleEnabled={googleEnabled} done={() => { store.set('app-welcome-done', '1'); setSplash(false); }} />}
    </>
  );
}

/** First-open welcome screen of the installed app: images, logo, Google / email sign-in, skip */
function Welcome({ app, logo, googleEnabled, done }: { app: AppSettings; logo: string; googleEnabled: boolean; done: () => void }) {
  const slides = (app.splashSlides || []).filter((s) => s?.image);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), Math.max(2, Number(app.splashSeconds) || 4) * 1000);
    return () => clearInterval(t);
  }, [slides.length, app.splashSeconds]);
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, []);
  const go = (href: string) => {
    done();
    window.location.href = href;
  };
  const cur = slides[i];
  return (
    <div className="welcome" style={{ ['--wbg' as any]: app.splashBg || '#0B6B2C' }} role="dialog" aria-modal="true" aria-label={app.splashTitle}>
      <div className="welcome-media">
        {slides.map((s, k) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={k} src={s.image} alt="" className={cn('absolute inset-0 h-full w-full object-cover transition-all duration-1000', k === i ? 'scale-100 opacity-100' : 'scale-105 opacity-0')} />
        ))}
        <span className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[var(--wbg)]" />
        {app.showSkip && (
          <button onClick={done} className="absolute end-4 top-[calc(14px+env(safe-area-inset-top))] rounded-full bg-black/30 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur">
            {app.skipLabel || 'Skip'}
          </button>
        )}
        {cur?.title && (
          <div key={i} className="absolute inset-x-6 bottom-6 text-white" style={{ animation: 'fx-up .6s var(--ease) both' }}>
            <p className="font-display text-xl font-semibold drop-shadow">{cur.title}</p>
            {cur.text && <p className="mt-1 text-sm text-white/85 drop-shadow">{cur.text}</p>}
          </div>
        )}
      </div>
      <div className="welcome-panel">
        {slides.length > 1 && (
          <div className="mb-4 flex justify-center gap-1.5">
            {slides.map((_, k) => (
              <button key={k} onClick={() => setI(k)} className={cn('h-1.5 rounded-full transition-all', k === i ? 'w-6 bg-white' : 'w-1.5 bg-white/40')} aria-label={`Image ${k + 1}`} />
            ))}
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" className="mx-auto -mt-1 h-20 w-20 rounded-full bg-white object-contain p-1 shadow-xl" style={{ animation: 'pop .6s cubic-bezier(.2,.8,.2,1) both' }} />
        <h1 className="mt-4 text-center font-display text-[1.6rem] font-semibold leading-tight text-white">{app.splashTitle}</h1>
        {app.splashText && <p className="mx-auto mt-2 max-w-sm text-center text-sm text-white/80">{app.splashText}</p>}
        <div className="mx-auto mt-6 grid w-full max-w-sm gap-2.5">
          {app.showGoogle && googleEnabled && (
            <button onClick={() => go('/api/auth/google')} className="welcome-btn bg-white text-ink">
              <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>
              {app.googleLabel || 'Continue with Google'}
            </button>
          )}
          {app.showEmail && (
            <button onClick={() => go('/login')} className="welcome-btn bg-white/15 text-white ring-1 ring-white/30 backdrop-blur">
              <Mail className="h-5 w-5" /> {app.emailLabel || 'Continue with email'}
            </button>
          )}
          {app.showEmail && (
            <button onClick={() => go('/register')} className="py-1 text-center text-sm font-semibold text-white/85 underline-offset-4 hover:underline">
              {app.signupLabel || 'Create a free account'}
            </button>
          )}
          {app.showSkip && !app.showEmail && !app.showGoogle && (
            <button onClick={done} className="welcome-btn bg-white text-ink">{app.skipLabel || 'Skip'}</button>
          )}
        </div>
      </div>
    </div>
  );
}
