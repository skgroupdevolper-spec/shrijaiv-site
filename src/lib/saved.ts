'use client';
// Saved products / sellers for visitors without an account — kept in this browser only.
// Logged-in buyers use the Favourites API instead (synced across devices).
const KEY = 'rgv_saved';
export const SAVED_EVENT = 'saved-changed';
export type Saved = { products: string[]; sellers: string[] };

export function readSaved(): Saved {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '');
    return { products: Array.isArray(v?.products) ? v.products : [], sellers: Array.isArray(v?.sellers) ? v.sellers : [] };
  } catch {
    return { products: [], sellers: [] };
  }
}

export function toggleSaved(kind: 'products' | 'sellers', id: string): boolean {
  const s = readSaved();
  const has = s[kind].includes(id);
  s[kind] = has ? s[kind].filter((x) => x !== id) : [...s[kind], id].slice(-100);
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent(SAVED_EVENT));
  } catch {}
  return !has;
}

export function savedCount() {
  const s = readSaved();
  return s.products.length + s.sellers.length;
}
