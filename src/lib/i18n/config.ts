// Website languages. English is the main language (URLs without prefix).
// Other languages live under /hi, /ur, /ta ... e.g. /hi/about-us

export type Locale = 'en' | 'hi' | 'ur' | 'bn' | 'ta' | 'te' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'or' | 'as';

export const LOCALES: { code: Locale; name: string; native: string; dir: 'ltr' | 'rtl'; flag: string; google: string; deepl?: string; htmlLang: string }[] = [
  { code: 'en', name: 'English', native: 'English', dir: 'ltr', flag: '🇮🇳', google: 'en', deepl: 'EN-GB', htmlLang: 'en' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', dir: 'ltr', flag: '🇮🇳', google: 'hi', htmlLang: 'hi' },
  { code: 'ur', name: 'Urdu', native: 'اردو', dir: 'rtl', flag: '🇮🇳', google: 'ur', htmlLang: 'ur' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', dir: 'ltr', flag: '🇮🇳', google: 'bn', htmlLang: 'bn' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', dir: 'ltr', flag: '🇮🇳', google: 'ta', htmlLang: 'ta' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', dir: 'ltr', flag: '🇮🇳', google: 'te', htmlLang: 'te' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', dir: 'ltr', flag: '🇮🇳', google: 'mr', htmlLang: 'mr' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', dir: 'ltr', flag: '🇮🇳', google: 'gu', htmlLang: 'gu' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', dir: 'ltr', flag: '🇮🇳', google: 'kn', htmlLang: 'kn' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', dir: 'ltr', flag: '🇮🇳', google: 'ml', htmlLang: 'ml' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', dir: 'ltr', flag: '🇮🇳', google: 'pa', htmlLang: 'pa' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', dir: 'ltr', flag: '🇮🇳', google: 'or', htmlLang: 'or' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া', dir: 'ltr', flag: '🇮🇳', google: 'as', htmlLang: 'as' },
];

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_CODES = LOCALES.map((l) => l.code);
export const TRANSLATED_LOCALES = LOCALE_CODES.filter((c) => c !== DEFAULT_LOCALE);

export function isLocale(v: any): v is Locale {
  return typeof v === 'string' && (LOCALE_CODES as string[]).includes(v);
}

export function localeInfo(code: string) {
  return LOCALES.find((l) => l.code === code) || LOCALES[0];
}

/** Paths that are never translated / prefixed */
const NO_PREFIX = /^\/(admin|api|uploads|_next|account|seller|buyer)(\/|$)|^\/(sitemap\.xml|robots\.txt|icon\.svg|favicon\.ico)$/;

/** Adds the language prefix to an internal link */
export function localizePath(href: string, locale: string) {
  if (!href || !href.startsWith('/') || href.startsWith('//')) return href;
  if (locale === DEFAULT_LOCALE || NO_PREFIX.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

/** Removes a language prefix: /ar/about-us -> { locale: 'ar', path: '/about-us' } */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const m = pathname.match(/^\/([a-z]{2})(\/.*)?$/);
  if (m && isLocale(m[1]) && m[1] !== DEFAULT_LOCALE) return { locale: m[1], path: m[2] || '/' };
  return { locale: DEFAULT_LOCALE, path: pathname };
}

/** hreflang alternates + canonical for SEO */
export function seoAlternates(path: string, locale: string) {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l.htmlLang] = localizePath(path, l.code);
  languages['x-default'] = path;
  return { canonical: localizePath(path, locale), languages };
}
