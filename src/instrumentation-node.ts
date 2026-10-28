// Fills in any missing translations in the background after the server starts.
import { getSetting } from './lib/settings';
import { enqueueAll } from './lib/i18n/jobs';

// Not on Vercel: there a daily job (/api/cron/translate) and the admin panel do this instead.
if (process.env.DISABLE_AUTO_TRANSLATE !== '1' && !process.env.VERCEL) {
  setTimeout(async () => {
    try {
      const cfg = await getSetting('translation');
      if (!cfg.autoTranslate || cfg.provider === 'off') return;
      await enqueueAll(false);
      console.log('[translate] background translation started');
    } catch (e) {
      console.error('[translate] startup failed:', (e as Error).message);
    }
  }, 20_000);
}

// Membership plans: reminders and expiry — once an hour on long-running servers (Vercel uses /api/cron/plans)
if (!process.env.VERCEL) {
  const g = globalThis as unknown as { __planTicker?: NodeJS.Timeout };
  if (!g.__planTicker) {
    const run = async () => {
      try {
        const { planMaintenance } = await import('./lib/marketplace/payments');
        await planMaintenance();
      } catch (e) {
        console.error('[plans] maintenance failed:', (e as Error).message);
      }
    };
    setTimeout(run, 30_000);
    g.__planTicker = setInterval(run, 60 * 60_000);
    g.__planTicker.unref?.();
  }
}
