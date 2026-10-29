import { getSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [site, app] = await Promise.all([getSetting('site'), getSetting('app')]);
  const m = {
    name: site.name,
    short_name: 'SHRIJAIV',
    description: site.seo.description,
    start_url: '/?source=pwa',
    display: 'standalone',
    background_color: app.splashBg || '#ffffff',
    theme_color: '#009A35',
    lang: 'en',
    icons: [
      { src: '/icon.png', sizes: '256x256', type: 'image/png', purpose: 'any' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcuts: [
      { name: 'Products', url: '/products' },
      { name: 'Post a requirement', url: '/post-requirement' },
      { name: 'Seller dashboard', url: '/seller' },
    ],
  };
  return new Response(JSON.stringify(m), { headers: { 'content-type': 'application/manifest+json', 'cache-control': 'public, max-age=300' } });
}
