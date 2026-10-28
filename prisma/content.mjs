// SHRIJAIV Organic — starting website content (pages, FAQs, reviews, blog).
// Everything here can be edited in the admin panel; this file is only used by the seed.

let n = 0;
const id = (t) => `${t}-${++n}`;
const b = (type, data) => ({ id: id(type), type, data });

const ph = (title, lead, extra = {}) => b('pageHeader', { theme: 'light', eyebrow: extra.eyebrow || 'SHRIJAIV Organic', title, lead, crumb: extra.crumb || title, ...extra });

const rich = (heading, content, narrow = true) => b('richtext', { theme: 'light', heading, content, narrow });

const CTA = b('cta', { theme: 'dark', heading: 'Grow your organic business', accent: 'with India', lead: 'Join thousands of buyers and verified sellers. Registration is free — start in two minutes.', primary: { label: 'Become a seller', href: '/register?as=seller' }, secondary: { label: 'Become a buyer', href: '/register?as=buyer' } });

const IMG = '/images/site';
const sampleProducts = (names) => names.map((n, i) => ({ image: `${IMG}/product-${(i % 5) + 1}.png`, title: n, rating: 5 - (i % 3), meta: 'Price on request', link: { href: '/products' } }));
const sampleProducts2 = (names) => names.map((n, i) => ({ image: `${IMG}/product${(i % 10) + 1}.png`, title: n, rating: 5 - (i % 2), meta: 'Price on request', link: { href: '/products' } }));
const wantedSamples = [
  { title: 'Organic Turmeric Powder', extra: 'Buyer From Rajasthan', body: 'Buyer is interested in receiving quotations for 500 kg monthly, NPOP certified, 5% curcumin.', meta: 'Jan 14, 2025', image: `${IMG}/banner-3.png`, link: { href: '/post-requirement' } },
  { title: 'A2 Gir Cow Ghee', extra: 'Buyer From Maharashtra', body: 'Buyer is interested in receiving quotations for 1 litre jars, private label, 2,000 units.', meta: 'Jan 14, 2025', image: `${IMG}/banner-1.png`, link: { href: '/post-requirement' } },
  { title: 'Cold-pressed Groundnut Oil', extra: 'Buyer From Gujarat', body: 'Buyer is interested in receiving quotations for 15 kg tins, wood-pressed, monthly supply.', meta: 'Jan 14, 2025', image: `${IMG}/banner-2.png`, link: { href: '/post-requirement' } },
  { title: 'Organic Millets (Ragi, Jowar)', extra: 'Buyer From Karnataka', body: 'Buyer is interested in receiving quotations for 5 ton lots for a packaged-food brand.', meta: 'Jan 14, 2025', image: `${IMG}/banner-4.png`, link: { href: '/post-requirement' } },
];
const wantedWide = [
  { title: 'Herbal Face Wash (private label)', extra: 'Buyer From Delhi', body: 'Buyer is interested in receiving quotations for contract manufacturing, MOQ 1,000 units.', meta: 'Jan 14, 2025', image: `${IMG}/banner-6.webp`, link: { href: '/post-requirement' } },
  { title: 'Organic Jaggery Powder', extra: 'Buyer From Uttar Pradesh', body: 'Buyer is interested in receiving quotations for 2 tons monthly for a beverage company.', meta: 'Jan 14, 2025', image: `${IMG}/banner-7.webp`, link: { href: '/post-requirement' } },
];

