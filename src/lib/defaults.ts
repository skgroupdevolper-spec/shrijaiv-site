// Default settings. Everything here is editable from Admin → Settings / Header / Footer.

export type NavLink = { label: string; href: string; description?: string; icon?: string; children?: NavLink[] };

export type SiteSettings = {
  name: string;
  tagline: string;
  logo: string;
  logoLight: string;
  favicon: string;
  phone: string;
  phoneDisplay: string;
  whatsapp: string;
  whatsappMessage: string;
  emailGeneral: string;
  emailVisa: string;
  address: string;
  poBox: string;
  mapUrl: string;
  mapEmbed: string;
  hours: string;
  hoursClosed: string;
  social: { facebook: string; instagram: string; youtube: string; twitter: string; linkedin: string; tiktok: string };
  colors: { gold: string; goldLight: string; ink: string; sand: string };
  showWhatsappButton: boolean;
  showMobileBar: boolean;
  showPreloader: boolean;
  headScripts: string;
  bodyScripts: string;
  seo: { titleTemplate: string; defaultTitle: string; description: string; keywords: string; ogImage: string; googleVerification?: string; bingVerification?: string; gaId?: string; gtmId?: string; metaPixelId?: string; clarityId?: string; indexNowKey?: string };
};

export type MegaMenu = {
  enabled: boolean;
  attachTo: string; // the menu item (by its link) that opens the big panel, e.g. /services
  eyebrow: string;
  title: string;
  text: string;
  bullets: string; // one per line
  groups: { title: string; links: NavLink[] }[];
  calculatorLabel: string;
  calculatorHref: string;
  allLabel: string;
  allHref: string;
};

export type HeaderSettings = {
  topbar: { enabled: boolean; text: string; linkLabel: string; linkHref: string };
  menu: NavLink[];
  cta: { label: string; href: string };
  showLogin: boolean;
  mega: MegaMenu;
};

export type FooterSettings = {
  about: string;
  columns: { title: string; links: NavLink[] }[];
  ctaTitle: string;
  ctaHighlight: string;
  ctaButton: { label: string; href: string };
  newsletter: { enabled: boolean; title: string; text: string };
  copyright: string;
  disclaimer: string;
  bottomLinks: NavLink[];
};

export type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  notifyEmail: string; // one or more addresses (comma or new line separated)
  notifyOn: { leads: boolean; applications: boolean; messages: boolean; accounts: boolean; subscribers: boolean };
};

export const defaultSite: SiteSettings = {
  name: 'SHRIJAIV Organic',
  tagline: 'Organic Living, Simplified',
  logo: '',
  logoLight: '',
  favicon: '',
  phone: '+919314051605',
  phoneDisplay: "+91 93140 51605",
  whatsapp: '919314051605',
  whatsappMessage: "Hello SHRIJAIV! I am interested in organic products on your marketplace. Please assist me.",
  emailGeneral: "founder.infotech@gmail.com",
  emailVisa: "support@shrijaiv.com",
  address: '276, Frontier Colony, Adarsh Nagar, Jaipur, Rajasthan',
  poBox: '',
  mapUrl: "",
  mapEmbed: '',
  hours: "Mon \u2013 Sat, 10:00 \u2013 19:00 IST",
  hoursClosed: 'Sunday closed',
  social: {
    facebook: '',
    instagram: '',
    youtube: '',
    twitter: '',
    linkedin: '',
    tiktok: '',
  },
  colors: { gold: '#009A35', goldLight: '#8FDBA6', ink: '#0B1A10', sand: '#F3FAF4' },
  showWhatsappButton: true,
  showMobileBar: true,
  showPreloader: true,
  headScripts: '',
  bodyScripts: '',
  seo: {
    titleTemplate: '%s | SHRIJAIV Organic',
    defaultTitle: 'SHRIJAIV Organic | India\'s Organic B2B Marketplace for Buyers & Sellers',
    description:
      'Connect with verified organic sellers and buyers across India: organic agriculture, organic beauty and organic processed food. Post requirements, get quotes and grow your organic business.',
    keywords: 'organic marketplace India, organic B2B, organic suppliers, organic buyers, organic agriculture products, organic beauty products, organic processed food, bulk organic products',
    ogImage: '/images/hero-skyline.jpg',
    googleVerification: '',
    bingVerification: '',
    gaId: '',
    gtmId: '',
    metaPixelId: '',
    clarityId: '',
  },
};

