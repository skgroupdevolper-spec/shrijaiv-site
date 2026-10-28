# SHRIJAIV Organic — India's organic B2B marketplace

**Organic Living, Simplified.** A multi-vendor marketplace in **Next.js 15** that connects buyers and verified sellers of organic agriculture, organic beauty and organic processed-food products across India.

Design: white canvas, forest ink, organic green (`#009A35`) with a gold accent, glass header, 3D hero, tilt cards, mobile bottom navigation, app-like transitions. 13 Indian languages (English, Hindi, Urdu RTL, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese) with automatic translation.

---

## 1. What is included

| Area | Status |
|---|---|
| Public marketplace: home (3D hero + search + live counters), categories tree, products with filters/sort, product pages (gallery, specs, inquiry, reviews, schema.org), seller showrooms, buy leads (requirements), pricing, how-it-works, about, contact, support, FAQ, blog, legal pages | ✅ |
| Separate **Seller dashboard**: products (photos, price range, MOQ, specs, certifications, SEO, AI writer), inquiries inbox + chat, buy leads + quotes, reviews & replies, company profile + verification documents, analytics, AI tools, membership & invoices, settings | ✅ |
| Separate **Buyer dashboard**: post/edit/close requirements, compare & accept quotes, inquiries + chat, favourites, reviews, profile, settings | ✅ |
| **Admin** (full control): sellers (approve / verify / feature / suspend / delete, documents, manual plan activation), buyers, products, categories, requirements, inquiries (step into any conversation), reviews moderation, reports, plans, coupons, subscriptions, payments & invoices, redirects, audit log, CSV exports | ✅ |
| **Paid plans master switch** (OFF = everything free & unlimited; ON = plan limits), plans monthly / quarterly / yearly / lifetime / custom, trials, **auto-renewal**, Razorpay (UPI, cards, net banking, wallets, EMI) + webhook, GST invoices, coupons, bank-transfer mode, renewal reminders & expiry | ✅ |
| Notifications: email (SMTP) + in-app bell for sellers, buyers and admins on every event (inquiry, reply, quote, review, approval, payment) | ✅ |
| 13 Indian languages (EN, HI, UR rtl, BN, TA, TE, MR, GU, KN, ML, PA, OR, AS), auto-translation of site content, hreflang sitemap | ✅ |
| AI assistant (chat widget with live product/seller search; provider, model, keys & limits in admin), seller AI tools (describe, about, translate) | ✅ |
| Design: glass UI, 3D particles & tilt cards, reveal animations, mobile bottom bar, PWA (installable, offline page), page builder with 44+ sections incl. 8 marketplace sections, design editor | ✅ |
| SEO: per-page/product/seller meta, Product/Organization/FAQ schema, sitemap (all languages, products, sellers, categories), robots, RSS, IndexNow, redirects, GA4 / GTM / Meta Pixel / Clarity / Search Console IDs from admin | ✅ |
| Backup & restore (whole site in one file), security headers, rate limits, audit log | ✅ |

Seller-written products, showrooms, categories and buyer requirements are translated automatically into every enabled language as well (background jobs; edit any text in Admin → Languages).

Not yet: web-push notifications and a global dark mode (colours are editable in Admin → Design).

The AI Auto Publisher of the base project was removed on purpose — blog posts are written by the admin. The shared AI client lives in `src/lib/ai`.

## 2. Run it on your computer

You need [Node.js 20 or 22](https://nodejs.org).

```bash
npm install
cp .env.example .env          # Windows: copy .env.example .env
npm run setup                 # creates the database, starting content and the admin account
npm run dev
```

- Website: http://localhost:3000
- Admin: http://localhost:3000/admin (login with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` — change them in Admin → My profile)

---

## 3. `.env` for production

```env
DATABASE_URL="file:./data.db"          # SQLite (default). MySQL/PostgreSQL also work, see section 6
JWT_SECRET="long-random-secret"        # required
NEXT_PUBLIC_SITE_URL="https://www.shrijaiv.com"
ADMIN_EMAIL="you@shrijaiv.com"
ADMIN_PASSWORD="YourStrongPassword123"
UPLOAD_DIR="uploads"
```

Make a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

AI keys (Gemini / Claude / OpenAI) and Razorpay keys are entered in the admin panel or in `.env` (see `.env.example`).

---

## 4. Deploy

### GitHub → Vercel (test / staging URL)
1. Import this repository in Vercel.
2. Add a PostgreSQL database (Vercel Postgres / Supabase / Neon) and set `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `STORAGE=db`.
3. Deploy. The first visit to `/admin/login` creates the admin account.

### Hostinger / cPanel "Node.js App"
1. Upload the project (or deploy from GitHub) and create the app: Node **20+**, startup file **`server.js`**.
2. Add the environment variables from section 3 (`DATABASE_URL="mysql://USER:PASS@localhost:3306/DB"` for Hostinger MySQL), click **Run NPM Install**.
3. In the terminal (inside the app's virtual environment): `npm run build`, then **Restart**.

### VPS (Ubuntu) with PM2 + Nginx

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs nginx git
npm install -g pm2
cd /var/www && git clone https://github.com/skgroupdevolper-spec/shrijaiv-site.git shrijaiv && cd shrijaiv
cp .env.example .env && nano .env
npm install && npm run build
pm2 start ecosystem.config.js && pm2 save && pm2 startup
```

Nginx: proxy `shrijaiv.com` to `127.0.0.1:3000` (`client_max_body_size 20M`), then `certbot --nginx -d shrijaiv.com -d www.shrijaiv.com`.
DNS: **A record** for `@` and `www` → VPS IP.

Data that must survive deploys: `prisma/data.db` (SQLite) and `uploads/`. Both are ignored by git.

---

## 5. MySQL or PostgreSQL instead of SQLite

Set `DATABASE_URL="mysql://USER:PASS@localhost:3306/DB"` (or a `postgresql://` URL) and run `npm run build`. The database type is picked from the URL.

---

## 6. After going live

1. Admin → **My profile**: change the admin email and password.
2. Admin → **Site settings**: logo, contact details, social links, SMTP email, Search Console / GA4 / GTM IDs.
3. Admin → **Languages**: enable the languages you want and pick the translation engine.
4. Admin → **Marketplace settings → AI assistant**: add an API key; then Admin → **AI chatbot**: switch the chat on.
5. Admin → **Marketplace settings → Plans & payments**: Razorpay keys (and the webhook URL `/api/webhooks/razorpay`), then **Membership plans**, then flip the **Paid plans** switch when you are ready.
6. Admin → **Categories**: adjust the category tree; Admin → **Pages**: edit every section of every page.