const home = {
  slug: 'home',
  title: 'Home',
  metaTitle: "SHRIJAIV Organic | India's Organic B2B Marketplace for Buyers & Sellers",
  metaDescription: 'Connect with verified organic sellers and buyers across India: organic agriculture, organic beauty and organic processed food. Post requirements, get quotes and grow your organic business.',
  blocks: [
    b('shopHero', {
      sidebarTitle: 'All Category',
      sidebarItems: 10,
      searchPlaceholder: 'Search for buyer or supplier...',
      supplierLabel: 'Find Supplier',
      buyerLabel: 'Find Buyer',
      interval: 6,
      slides: [
        { image: `${IMG}/slider-02.webp`, badge: 'Buyer', title: 'Get the best quality products at the lowest prices', text: 'We have prepared special offers for you on organic products. Don\'t miss these opportunities…', link: { label: 'View More', href: '/products' } },
        { image: `${IMG}/slider-01.webp`, badge: 'Seller', title: 'Sell organic. Reach all of India.', text: 'A free showroom, buyer inquiries in your inbox and buy leads you can quote — zero commission.', link: { label: 'Start selling', href: '/register?as=seller' } },
        { image: `${IMG}/slider-02.webp`, badge: 'Buyer', title: 'Post what you need — sellers come to you', text: 'Describe the product, quantity and delivery location. Verified sellers send quotes to your dashboard.', link: { label: 'Post a requirement', href: '/post-requirement' } },
      ],
    }),
    b('productRow', { theme: 'light', heading: 'Organic Agricultural Product Buyer', limit: 8, layout: 'row', samples: true, cta: { label: 'View all', href: '/products' }, items: sampleProducts(['Fresh Vegetables Basket', 'Baby Food Combo', 'Green Tea & Snacks', 'Fresh Fish', 'Organic Dry Fruits', 'Dairy Pack', 'Premium Oats', 'Herbal Tea']) }),
    b('wantedCards', { theme: 'light', heading: 'Organic Agricultural Product Suppliers', layout: 'cards', limit: 4, samples: true, images: `${IMG}/banner-3.png\n${IMG}/banner-1.png\n${IMG}/banner-2.png\n${IMG}/banner-4.png`, cta: { label: 'View all', href: '/requirements' }, items: wantedSamples }),
    b('adBanner', { image: `${IMG}/ad-wide.webp`, alt: 'SHRIJAIV Organic — grocery marketplace', link: { label: '', href: '/become-a-seller' }, narrow: true }),
    b('productRow', { theme: 'light', heading: 'Organic Agricultural Product Buyer', limit: 12, layout: 'grid', samples: true, cta: { label: 'View all', href: '/products' }, items: sampleProducts2(['Apple Juice', 'Mouthwash', 'Orange Juice', 'Muskmelon', 'Margherita Pizza', 'Herbal Rinse', 'Apple Juice', 'Pizza Base', 'Muskmelon', 'Simply Orange', 'Apple Juice', 'Fresh Melon']) }),
    b('wantedCards', { theme: 'light', heading: 'Organic Agricultural Product Suppliers', layout: 'wide', limit: 2, samples: true, images: `${IMG}/banner-6.webp\n${IMG}/banner-7.webp\n${IMG}/banner-5.png`, cta: { label: 'View all', href: '/requirements' }, items: wantedWide }),
    b('regions', { theme: 'light', heading: 'Suppliers By Region', limit: 14, cta: { label: 'View all', href: '/sellers' } }),
    b('trustLogos', { theme: 'light', heading: '1.2 million businesses trust us', cta: { label: 'View all', href: '/sellers' }, images: `${IMG}/logo1.png\n${IMG}/logo2.png\n${IMG}/logo3.png\n${IMG}/logo4.png\n${IMG}/logo5.png\n${IMG}/logo6.png` }),
    b('adBanner', { image: `${IMG}/ad-wide.webp`, alt: 'SHRIJAIV Organic', link: { label: '', href: '/become-a-buyer' }, narrow: true }),
    b('testimonials', { theme: 'light', heading: 'What our customers say', limit: 6 }),
    b('categories', { theme: 'sand', label: 'Browse', heading: 'Shop by', accent: 'category', showSub: true, cta: { label: 'All products', href: '/products' } }),
    b('howItWorks', {
      theme: 'light',
      label: 'Simple',
      heading: 'How',
      accent: 'SHRIJAIV works',
      lead: 'Register free, connect directly, close the deal on your own terms. We never take a commission.',
      buyerTitle: 'For buyers',
      buyerSteps: 'Search or browse — organic products and verified sellers across India\nPost a requirement — tell sellers what you need, how much and where\nCompare quotes — prices, MOQ and delivery side by side in your dashboard\nRate the seller — your review helps the whole community',
      buyerLink: { label: 'Create buyer account', href: '/register?as=buyer' },
      sellerTitle: 'For sellers',
      sellerSteps: 'Create your showroom — logo, story, certifications and location\nAdd products — photos, prices, MOQ and specifications (AI helps you write)\nReceive inquiries — by email, WhatsApp and in your dashboard\nQuote on buy leads — answer buyer requirements and win new customers',
      sellerLink: { label: 'Create seller account', href: '/register?as=seller' },
    }),
    b('plans', { theme: 'sand', label: 'Membership', heading: 'Our', accent: 'Pricing', lead: 'Start free. Upgrade when you need more products, more buyer contacts or a Verified badge.', freeLead: 'Every feature is free and unlimited for all sellers during our launch.', freeBanner: true }),
    b('faq', { theme: 'light', layout: 'split', label: 'Questions', heading: 'Frequently asked', accent: 'questions', group: 'home', helpTitle: 'Still have a question?', helpText: 'Our team answers on WhatsApp and email, in your language.' }),
    CTA,
  ],
};

const about = {
  slug: 'about',
  title: 'About us',
  metaTitle: 'About SHRIJAIV Organic — Organic Living, Simplified',
  metaDescription: 'Shrijaiv is an LLP registered with the Industry Department of the State of Rajasthan, India — promoting organic foods and linking organic producers to markets.',
  blocks: [
    b('photoBanner', { image: `${IMG}/about-hero.webp`, eyebrow: 'SHRIJAIV Organic · Est. 2024', title: 'About Us', lead: 'Shrijaiv an LLP registered with Industry Department of State of Rajasthan, India.' }),
    b('blobSplit', { theme: 'light', image: `${IMG}/about-2024.png`, imageAlt: 'Established 2024', heading: 'Who we are', lead: 'Shrijaiv is an LLP with a limited liability of 2.00 lacs, registered with the Industry Department of State of Rajasthan, India. Though registered recently as MSME its promoters are engaged in the development of receipts for organic processed foods, motivated producers of organic foods, organic grains, organic vegetables and organic fruits for the public.', primary: { label: 'Contact Now', href: '/contact' } }),
    b('blobSplit', { theme: 'light', reverse: true, image: `${IMG}/do.png`, imageAlt: 'What we do', heading: 'What we do?', lead: 'Shrijaiv, an LLP registered with the Industry Department of the State of Rajasthan, India, is engaged in:', points: 'Promotion of organic foods.\nMotivating producers of organic foods by enhancing their knowledge for the production of organic products and linking them to organic markets.\nResearch and development of organic processed products.\nEducating the general populace about the benefits of using organic products.', primary: { label: 'Call Now', href: 'phone' } }),
    b('team', { theme: 'sand', items: [{ image: `${IMG}/teammember.jpeg`, title: 'Raunaq Sharma', meta: 'Director', body: 'Our Director RAUNAQ Sharma is a graduate with degree of Bachelor of Science in Hotel Management, Catering and Nutrition is well versed with the human need of the foods available and nutrition required. Also, as MBA in finance he has served as financial consultant with renowned firms. His experience in Finance and Hospitality industry has catapulted the firm\'s regulation as well as appetite for consumption of new ideas for serving the populace with respect to them.' }] }),
    b('iconTrio', { theme: 'light', heading: 'How It Works', items: [
      { image: `${IMG}/about-icon1.png`, title: 'Verified organic sellers', body: 'GST, FSSAI and organic certificates checked by our team before the Verified badge is awarded.' },
      { image: `${IMG}/about-icon2.png`, title: 'Direct buyer–seller contact', body: 'Inquiries, quotes and chat go straight between you — no middlemen, no commission.' },
      { image: `${IMG}/about-icon3.png`, title: 'Grow with India', body: 'Buy leads from every state, 13 Indian languages, and tools that help small producers sell big.' },
    ] }),
    b('stats', { theme: 'light', variant: 'dark', heading: 'SHRIJAIV in numbers', items: [{ value: '3', label: 'Organic worlds: agriculture, beauty, food' }, { value: '28', label: 'States & union territories' }, { value: '13', label: 'Languages' }, { value: '0%', label: 'Commission' }] }),
    b('cards', { theme: 'sand', layout: 'steps', columns: '2', label: 'Verification', heading: 'How a seller gets the', accent: 'Verified badge', items: [
      { title: 'Register and complete the showroom', body: 'Company details, location, story and product photos.' },
      { title: 'Upload documents', body: 'GST certificate, FSSAI licence (for food) and organic certification (NPOP / PGS-India / USDA / EU).' },
      { title: 'Our team checks', body: 'Documents are checked against the official registries. We may call the seller.' },
      { title: 'Badge awarded', body: 'The Verified badge appears on the showroom and on every product. It is reviewed every year.' },
    ] }),
    CTA,
  ],
};

