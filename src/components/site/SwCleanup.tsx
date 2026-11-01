'use client';
import { useEffect } from 'react';

/**
 * The installable app (service worker, install bar, welcome screen) was removed. Visitors who still have
 * the old service worker get it unregistered and its caches cleared once, so they always load the live site.
 */
export default function SwCleanup() {
  useEffect(() => {
    try {
      if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => null);
      if ('caches' in window) caches.keys().then((ks) => ks.forEach((k) => caches.delete(k))).catch(() => null);
    } catch {}
  }, []);
  return null;
}
