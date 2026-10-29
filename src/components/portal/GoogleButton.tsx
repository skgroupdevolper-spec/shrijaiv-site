import { googleConfig } from '@/lib/google-auth';
import { getI18n } from '@/lib/i18n/server';

const ERRORS: Record<string, string> = {
  'google-off': 'Google sign-in is not switched on yet. Please use email.',
  'google-cancelled': 'Google sign-in was cancelled.',
  'google-state': 'The Google sign-in expired. Please try again.',
  'google-token': 'Google did not accept the sign-in. Please try again.',
  'google-email': 'Your Google account has no verified email.',
  'google-error': 'Google sign-in failed. Please try again or use email.',
  'account-disabled': 'This account is disabled. Please contact us.',
};

export function GoogleMark({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/** "Continue with Google" + an "or" divider (only when Google sign-in is configured), and Google error messages */
export default async function GoogleButton({ next, error }: { next?: string; error?: string }) {
  const [cfg, { t }] = await Promise.all([googleConfig(), getI18n()]);
  const msg = error && ERRORS[error];
  if (!cfg.enabled && !msg) return null;
  return (
    <div className="mb-5">
      {msg && <p className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{t(msg)}</p>}
      {cfg.enabled && (
        <>
          <a href={`/api/auth/google${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="flex w-full items-center justify-center gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-[0.95rem] font-semibold text-ink shadow-sm transition hover:border-ink/25 hover:shadow">
            <GoogleMark /> {t('Continue with Google')}
          </a>
          <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-ink/35">
            <span className="h-px flex-1 bg-ink/10" /> {t('or')} <span className="h-px flex-1 bg-ink/10" />
          </div>
        </>
      )}
    </div>
  );
}