const contact = {
  slug: 'contact',
  title: 'Contact us',
  metaTitle: 'Contact SHRIJAIV Organic',
  metaDescription: 'Talk to the SHRIJAIV team about selling, buying, verification or partnerships. WhatsApp, email and phone support in your language.',
  blocks: [
    b('photoBanner', { image: `${IMG}/customer-banner.png`, eyebrow: 'Contact', title: 'Contact Us', lead: 'Questions about selling, buying, verification or a partnership? Write to us in any Indian language — we reply within one working day.' }),
    b('blobSplit', { theme: 'light', image: `${IMG}/call-center-pana-1.png`, imageAlt: 'Customer care', label: 'We are here to help', heading: 'Talk to a real person', lead: 'Call, WhatsApp or email — our team in Jaipur answers Mon–Sat, 10:00–19:00 IST. Our AI assistant (bottom right) answers around the clock.', points: '276, Frontier Colony, Adarsh Nagar, Jaipur, Rajasthan\nSupport in 13 Indian languages\nSeller verification & membership help', primary: { label: 'Call 93140 51605', href: 'phone' }, secondary: { label: 'WhatsApp', href: 'whatsapp' } }),
    b('contact', { theme: 'light', formTitle: 'Send us a message', formText: 'Tell us how we can help. For product inquiries, please contact the seller directly from their showroom.', formBadge: 'Reply within 24h', topics: 'Selling on SHRIJAIV\nBuying / sourcing help\nSeller verification\nMembership & payments\nPartnership\nReport a problem\nOther', consent: true, showMap: false, points: 'Support in 13 Indian languages\nReal people, not bots (but our AI assistant never sleeps)\nWhatsApp, email and phone' }),
    b('faq', { theme: 'sand', layout: 'stack', heading: 'Before you write', group: 'support' }),
  ],
};

const support = {
  slug: 'customer-support',
  title: 'Customer support',
  metaTitle: 'Customer support — SHRIJAIV Organic',
  metaDescription: 'Help centre for buyers and sellers on SHRIJAIV: accounts, listings, inquiries, verification, membership plans and payments.',
  blocks: [
    b('photoBanner', { image: `${IMG}/banner-6.webp`, eyebrow: 'Help centre', title: 'Customer Support', lead: 'Browse the help topics below, ask our AI assistant, or open a ticket — we reply within 24 hours.' }),
    b('blobSplit', { theme: 'light', reverse: true, image: `${IMG}/group-chat-pana-2.png`, imageAlt: 'Support chat', heading: 'Support that speaks', accent: 'your language', lead: 'Buyers and sellers get help in 13 Indian languages — on WhatsApp, email, phone and inside the dashboard chat.', points: 'Account, listings & inquiries\nMembership plans, invoices & GST\nVerification documents\nReporting fake listings or spam', primary: { label: 'WhatsApp us', href: 'whatsapp' } }),
    b('cards', { theme: 'light', layout: 'compact', columns: '3', heading: 'Help topics', items: [
      { icon: 'store', title: 'Selling on SHRIJAIV', body: 'Showroom, products, inquiries, buy leads and the Verified badge.', link: { label: 'Seller guide', href: '/how-it-works' } },
      { icon: 'shopping-bag', title: 'Buying & sourcing', body: 'Searching, posting requirements, comparing quotes and reviews.', link: { label: 'Buyer guide', href: '/how-it-works' } },
      { icon: 'crown', title: 'Membership & payments', body: 'Plans, invoices, GST, auto-renewal and refunds.', link: { label: 'See plans', href: '/pricing' } },
      { icon: 'verified', title: 'Verification', body: 'Which documents we check and how long it takes.', link: { label: 'Verification FAQ', href: '/faq' } },
      { icon: 'alert', title: 'Report a problem', body: 'Fake listings, spam or a dispute with another member.', link: { label: 'Contact us', href: '/contact' } },
      { icon: 'lock', title: 'Account & security', body: 'Password reset, email change, deleting your account.', link: { label: 'Reset password', href: '/forgot-password' } },
    ] }),
    b('faq', { theme: 'sand', layout: 'split', heading: 'Common questions', group: 'support', helpTitle: 'Need a human?', helpText: 'WhatsApp or call us — Mon–Sat, 10:00–19:00 IST.' }),
    b('contact', { theme: 'light', formTitle: 'Open a support ticket', formBadge: 'Reply within 24h', topics: 'Account\nListings\nInquiries\nMembership & payments\nVerification\nReport a problem\nOther', compact: false, consent: true, showMap: false }),
  ],
};

