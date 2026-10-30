'use client';
import { useEffect } from 'react';

/**
 * Shown instead of Next's bare "Application error". After a new version is deployed an open tab can
 * ask for files that no longer exist (ChunkLoadError): clear old caches and reload once, automatically.
 */
export default function RecoverError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    const msg = `${error?.name || ''} ${error?.message || ''}`;
    const chunk = /ChunkLoadError|Loading chunk|Loading CSS chunk|Failed to fetch dynamically imported module|Unexpected token '<'/i.test(msg);
    let tried = false;
    try {
      tried = sessionStorage.getItem('err-reload') === '1';
    } catch {}
    if (chunk && !tried) {
      try {
        sessionStorage.setItem('err-reload', '1');
      } catch {}
      const clear = 'caches' in window ? caches.keys().then((ks) => Promise.all(ks.map((k) => caches.delete(k)))) : Promise.resolve();
      clear.finally(() => window.location.reload());
    }
  }, [error]);
  return (
    <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/badge-logo.webp" alt="" width={72} height={72} style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0b1a10' }}>Something went wrong</h2>
        <p style={{ marginTop: 8, color: '#5b6b60', fontSize: 15 }}>Please reload the page. If it keeps happening, clear the site data of this browser.</p>
        <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={() => { try { sessionStorage.removeItem('err-reload'); } catch {} window.location.reload(); }} style={{ padding: '10px 18px', borderRadius: 999, background: '#009a35', color: '#fff', fontWeight: 700, border: 0, cursor: 'pointer' }}>Reload</button>
          <button onClick={() => reset()} style={{ padding: '10px 18px', borderRadius: 999, background: '#fff', color: '#0b1a10', fontWeight: 700, border: '1px solid #dde5df', cursor: 'pointer' }}>Try again</button>
        </div>
      </div>
    </div>
  );
}
