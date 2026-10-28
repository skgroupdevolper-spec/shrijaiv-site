'use client';
/** fetch helper for the seller / buyer dashboards (401 → /login) */
export async function dapi<T = any>(url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any): Promise<T> {
  const r = await fetch(url, {
    method,
    headers: body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    cache: 'no-store',
  });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401) {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    throw new Error('Session expired');
  }
  if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
  return d as T;
}