const howItWorks = {
  slug: 'how-it-works',
  title: 'How it works',
  metaTitle: 'How SHRIJAIV works — for buyers and sellers',
  metaDescription: 'Buyers search, post requirements and compare quotes. Sellers build a showroom, list products and answer inquiries. Free to join, no commission.',
  blocks: [
    b('photoBanner', { image: `${IMG}/banner-7.webp`, eyebrow: 'Guide', title: 'How It Works', lead: 'A marketplace where buyers and verified organic sellers meet directly. Free to join, no commission on deals.' }),
    b('iconTrio', { theme: 'light', items: [
      { image: `${IMG}/about-icon1.png`, title: 'Register free', body: 'Sellers and buyers create an account in two minutes.' },
      { image: `${IMG}/about-icon2.png`, title: 'List or post', body: 'Sellers list products; buyers post what they want to buy.' },
      { image: `${IMG}/about-icon3.png`, title: 'Connect & deal', body: 'Inquiries, quotes and chat go directly between you.' },
    ] }),
    b('howItWorks', { theme: 'light', buyerTitle: 'For buyers', buyerSteps: 'Create a free buyer account — one minute, mobile number and email\nSearch or browse — filter by category, state, price and Verified sellers\nSend inquiries — or post a requirement and let sellers quote you\nCompare and choose — quotes side by side, chat in the dashboard\nRate the seller — reviews keep the marketplace honest', buyerLink: { label: 'Create buyer account', href: '/register?as=buyer' }, sellerTitle: 'For sellers', sellerSteps: 'Create a free seller account — company, type and location\nBuild your showroom — logo, banner, story, certifications\nAdd products — photos, price range, MOQ, specs (AI writes the description for you)\nGet verified — upload GST, FSSAI and organic certificates\nAnswer inquiries & quote buy leads — email, WhatsApp and dashboard\nUpgrade when you grow — more products, more contacts, featured slots', sellerLink: { label: 'Create seller account', href: '/register?as=seller' } }),
    b('cards', { theme: 'sand', layout: 'icons', columns: '4', heading: 'Why sellers choose', accent: 'SHRIJAIV', items: [
      { icon: 'percent', title: '0% commission', body: 'Deals are between you and the buyer. We never take a cut.' },
      { icon: 'megaphone', title: 'Buy leads', body: 'See what buyers need right now and quote in one click.' },
      { icon: 'languages', title: '13 languages', body: 'Your showroom is translated automatically for buyers across India.' },
      { icon: 'sparkles', title: 'AI tools', body: 'Product descriptions, SEO titles and translations written for you.' },
    ] }),
    b('plans', { theme: 'light', heading: 'Membership', accent: 'plans', freeBanner: true }),
    CTA,
  ],
};

const becomeSeller = {
  slug: 'become-a-seller',
  title: 'Become a seller',
  metaTitle: 'Sell organic products online in India — Become a SHRIJAIV seller',
  metaDescription: 'List your organic products free, reach buyers across India, receive inquiries on WhatsApp and email, and get the Verified badge. No commission.',
  blocks: [
    b('photoBanner', { image: `${IMG}/banner-1.png`, eyebrow: 'For sellers', title: 'Become a Seller', lead: 'A free showroom, buyer inquiries in your inbox and buy leads you can quote — with zero commission.' }),
    b('blobSplit', { theme: 'light', image: `${IMG}/telecommuting-pana-1.png`, imageAlt: 'Sell online', heading: 'Sell organic.', accent: 'Reach all of India.', lead: 'List your organic products once and reach retailers, brands, restaurants and exporters across every state — in 13 Indian languages, automatically.', points: 'Free showroom with your own link\nInquiries on WhatsApp, email and dashboard\nQuote buyer requirements (WANTED leads)\nVerified badge after document check', primary: { label: 'Create seller account', href: '/register?as=seller' }, secondary: { label: 'See plans', href: '/pricing' } }),
    b('wantedCards', { theme: 'sand', layout: 'cards', heading: 'Buyers are looking for', limit: 4, samples: wantedSamples, cta: { label: 'See all buy leads', href: '/requirements' } }),
    b('cards', { theme: 'light', layout: 'icons', columns: '3', heading: 'Everything a seller needs', items: [
      { icon: 'store', title: 'Your own showroom', body: 'Logo, banner, story, certifications, location map and all your products on one page with its own link.' },
      { icon: 'package', title: 'Unlimited product details', body: 'Up to 15 photos, video, price range, MOQ, packaging, shelf life, specs and a PDF catalogue.' },
      { icon: 'chat', title: 'Inquiries everywhere', body: 'Every inquiry reaches your dashboard, your email and WhatsApp — reply from wherever you are.' },
      { icon: 'megaphone', title: 'Buy leads', body: 'Buyers post requirements daily. Quote with your price and delivery time; the buyer picks.' },
      { icon: 'verified', title: 'Verified badge', body: 'Upload GST, FSSAI and organic certificates. Verified sellers get more inquiries.' },
      { icon: 'trending', title: 'Analytics', body: 'Views, inquiries and conversion per product — know what sells.' },
    ] }),
    b('cards', { theme: 'sand', layout: 'steps', columns: '2', heading: 'Start in', accent: '10 minutes', items: [
      { title: 'Register', body: 'Company name, business type, state and mobile number.' },
      { title: 'Complete your showroom', body: 'Add your logo, a short story and your certifications.' },
      { title: 'Add your first products', body: 'Photos, price and MOQ. Our AI can write the description.' },
      { title: 'Get verified', body: 'Upload documents; our team checks them within 2 working days.' },
    ] }),
    b('faq', { theme: 'light', layout: 'split', heading: 'Seller questions', group: 'seller', helpTitle: 'Talk to us', helpText: 'We help with listings and verification in your language.' }),
    b('plans', { theme: 'sand', heading: 'Membership', accent: 'plans', freeBanner: true }),
    b('cta', { theme: 'dark', heading: 'Ready to sell?', lead: 'Create your free seller account now.', primary: { label: 'Create seller account', href: '/register?as=seller' } }),
  ],
};

