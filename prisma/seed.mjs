// Seeds the database with the website content and the first admin user.
//   node prisma/seed.mjs          -> only fills an EMPTY database (safe to run on every build / start)
//   node prisma/seed.mjs --force  -> re-creates all pages/posts/services/FAQs (keeps users, leads & applications)
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { seedMarketplace } from './marketplace-seed.mjs';
import { seedDemo } from './demo-seed.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env / .env.local manually (no extra dependency)
for (const name of ['.env.local', '.env']) {
  const envFile = path.join(__dirname, '..', name);
  if (!existsSync(envFile)) continue;
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

if (!process.env.DATABASE_URL) process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || '';
const prisma = globalThis.__seedPrisma || new PrismaClient();
const force = process.argv.includes('--force');
const C = await import('./content.mjs');

async function main() {
  // 1) Admin user
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  if (adminCount === 0 && !process.env.ADMIN_PASSWORD && (process.env.VERCEL || process.env.ADMIN_SETUP === 'web')) {
    // No default password on public hosting: the first visitor of /admin/login creates the admin account.
    console.log('ℹ No admin yet - open /admin/login on your website to create the admin account.');
  } else if (adminCount === 0) {
    const email = (process.env.ADMIN_EMAIL || 'admin@shrijaiv.com').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
    await prisma.user.upsert({
      where: { email },
      update: { role: 'ADMIN', active: true, passwordHash: await bcrypt.hash(password, 10) },
      create: { name: 'Administrator', email, role: 'ADMIN', passwordHash: await bcrypt.hash(password, 10) },
    });
    console.log(`✔ Admin user created: ${email} / ${password}  (change it after first login!)`);
  }

  // 2) Built-in translation packs (prisma/translations/*.json, when present)
  await loadTranslationPacks();

  // 3) Marketplace: categories, plans, settings (idempotent)
  await seedMarketplace(prisma);
  // 3b) Demo sellers / products / buy leads (only while the marketplace is empty; skip with DEMO_DATA=0)
  if (process.env.DEMO_DATA !== '0') await seedDemo(prisma);

  // 3c) One-time upgrades of saved settings
  await runUpgrades();

  // 4) Website content — only into an empty database (or with --force)
  const pageCount = await prisma.page.count();
  if (pageCount > 0 && !force) {
    console.log('✔ Database already has content — skipping content seed (use "npm run seed:reset" to restore the original content).');
    return;
  }
  if (force) {
    await prisma.page.deleteMany({ where: { slug: { in: C.allPages.map((p) => p.slug) } } });
    await prisma.post.deleteMany({ where: { slug: { in: C.posts.map((p) => p.slug) } } });
    await prisma.service.deleteMany({});
    await prisma.faq.deleteMany({});
    await prisma.partner.deleteMany({});
    await prisma.translation.deleteMany({ where: { status: 'auto' } });
  }
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  for (const p of C.allPages) {
    const blocks = JSON.stringify(p.blocks).split('{date}').join(today).split('{city}').join(process.env.LEGAL_CITY || 'your city');
    await prisma.page.create({ data: { slug: p.slug, title: p.title, metaTitle: p.metaTitle, metaDescription: p.metaDescription, blocks, status: 'published' } });
  }
  console.log(`✔ ${C.allPages.length} pages`);

  for (const p of C.posts) await prisma.post.create({ data: { ...p, publishedAt: new Date(p.publishedAt), status: 'published' } });
  console.log(`✔ ${C.posts.length} blog posts`);

  for (const s of C.serviceRecords) await prisma.service.create({ data: s });
  for (const f of C.faqRecords) await prisma.faq.create({ data: { ...f, active: true } });
  console.log(`✔ ${C.faqRecords.length} FAQs`);
  for (const p of C.partnerRecords) await prisma.partner.create({ data: p });
  if ((await prisma.testimonial.count()) === 0) {
    for (const t of C.testimonialRecords) await prisma.testimonial.create({ data: t });
    console.log(`✔ ${C.testimonialRecords.length} sample reviews (replace them in Admin → Testimonials)`);
  }
}

/* prisma/translations/<lang>.json = { "plain": { english: translation }, "html": { englishHtml: translationHtml } }
   Loaded into the translation memory once per file version. */
async function loadTranslationPacks() {
  const dir = path.join(__dirname, 'translations');
  if (!existsSync(dir)) return;
  const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const locale = file.replace('.json', '');
    const raw = readFileSync(path.join(dir, file), 'utf8');
    const version = sha1(raw);
    const flag = await prisma.setting.findUnique({ where: { key: 'pack:' + locale } });
    if (flag?.value === version) continue;
    let pack;
    try {
      pack = JSON.parse(raw);
    } catch (e) {
      console.error('Bad translation file', file, e.message);
      continue;
    }
    const rows = [];
    for (const part of ['plain', 'html']) {
      for (const [en, tr] of Object.entries(pack[part] || {})) if (en && typeof tr === 'string' && tr.trim()) rows.push({ key: `pack:${locale}:${sha1(en)}`, text: tr });
    }
    await prisma.translationMemory.deleteMany({ where: { key: { startsWith: `pack:${locale}:` } } });
    const seen = new Set();
    const unique = rows.filter((r) => (seen.has(r.key) ? false : seen.add(r.key)));
    for (let i = 0; i < unique.length; i += 400) await prisma.translationMemory.createMany({ data: unique.slice(i, i + 400) });
    // New built-in translations: automatic translations (not hand-edited ones) are rebuilt on their next visit
    await prisma.translation.deleteMany({ where: { locale, status: 'auto' } }).catch(() => {});
    await prisma.setting.upsert({ where: { key: 'pack:' + locale }, update: { value: version }, create: { key: 'pack:' + locale, value: version } });
    console.log(`✔ Built-in ${locale.toUpperCase()} translations: ${unique.length} texts`);
  }
}