export const defaultHeader: HeaderSettings = {
  topbar: {
    enabled: true,
    text: 'Customer Support · About Us — Launch offer: every seller gets all features free',
    linkLabel: 'Sign up',
    linkHref: '/register',
  },
  menu: [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/products' },
    { label: 'Become a Seller', href: '/become-a-seller' },
    { label: 'Become a Buyer', href: '/become-a-buyer' },
    { label: 'Buy leads', href: '/requirements' },
    { label: 'Contact', href: '/contact' },
    { label: 'Blog', href: '/blog' },
  ],
  cta: { label: 'Post requirement', href: '/post-requirement' },
  showLogin: true,
  mega: {
    enabled: true,
    attachTo: '/products',
    eyebrow: 'Categories',
    title: 'Three organic worlds',
    text: 'Certified organic produce, natural beauty and healthy packaged food — from verified Indian sellers.',
    bullets: 'Verified GST, FSSAI & organic certificates\nDirect contact, no commission\n13 Indian languages',
    groups: [
      {
        title: 'Organic Agriculture',
        links: [
          { label: 'Fruit', href: '/category/fruit' },
          { label: 'Vegetables', href: '/category/vegetables' },
          { label: 'Dairy Products', href: '/category/dairy-products' },
          { label: 'Oil Seeds', href: '/category/oil-seeds' },
          { label: 'Pulses', href: '/category/pulses' },
          { label: 'Grains & Cereals', href: '/category/grains-cereals' },
          { label: 'Spices & Herbs', href: '/category/spices-herbs' },
          { label: 'All agriculture', href: '/category/organic-agriculture' },
        ],
      },
      {
        title: 'Organic Beauty',
        links: [
          { label: 'Cream & Moisturisers', href: '/category/cream-moisturisers' },
          { label: 'Face Wash & Cleansers', href: '/category/face-wash-cleansers' },
          { label: 'Hair Care', href: '/category/hair-care' },
          { label: 'Soaps & Body Care', href: '/category/soaps-body-care' },
          { label: 'Essential Oils', href: '/category/essential-oils' },
          { label: 'All beauty', href: '/category/organic-beauty' },
        ],
      },
      {
        title: 'Organic Processed Food',
        links: [
          { label: 'Flours & Atta', href: '/category/flours-atta' },
          { label: 'Snacks', href: '/category/snacks' },
          { label: 'Sweeteners (Jaggery, Honey)', href: '/category/sweeteners' },
          { label: 'Beverages & Tea', href: '/category/beverages-tea' },
          { label: 'Edible Oils & Ghee', href: '/category/edible-oils-ghee' },
          { label: 'All processed food', href: '/category/organic-processed-food' },
        ],
      },
    ],
    calculatorLabel: 'Post a requirement',
    calculatorHref: '/post-requirement',
    allLabel: 'Browse all products',
    allHref: '/products',
  },
};