const becomeBuyer = {
  slug: 'become-a-buyer',
  title: 'Become a buyer',
  metaTitle: 'Source organic products in bulk — Become a SHRIJAIV buyer',
  metaDescription: 'Retailers, brands, restaurants and exporters: find verified organic sellers, post requirements and compare quotes. Free forever for buyers.',
  blocks: [
    b('photoBanner', { image: `${IMG}/banner-2.png`, eyebrow: 'For buyers', title: 'Become a Buyer', lead: 'Verified sellers, direct prices and quotes that come to you. Free forever for buyers.' }),
    b('blobSplit', { theme: 'light', reverse: true, image: `${IMG}/online-review-pana-2.png`, imageAlt: 'Compare quotes', heading: 'Source organic', accent: 'with confidence.', lead: 'Post what you need once — verified organic sellers from across India send quotes to your dashboard. Compare price, MOQ, delivery and ratings side by side.', points: 'Verified GST / FSSAI / organic certificates\nPost requirements, receive quotes\nChat, email or WhatsApp with sellers\nReal reviews from real buyers', primary: { label: 'Create buyer account', href: '/register?as=buyer' }, secondary: { label: 'Post a requirement', href: '/post-requirement' } }),
    b('productRow', { theme: 'light', heading: 'Fresh from verified sellers', layout: 'row', limit: 5, items: sampleProducts2(['Organic Turmeric Powder', 'Cold-pressed Coconut Oil', 'Organic Basmati Rice', 'Herbal Face Pack', 'Organic Jaggery']), cta: { label: 'Browse all products', href: '/products' } }),
    b('cards', { theme: 'light', layout: 'icons', columns: '3', heading: 'Why buy on', accent: 'SHRIJAIV', items: [
      { icon: 'verified', title: 'Verified sellers', body: 'GST, FSSAI and organic certificates checked by our team. Look for the badge.' },
      { icon: 'megaphone', title: 'Post, then relax', body: 'Describe what you need once — sellers send quotes to your dashboard.' },
      { icon: 'scale', title: 'Compare quotes', body: 'Price, MOQ, delivery time and seller rating side by side.' },
      { icon: 'chat', title: 'Direct contact', body: 'Chat, email or WhatsApp with the seller. No middlemen, no commission.' },
      { icon: 'star', title: 'Real reviews', body: 'Ratings from buyers who actually made inquiries and orders.' },
      { icon: 'languages', title: 'Your language', body: 'Browse and chat in 13 Indian languages.' },
    ] }),
    b('faq', { theme: 'sand', layout: 'split', heading: 'Buyer questions', group: 'buyer' }),
    b('cta', { theme: 'dark', heading: 'Start sourcing today', primary: { label: 'Create buyer account', href: '/register?as=buyer' }, secondary: { label: 'Browse products', href: '/products' } }),
  ],
};

const faqPage = {
  slug: 'faq',
  title: 'FAQ',
  metaTitle: 'Frequently asked questions — SHRIJAIV Organic',
  metaDescription: 'Answers about registering, selling, buying, verification, membership plans, payments and safety on SHRIJAIV.',
  blocks: [
    ph('Frequently asked', 'Everything about buying, selling, verification and membership.', { titleAccent: 'questions', eyebrow: 'Help', crumb: 'FAQ' }),
    b('faq', { theme: 'light', layout: 'stack', heading: 'General', group: 'home' }),
    b('faq', { theme: 'sand', layout: 'stack', heading: 'For sellers', group: 'seller' }),
    b('faq', { theme: 'light', layout: 'stack', heading: 'For buyers', group: 'buyer' }),
    b('faq', { theme: 'sand', layout: 'stack', heading: 'Support, safety & payments', group: 'support', helpTitle: 'Not answered?', helpText: 'Write to us — we reply within one working day.' }),
  ],
};

const pricing = {
  slug: 'pricing',
  title: 'Membership',
  metaTitle: 'Membership plans — SHRIJAIV Organic',
  metaDescription: 'Silver, Gold and Platinum membership plans for organic sellers. Start with the free plan and upgrade when you grow. Monthly, quarterly, yearly and lifetime options.',
  blocks: [
    b('photoBanner', { image: `${IMG}/banner-5.png`, eyebrow: 'For sellers', title: 'Membership', lead: 'Start with the free plan. Upgrade to Silver, Gold or Platinum when you need more products, more buyer contacts or a Verified badge.' }),
    b('plans', { theme: 'light', heading: 'Choose your', accent: 'plan', freeBanner: true }),
    b('iconTrio', { theme: 'sand', heading: 'Every plan includes', items: [
      { image: `${IMG}/veryfy.png`, title: 'Verification review', body: 'Documents checked by our team; Verified badge on your showroom.' },
      { image: `${IMG}/inquire.png`, title: 'Inquiries everywhere', body: 'Dashboard, email and WhatsApp — never miss a buyer.' },
      { image: `${IMG}/verinty.png`, title: 'All-India payments', body: 'UPI, cards, net banking and wallets. GST invoice for every payment, auto-renewal optional.' },
    ] }),
    b('faq', { theme: 'light', layout: 'split', heading: 'Membership questions', group: 'seller', helpTitle: 'Not sure which plan?', helpText: 'Try the free plan first — upgrade any time from your dashboard.' }),
    b('cta', { theme: 'dark', heading: 'Try Free Plan', lead: 'Create your seller account and list your first products today — no card required.', primary: { label: 'Try Free Plan', href: '/register?as=seller' }, secondary: { label: 'Talk to us', href: '/contact' } }),
  ],
};