main()
  .then(() => console.log('Seed finished.'))
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

/** One-time changes to settings the admin already saved (each runs once, remembered in Setting "upgrades") */
async function runUpgrades() {
  const row = await prisma.setting.findUnique({ where: { key: 'upgrades' } }).catch(() => null);
  const done = new Set(row ? JSON.parse(row.value) : []);
  const mark = async (k) => {
    done.add(k);
    await prisma.setting.upsert({ where: { key: 'upgrades' }, update: { value: JSON.stringify([...done]) }, create: { key: 'upgrades', value: JSON.stringify([...done]) } });
  };
  const edit = async (key, fn) => {
    const r = await prisma.setting.findUnique({ where: { key } });
    if (!r) return;
    const v = JSON.parse(r.value);
    const next = fn(v) ?? v;
    await prisma.setting.update({ where: { key }, data: { value: JSON.stringify(next) } });
  };
  if (!done.has('header-sellers-buyers')) {
    // "Become a Seller / Buyer" → the lists of all sellers and buyers; the header button becomes "Register"
    await edit('header', (h) => {
      if (Array.isArray(h.menu))
        h.menu = h.menu.map((m) => (m?.href === '/become-a-seller' ? { ...m, label: 'Sellers', href: '/sellers' } : m?.href === '/become-a-buyer' ? { ...m, label: 'Buyers', href: '/buyers' } : m));
      if (!h.cta || h.cta.href === '/post-requirement') h.cta = { label: 'Register', href: '/register' };
      return h;
    });
    await mark('header-sellers-buyers');
    console.log('✔ Upgrade: header menu shows Sellers / Buyers and a Register button');
  }
  if (!done.has('main-categories-v1')) {
    // The 8 main categories asked for by the client, shown first. Existing categories with the same meaning are
    // moved to the top level (their products stay linked); missing ones are created.
    const MAIN = [
      ['Cereals', 'grains-cereals', 'wheat'],
      ['Pulses', 'pulses', 'bean'],
      ['Spices', 'spices-herbs', 'leaf'],
      ['Vegetables', 'vegetables', 'carrot'],
      ['Fruits', 'fruit', 'apple'],
      ['Dairy Products', 'dairy-products', 'milk'],
      ['Seeds', 'seeds-saplings', 'sprout'],
      ['Beauty Products', 'organic-beauty', 'sparkles'],
    ];
    for (const [i, [name, slug, icon]] of MAIN.entries()) {
      const found = await prisma.category.findUnique({ where: { slug } });
      if (found) await prisma.category.update({ where: { slug }, data: { name, parentId: null, featured: true, active: true, order: i, icon: found.icon || icon } });
      else await prisma.category.create({ data: { name, slug, icon, featured: true, order: i } });
    }
    // the hero list shows exactly these 8 (other categories stay, just not highlighted)
    await prisma.category.updateMany({ where: { slug: { notIn: MAIN.map((m) => m[1]) } }, data: { featured: false } });
    // the other main categories follow after them
    const others = await prisma.category.findMany({ where: { parentId: null, slug: { notIn: MAIN.map((m) => m[1]) } }, orderBy: { order: 'asc' } });
    for (const [j, c] of others.entries()) await prisma.category.update({ where: { id: c.id }, data: { order: MAIN.length + j } });
    // their translations are re-made from the new names
    await prisma.translation.deleteMany({ where: { entity: 'category', entityId: { in: (await prisma.category.findMany({ where: { slug: { in: MAIN.map((m) => m[1]) } }, select: { id: true } })).map((c) => c.id) } } }).catch(() => null);
    await mark('main-categories-v1');
    console.log('✔ Upgrade: main categories Cereals, Pulses, Spices, Vegetables, Fruits, Dairy Products, Seeds, Beauty Products');
  }
  if (!done.has('clear-images-v1')) {
    // the small, blurry images of the old site → new sharp 2× artwork (products, slider, buyer boxes, banners)
    const MAP = JSON.parse(readFileSync(path.join(__dirname, 'image-upgrade.json'), 'utf8'));
    const DROP = new Set(['/images/site/p1.png', '/images/site/p2.png', '/images/site/p3.png']);
    const swap = (t) => Object.entries(MAP).reduce((acc, [a, b]) => acc.split(a).join(b), t);
    const products = await prisma.product.findMany({ select: { id: true, images: true } });
    for (const p of products) {
      let list = [];
      try { list = JSON.parse(p.images || '[]'); } catch {}
      const next = [...new Set(list.filter((x) => !DROP.has(x)).map((x) => MAP[x] || x))];
      if (JSON.stringify(next) !== JSON.stringify(list)) await prisma.product.update({ where: { id: p.id }, data: { images: JSON.stringify(next) } });
    }
    for (const pg of await prisma.page.findMany({ select: { id: true, blocks: true } })) {
      const b = swap(pg.blocks);
      if (b !== pg.blocks) await prisma.page.update({ where: { id: pg.id }, data: { blocks: b } });
    }
    for (const st of await prisma.setting.findMany()) {
      const v = swap(st.value);
      if (v !== st.value) await prisma.setting.update({ where: { key: st.key }, data: { value: v } });
    }
    // translated copies of pages hold the same image paths
    for (const tr of await prisma.translation.findMany({ where: { entity: { in: ['page', 'settings'] } }, select: { id: true, data: true } })) {
      const d = swap(tr.data);
      if (d !== tr.data) await prisma.translation.update({ where: { id: tr.id }, data: { data: d } });
    }
    await mark('clear-images-v1');
    console.log('✔ Upgrade: sharp product and banner images');
  }
  if (!done.has('remove-app')) {
    // the install-app bar and the app welcome screen were removed
    await edit('app', (a) => ({ ...a, enabled: false, installBar: false, splash: false }));
    await mark('remove-app');
  }
}
