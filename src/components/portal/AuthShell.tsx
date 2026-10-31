import { Check } from 'lucide-react';
import T from '@/components/ui/T';
import { Coin } from '@/components/site/Logo';
import Particles from '@/components/site/Particles';
import SmartLink from '@/components/ui/SmartLink';
import { cn } from '@/lib/utils';

export default function AuthShell({ title, subtitle, children, tab, wide }: { title: string; subtitle?: string; children: React.ReactNode; tab?: 'login' | 'register'; wide?: boolean }) {
  const perks = ['Verified organic sellers across India', 'Post requirements and compare quotes', 'Chat with sellers in your language', 'Ratings and reviews you can trust'];
  return (
    <section className="hero-stage theme-light">
      <div className="hero-aurora" />
      <div className={cn('container-x grid min-h-[calc(100vh-80px)] gap-10 pb-16 pt-[7.25rem] lg:pt-[8.5rem]', wide ? 'items-start lg:grid-cols-[0.8fr_1.2fr]' : 'items-center lg:grid-cols-2')}>
        <div className={cn('ink-panel theme-dark relative hidden p-12 lg:block', wide ? 'sticky top-28 min-h-[520px]' : 'h-full min-h-[560px]')}>
          <Particles density={0.5} />
          <div className="relative">
            <Coin eager className="h-[72px] w-[72px]" />
            <h2 className="mt-8 font-display text-4xl font-semibold leading-tight text-white">
              <T>India's organic marketplace, in one place.</T>
            </h2>
            <ul className="mt-10 space-y-4">
              {perks.map((p) => (
                <li key={p} className="flex items-center gap-3 text-white/80">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-gold/20 text-gold-light">
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  </span>
                  <T>{p}</T>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className={cn('mx-auto w-full', wide ? 'max-w-2xl' : 'max-w-md')}>
          {tab && (
            <div className="mb-6 flex items-end gap-6" role="tablist">
              <SmartLink href="/login" className={cn('font-display text-3xl font-semibold transition', tab === 'login' ? 'text-ink' : 'text-ink/30 hover:text-ink/60')} ariaLabel="Login">
                <T>Login</T>
              </SmartLink>
              <SmartLink href="/register" className={cn('font-display text-3xl font-semibold transition', tab === 'register' ? 'text-ink' : 'text-ink/30 hover:text-ink/60')} ariaLabel="Register">
                <T>Register</T>
              </SmartLink>
            </div>
          )}
          <h1 className={cn('h-display', tab ? 'text-2xl md:text-3xl' : 'text-4xl md:text-5xl')}>
            <T>{title}</T>
          </h1>
          {subtitle && (
            <p className="lead mt-3">
              <T>{subtitle}</T>
            </p>
          )}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </section>
  );
}