const legal = (slug, title, metaDescription, content) => ({ slug, title, metaTitle: `${title} — SHRIJAIV Organic`, metaDescription, blocks: [ph(title, '', { eyebrow: 'Legal', crumb: title }), rich('', content)] });

const terms = legal('terms', 'Terms & Conditions', 'Terms of use of the SHRIJAIV Organic marketplace for visitors, buyers and sellers.', `
<p><em>Last updated: {date}. These terms are a starting template — please have them reviewed by your legal adviser before launch.</em></p>
<h2>1. The platform</h2><p>SHRIJAIV Organic ("SHRIJAIV", "we") operates an online B2B marketplace that lets sellers present organic products and lets buyers contact them. SHRIJAIV is not a party to any sale. Prices, quality, delivery and payment are agreed directly between buyer and seller.</p>
<h2>2. Accounts</h2><p>You must provide accurate business details. One person may hold one buyer or seller account. You are responsible for everything done through your account. We may suspend or delete accounts that break these terms.</p>
<h2>3. Sellers</h2><p>Sellers warrant that they own or are authorised to sell the listed products, that organic claims are backed by valid certification, and that listings are accurate and lawful (including FSSAI and labelling rules). Listings may be reviewed, edited or removed by our team.</p>
<h2>4. Buyers</h2><p>Requirements and inquiries must be genuine. Contact details shared by sellers may only be used for the stated purchase.</p>
<h2>5. Verification</h2><p>The Verified badge means we have checked the documents a seller submitted at that time. It is not a guarantee of product quality or of any transaction.</p>
<h2>6. Membership plans</h2><p>Paid plans renew as shown at checkout. Auto-renewal can be switched off any time from the dashboard. Fees are not refundable except as required by law or as described in our Refund Policy.</p>
<h2>7. Content</h2><p>You keep the rights to what you upload and grant SHRIJAIV a licence to display, translate and promote it on the platform.</p>
<h2>8. Prohibited</h2><p>Fake listings, misleading organic claims, spam, harassment, scraping, and anything illegal.</p>
<h2>9. Liability</h2><p>SHRIJAIV provides the platform "as is" and is not liable for losses arising from transactions between members, to the extent permitted by Indian law.</p>
<h2>10. Governing law</h2><p>These terms are governed by the laws of India. Courts at {city} have jurisdiction.</p>
`);

const privacy = legal('privacy', 'Privacy Policy', 'How SHRIJAIV Organic collects, uses and protects your personal and business data.', `
<p><em>Last updated: {date}. Template — review with your legal adviser.</em></p>
<h2>What we collect</h2><p>Account details (name, email, mobile, company, GST/FSSAI numbers you upload), listings and messages you create, inquiries you send, payment records (processed by Razorpay — we never store card numbers), and usage data (pages visited, device, approximate location).</p>
<h2>How we use it</h2><p>To run the marketplace, deliver inquiries and quotes between members, verify sellers, process membership payments, send notifications you asked for, improve the service and prevent fraud.</p>
<h2>Sharing</h2><p>When you send an inquiry or quote, the recipient sees the details you provide. We share data with service providers (hosting, email, payments, translation and AI providers) under contract, and with authorities when required by law. We never sell your data.</p>
<h2>Your rights</h2><p>You can view and edit your data in your dashboard, download it, or ask us to delete your account at <a href="mailto:support@shrijaiv.com">support@shrijaiv.com</a>.</p>
<h2>Cookies</h2><p>We use essential cookies for login and preferences, and analytics cookies (Google Analytics) to understand usage. You can block analytics cookies in your browser.</p>
<h2>Security</h2><p>Passwords are hashed, connections are encrypted (HTTPS) and access to data is restricted to staff who need it.</p>
`);

const refund = legal('refund-policy', 'Refund & Cancellation Policy', 'Cancellation and refund rules for SHRIJAIV membership plans.', `
<p><em>Template — adjust to your business and have it reviewed.</em></p>
<h2>Membership plans</h2><p>You can cancel auto-renewal at any time from Seller dashboard → Membership; your plan stays active until the end of the paid period.</p>
<h2>Refunds</h2><p>Monthly plans are not refundable. Quarterly, yearly and lifetime plans can be refunded within 7 days of first purchase if no inquiry contact has been unlocked and no featured slot used. Refunds go back to the original payment method within 7–10 working days.</p>
<h2>Product purchases</h2><p>SHRIJAIV does not sell products. Refunds for goods are agreed between buyer and seller.</p>
<h2>Contact</h2><p><a href="mailto:support@shrijaiv.com">support@shrijaiv.com</a></p>
`);

const disclaimer = legal('disclaimer', 'Disclaimer', 'SHRIJAIV Organic is a marketplace that connects buyers and sellers; it does not sell products or guarantee transactions.', `
<p>SHRIJAIV Organic is an online marketplace. We do not manufacture, stock, inspect or sell any product listed on the platform. Product information, prices and organic claims are provided by sellers. The Verified badge confirms that documents were checked at the time of verification; it is not a guarantee of quality, availability or delivery. Always confirm certifications, samples and terms directly with the seller before ordering.</p>
`);

const blogPage = {
  slug: 'blog',
  title: 'Blog',
  metaTitle: 'Organic journal — guides, market insights and seller tips',
  metaDescription: 'Guides on organic certification, sourcing, pricing and selling organic products in India, from the SHRIJAIV team.',
  blocks: [ph('The organic', 'Guides, market insights and tips for buyers and sellers of organic products in India.', { titleAccent: 'journal', eyebrow: 'Blog', crumb: 'Blog' }), b('blog', { theme: 'light', paged: true })],
};

export const allPages = [home, about, contact, support, howItWorks, becomeSeller, becomeBuyer, pricing, faqPage, blogPage, terms, privacy, refund, disclaimer];

