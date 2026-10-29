import { Coin } from './Logo';

/* CSS-only preloader: fades out by itself in under a second, even before JavaScript loads. */
export default function Preloader() {
  return (
    <div aria-hidden className="preloader fixed inset-0 z-[100] grid place-items-center bg-white">
      <div className="flex flex-col items-center">
        <span className="relative grid place-items-center" style={{ animation: 'pop .5s cubic-bezier(.2,.8,.2,1) both' }}>
          <span className="welcome-ring !h-16 !w-16 !border-[var(--brand-gold)]" />
          <span className="welcome-ring !h-16 !w-16 !border-[var(--brand-gold)]" style={{ animationDelay: '.5s' }} />
          <Coin eager className="relative h-16 w-16" />
        </span>
        <div className="preloader-line mt-5 h-px w-36 bg-gradient-to-r from-transparent via-gold to-transparent" />
      </div>
    </div>
  );
}
