// Applies saved translations of marketplace records (products, sellers, categories, requirements) for the current language.
import { getLocale, getTranslation, getTranslationsFor } from './server';
import { DEFAULT_LOCALE } from './config';
import type { Entity } from './content';

function merge<T extends Record<string, any>>(item: T, t: any): T {
  if (!t) return item;
  const out: any = { ...item };
  for (const k of Object.keys(t)) {
    const v = t[k];
    if (v === null || v === undefined || v === '') continue;
    out[k] = k === 'specs' ? JSON.stringify(v) : v;
  }
  return out;
}

export async function localizeOne<T extends { id: string }>(entity: Entity, item: T | null, locale?: string): Promise<T | null> {
  if (!item) return item;
  const l = locale || (await getLocale());
  if (l === DEFAULT_LOCALE) return item;
  return merge(item, await getTranslation(entity, item.id, l));
}

export async function localizeMany<T extends { id: string }>(entity: Entity, items: T[], locale?: string): Promise<T[]> {
  const l = locale || (await getLocale());
  if (l === DEFAULT_LOCALE || !items.length) return items;
  const map = await getTranslationsFor(entity, items.map((i) => i.id), l);
  return items.map((i) => merge(i, map.get(i.id)));
}

/** Fire-and-forget: translate a record into every enabled language after a seller/buyer/admin saved it */
export function translateLater(entity: Entity, id: string) {
  import('./jobs').then((m) => m.onContentSaved(entity, id)).catch(() => null);
}
