# SHRIJAIV Organic — India's organic B2B marketplace

**Organic Living, Simplified.** A multi-vendor marketplace in **Next.js 15** that connects buyers and verified sellers of organic agriculture, organic beauty and organic processed-food products across India.

Design: white canvas, forest ink, organic green (`#009A35`) with a gold accent, glass header, 3D hero, tilt cards, mobile bottom navigation, app-like transitions. 13 Indian languages (English, Hindi, Urdu RTL, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese) with automatic translation.

---

## 1. What is included (status)

| Area | Status |
|---|---|
| Public website, page builder (44 section types), blog, FAQs, testimonials, partners, media, header/footer/menu editors, design editor (colours, fonts, glass, animations) | ✅ from the base |
| Client accounts, login/register/forgot password, portal, admin ↔ client chat | ✅ from the base (being split into Seller / Buyer dashboards) |
| Admin panel: leads, subscribers, users, settings, SMTP, SEO, tracking, backup/restore | ✅ |
| Languages (13 Indian languages, RTL Urdu, hreflang, translation memory, Google/Gemini/Claude/DeepL engines) | ✅ |
| AI assistant (chat widget; provider, model, key, limits set in admin) | ✅ |
| Marketplace: categories, products, seller showrooms, buyer requirements (RFQ), inquiries, quotes, reviews & ratings | 🔜 Phase 2–5 |
| Separate Seller and Buyer dashboards | 🔜 Phase 4–5 |
| Membership plans (monthly / quarterly / yearly / lifetime / custom), **Paid plans ON/OFF master switch** (OFF = everything free & unlimited), auto-renewal, Razorpay (UPI, cards, net banking, wallets) | 🔜 Phase 7 |
| PWA (install as app), push notifications, 3D/glass polish | 🔜 Phase 9 |
| SEO: schema.org, sitemap for every language, Search Console / GA4 / GTM IDs from admin, IndexNow | ✅ base, extended in Phase 10 |

The AI Auto Publisher of the base project was removed on purpose — blog posts are written by the admin (rich editor, drafts, scheduling, SEO). The shared AI client lives in `src/lib/ai`.

---

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
4. Admin → **AI assistant**: add an API key and switch the chat on.
5. Admin → **Plans & payments**: Razorpay keys, plans, and the Paid plans ON/OFF switch.