export const faqRecords = [
  { group: 'home', order: 1, question: 'Is SHRIJAIV free to use?', answer: 'Yes. Buyer accounts are free forever. Seller accounts are free to create and list products; optional membership plans add more products, buyer contacts and the Verified badge. We never take a commission on deals.' },
  { group: 'home', order: 2, question: 'Does SHRIJAIV sell the products?', answer: 'No. SHRIJAIV connects buyers with sellers. You agree price, quantity, delivery and payment directly with the seller.' },
  { group: 'home', order: 3, question: 'What does "Verified" mean?', answer: 'Our team has checked the seller\'s GST certificate, FSSAI licence (for food) and organic certification (NPOP, PGS-India, USDA or EU) against the official registries. Verification is reviewed every year.' },
  { group: 'home', order: 4, question: 'Which languages does the marketplace support?', answer: 'English, Hindi, Urdu, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia and Assamese. Listings are translated automatically and our AI assistant answers in your language.' },
  { group: 'home', order: 5, question: 'How quickly do sellers reply?', answer: 'Most verified sellers reply within 24 hours. Every inquiry is delivered to the seller\'s dashboard, email and WhatsApp.' },
  { group: 'seller', order: 1, question: 'What can I list?', answer: 'Organic agriculture produce (fruit, vegetables, grains, pulses, spices, dairy, oil seeds, inputs), organic beauty products and organic processed food. Products must be organic and lawful to sell in India.' },
  { group: 'seller', order: 2, question: 'Do I need certification to sell?', answer: 'You can list without it, but the Verified badge — and most buyer trust — requires a valid organic certificate plus GST and FSSAI (for food).' },
  { group: 'seller', order: 3, question: 'How do I receive inquiries?', answer: 'In your seller dashboard, by email and on WhatsApp. Reply from the dashboard to keep the conversation in one place; the buyer sees it in theirs.' },
  { group: 'seller', order: 4, question: 'What are buy leads?', answer: 'Requirements posted by buyers ("Need 500 kg organic turmeric monthly, delivery Mumbai"). Sellers send a quote with price, MOQ and delivery time; the buyer compares and chooses.' },
  { group: 'seller', order: 5, question: 'How do membership plans and auto-renewal work?', answer: 'Choose monthly, quarterly, yearly or lifetime. Pay with UPI, cards, net banking or wallets via Razorpay. If you enable auto-renewal, the plan renews automatically; you can switch it off any time and keep the plan until the period ends.' },
  { group: 'buyer', order: 1, question: 'How do I post a requirement?', answer: 'Click "Post a requirement", describe the product, quantity, delivery location and deadline. Verified sellers see it and send quotes to your dashboard. Posting is free.' },
  { group: 'buyer', order: 2, question: 'Can I contact a seller without an account?', answer: 'Yes — send an inquiry from any product or showroom with your name, email and mobile. With a free buyer account you can track replies, compare quotes and leave reviews.' },
  { group: 'buyer', order: 3, question: 'Who can write reviews?', answer: 'Buyers with an account. Reviews from buyers who made an inquiry with that seller are marked "Verified buyer". Our team checks reviews before they appear.' },
  { group: 'buyer', order: 4, question: 'Is my contact information safe?', answer: 'Your details are shared only with the seller you contact or who quotes on your requirement. We never sell data.' },
  { group: 'support', order: 1, question: 'How do I report a fake listing or a bad experience?', answer: 'Use "Report" on the listing or write to support@shrijaiv.com with the link. We investigate within 2 working days and can suspend sellers.' },
  { group: 'support', order: 2, question: 'Which payment methods are accepted for plans?', answer: 'UPI, credit and debit cards, net banking, wallets and EMI through Razorpay. GST invoices are generated automatically.' },
  { group: 'support', order: 3, question: 'How do I delete my account?', answer: 'Dashboard → Settings → Delete account, or email support@shrijaiv.com. Listings and messages are removed within 30 days.' },
  { group: 'support', order: 4, question: 'Can I change my account from buyer to seller?', answer: 'Yes — contact support and we will switch the role, or create a separate seller account with another email.' },
];

export const testimonialRecords = [
  { name: 'Helen Guo', role: '@HelenGuo_', country: 'Jaipur', rating: 5, text: 'Been using SHRIJAIV for months. Good for re-engagement — and you can get creative with your listings and messaging.', avatar: `${IMG}/testi1.png` },
  { name: 'John Doe', role: '@JohnDoe', country: 'Delhi', rating: 5, text: 'Excellent service! The team was very professional, and the experience exceeded my expectations.', avatar: `${IMG}/testi2.png` },
  { name: 'Sarah Lee', role: '@SarahLee', country: 'Mumbai', rating: 5, text: 'Amazing platform! It has completely changed how we interact with customers and boosted our sales.', avatar: `${IMG}/testi3.png` },
  { name: 'Ramesh Patel', role: 'Organic farmer (FPO)', country: 'Gujarat', rating: 5, text: 'Within two weeks of listing our groundnut oil we had buyers from three states. No commission, direct calls. This is what farmers needed.' },
  { name: 'Priya Nair', role: 'Founder, natural skincare brand', country: 'Kerala', rating: 5, text: 'The showroom looks better than our own website and the Hindi translation brought us buyers from the north we never reached before.' },
  { name: 'Mohammed Irfan', role: 'Wholesale buyer', country: 'Hyderabad', rating: 5, text: 'I post one requirement and get five quotes by the evening. Comparing MOQ and delivery in one screen saves me days.' },
  { name: 'Sunita Devi', role: 'Jaggery producer', country: 'Uttar Pradesh', rating: 4, text: 'Verification took two days and after the badge our inquiries doubled. The AI wrote our product descriptions in English and Hindi.' },
  { name: 'Arjun Mehta', role: 'Restaurant chain purchasing', country: 'Mumbai', rating: 5, text: 'Finally a place where "organic" actually means certified. We source millets and ghee for 12 kitchens through SHRIJAIV.' },
  { name: 'Lakshmi Iyer', role: 'Exporter', country: 'Tamil Nadu', rating: 5, text: 'Buy leads from brands looking for private-label products are gold for an exporter. Worth every rupee of the Growth plan.' },
];