export const defaultFooter: FooterSettings = {
  about: "India's organic B2B marketplace. Verified sellers of organic agriculture, beauty and processed food meet buyers directly — no commission, 13 Indian languages. Established 2024.",
  columns: [
    {
      title: 'Marketplace',
      links: [
        { label: 'All products', href: '/products' },
        { label: 'Organic Agriculture', href: '/category/organic-agriculture' },
        { label: 'Organic Beauty', href: '/category/organic-beauty' },
        { label: 'Organic Processed Food', href: '/category/organic-processed-food' },
        { label: 'Verified sellers', href: '/sellers?verified=1' },
        { label: 'Buy leads', href: '/requirements' },
        { label: 'Post a requirement', href: '/post-requirement' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About us', href: '/about' },
        { label: 'How it works', href: '/how-it-works' },
        { label: 'Become a seller', href: '/become-a-seller' },
        { label: 'Become a buyer', href: '/become-a-buyer' },
        { label: 'Membership plans', href: '/pricing' },
        { label: 'Blog', href: '/blog' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Customer support', href: '/customer-support' },
        { label: 'Contact', href: '/contact' },
        { label: 'Sign in', href: '/login' },
      ],
    },
  ],
  ctaTitle: 'Grow your organic business',
  ctaHighlight: 'with all of India',
  ctaButton: { label: 'Start selling — free', href: '/register?as=seller' },
  newsletter: { enabled: true, title: 'Organic market updates', text: 'New buy leads, price trends and seller tips — twice a month, nothing else.' },
  copyright: '© {year} SHRIJAIV Organic. All rights reserved.',
  disclaimer: 'SHRIJAIV Organic is an online marketplace that connects buyers and sellers. We do not sell products and are not a party to any transaction. Product information and organic claims are provided by sellers; the Verified badge confirms documents checked at the time of verification.',
  bottomLinks: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Refund Policy', href: '/refund-policy' },
    { label: 'Disclaimer', href: '/disclaimer' },
  ],
};

export const defaultSmtp: SmtpSettings = {
  host: '',
  port: 587,
  secure: false,
  user: '',
  pass: '',
  from: '',
  notifyEmail: '',
  notifyOn: { leads: true, applications: true, messages: true, accounts: true, subscribers: true },
};

export const SERVICE_OPTIONS = [
  'Selling on SHRIJAIV',
  'Buying / sourcing help',
  'Seller verification',
  'Membership & payments',
  'Partnership',
  'Report a problem',
  'Other',
];

export const APPLICATION_STATUSES: { value: string; label: string; progress: number; color: string }[] = [
  { value: 'submitted', label: 'Submitted', progress: 10, color: 'slate' },
  { value: 'under_review', label: 'Under Review', progress: 25, color: 'blue' },
  { value: 'documents_required', label: 'Documents Required', progress: 30, color: 'amber' },
  { value: 'processing', label: 'Processing', progress: 50, color: 'indigo' },
  { value: 'initial_approval', label: 'Initial Approval', progress: 65, color: 'violet' },
  { value: 'approved', label: 'Approved', progress: 95, color: 'emerald' },
  { value: 'completed', label: 'Completed', progress: 100, color: 'green' },
  { value: 'rejected', label: 'Rejected', progress: 100, color: 'red' },
  { value: 'cancelled', label: 'Cancelled', progress: 0, color: 'zinc' },
];

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'closed'];

export type TranslationSettings = {
  provider: 'gemini' | 'google' | 'claude' | 'deepl' | 'off';
  apiKey: string; // Claude or DeepL key
  model: string; // Claude model
  geminiKey: string; // Google Gemini key (aistudio.google.com/apikey)
  geminiModel: string;
  autoTranslate: boolean;
  enabled: string[]; // language codes shown on the website
  showSwitcher: boolean;
};

export const defaultTranslation: TranslationSettings = {
  // Free Google engine works out of the box (no key) for the 8 languages without a built-in
  // pack; add a Gemini/Claude/DeepL key in Admin → Languages for higher quality.
  provider: (process.env.TRANSLATION_PROVIDER as TranslationSettings['provider']) || (process.env.GEMINI_API_KEY ? 'gemini' : 'google'),
  apiKey: '',
  model: 'claude-sonnet-5-5',
  geminiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  autoTranslate: true,
  enabled: ['en', 'hi', 'ur', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'as'],
  showSwitcher: true,
};