export const partnerRecords = [1, 2, 3, 4, 5, 6].map((i) => ({ name: `Partner ${i}`, logo: `${IMG}/logo${i}.png`, order: i, active: true }));
export const serviceRecords = [];

const post = (slug, title, excerpt, content, category, tags, daysAgo) => ({ slug, title, excerpt, content, cover: `${IMG}/blog-post-0${(daysAgo % 3) + 1}.webp`, category, tags, author: 'SHRIJAIV Team', status: 'published', metaTitle: null, metaDescription: excerpt, publishedAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString() });

export const posts = [
  post('organic-certification-india-npop-pgs-guide', 'Organic certification in India: NPOP, PGS-India and what buyers should check', 'NPOP, PGS-India, USDA Organic, EU Organic — what each certificate covers, who issues it, and how to verify a seller\'s claim in two minutes.', `
<p>"Organic" on a label means nothing without a certificate behind it. In India two systems dominate, and every serious buyer should know the difference.</p>
<h2>NPOP (National Programme for Organic Production)</h2><p>Run by APEDA under the Ministry of Commerce. Third-party certification bodies inspect farms and processors annually. NPOP is mandatory for exports and is recognised by the EU and Switzerland. Look for the <strong>India Organic</strong> logo and a certificate number you can check on the APEDA TraceNet portal.</p>
<h2>PGS-India (Participatory Guarantee System)</h2><p>Run by the Ministry of Agriculture for small farmers and groups. Peer inspection instead of third-party audits, so it is cheaper — ideal for FPOs selling domestically. Look for the <strong>PGS-India Green</strong> (in conversion) or <strong>PGS-India Organic</strong> logo.</p>
<h2>Jaivik Bharat</h2><p>FSSAI's unified logo for organic food sold in India. A product must be NPOP or PGS-India certified to carry it.</p>
<h2>How to verify in two minutes</h2><ol><li>Ask the seller for the certificate PDF and the certificate number.</li><li>Check the number on the APEDA TraceNet (NPOP) or PGS-India portal.</li><li>Confirm the certificate scope covers the product you are buying (a farm certified for wheat is not certified for turmeric).</li><li>Check the validity date — certificates expire yearly.</li></ol>
<p>On SHRIJAIV, sellers with the <strong>Verified</strong> badge have had these documents checked by our team. You can still ask for them — a good seller will share them gladly.</p>`, 'Guides', 'certification, NPOP, PGS-India, FSSAI', 3),
  post('how-to-write-product-listing-that-gets-inquiries', 'How to write an organic product listing that gets inquiries', 'Photos, price ranges, MOQ and specifications — the five things buyers look at before they click "Send inquiry".', `
<p>Buyers on a B2B marketplace scan dozens of listings in minutes. Here is what makes them stop at yours.</p>
<h2>1. Photos that show the real product</h2><p>Natural light, the product in its actual packaging, and one photo of the farm or facility. Avoid stock images — buyers notice.</p>
<h2>2. A price range, not "contact for price"</h2><p>Listings with a price range receive about three times more inquiries. Give a range (₹180–₹220 per kg) and explain what moves it: quantity, packaging, season.</p>
<h2>3. MOQ and lead time</h2><p>State the minimum order and how fast you can ship. "MOQ 100 kg, dispatch within 5 days" answers the two questions every buyer has.</p>
<h2>4. Specifications</h2><p>Moisture, grade, size, shelf life, packaging options. Use the specification table — buyers compare on these.</p>
<h2>5. Certifications in the first line</h2><p>NPOP / PGS-India / FSSAI numbers in the summary. Upload them to your showroom for the Verified badge.</p>
<p>Short on time? In your seller dashboard, click <strong>Write with AI</strong>: it drafts a description from your product name and specs, in English and any Indian language.</p>`, 'Selling tips', 'listing, photos, MOQ, inquiries', 7),
  post('organic-products-demand-india-2026', 'What organic buyers in India are sourcing right now', 'Millets, A2 ghee, cold-pressed oils, jaggery and herbal skincare top the requirement boards. A look at demand across categories and states.', `
<p>Requirements posted on SHRIJAIV give a live picture of what Indian businesses want. Here are the categories with the most buy leads this season.</p>
<h2>Millets and ancient grains</h2><p>Restaurant chains and packaged-food brands are looking for ragi, jowar, bajra and foxtail millet in 500 kg–5 ton lots, mostly from Karnataka, Maharashtra and Rajasthan.</p>
<h2>A2 ghee and dairy</h2><p>Retailers in metros ask for Gir and Sahiwal A2 ghee in 500 ml and 1 litre jars, with lab reports. Private-label packaging is a frequent request.</p>
<h2>Cold-pressed oils</h2><p>Groundnut, coconut and sesame oils, wood-pressed, in bulk tins for repacking.</p>
<h2>Jaggery and natural sweeteners</h2><p>Jaggery powder, cubes and liquid jaggery for the beverage and sweets industry; forest honey with NMR test reports.</p>
<h2>Herbal skincare</h2><p>Contract manufacturers for face wash, hair oils and soaps for new D2C brands — MOQ 1,000–5,000 units.</p>
<p>Sellers: browse the <a href="/requirements">buy leads</a> and quote today. Buyers: <a href="/post-requirement">post your requirement</a> and let sellers come to you.</p>`, 'Market insights', 'demand, millets, ghee, jaggery, skincare', 12),
];
