// Marketplace starting data: category tree (from the original SHRIJAIV site), default plans and settings.
// Idempotent: only creates what is missing, never overwrites what the admin changed.

export const CATEGORIES = [
  {
    name: 'Organic Agriculture', slug: 'organic-agriculture', icon: 'wheat', featured: true, image: '/images/site/category2.png',
    children: [
      { name: 'Fruit', slug: 'fruit', featured: true, icon: 'apple', image: '/images/site/category5.png' },
      { name: 'Vegetables', slug: 'vegetables', featured: true, icon: 'carrot', image: '/images/site/category9.png' },
      { name: 'Dairy Products', slug: 'dairy-products', featured: true, icon: 'milk', image: '/images/site/category6.png' },
      { name: 'Oil Seeds', slug: 'oil-seeds', icon: 'droplets', image: '/images/site/category7.png' },
      { name: 'Pulses', slug: 'pulses', icon: 'bean', image: '/images/site/category8.png' },
      { name: 'Grains & Cereals', slug: 'grains-cereals', icon: 'wheat' },
      { name: 'Spices & Herbs', slug: 'spices-herbs', featured: true, icon: 'leaf' },
      { name: 'Dry Fruits & Nuts', slug: 'dry-fruits-nuts', icon: 'nut' },
      { name: 'Seeds & Saplings', slug: 'seeds-saplings', icon: 'sprout' },
      { name: 'Fertilizers & Bio-inputs', slug: 'fertilizers-bio-inputs', icon: 'flask-conical' },
    ],
  },
  {
    name: 'Organic Beauty', slug: 'organic-beauty', icon: 'sparkles', featured: true, image: '/images/site/category3.png',
    children: [
      { name: 'Cream & Moisturisers', slug: 'cream-moisturisers', featured: true, icon: 'droplet', image: '/images/site/category10.png' },
      { name: 'Face Wash & Cleansers', slug: 'face-wash-cleansers', featured: true, icon: 'smile', image: '/images/site/category11.png' },
      { name: 'Hair Care', slug: 'hair-care', icon: 'scissors' },
      { name: 'Soaps & Body Care', slug: 'soaps-body-care', icon: 'bath' },
      { name: 'Essential Oils', slug: 'essential-oils', icon: 'flower' },
      { name: 'Herbal Cosmetics', slug: 'herbal-cosmetics', icon: 'brush' },
    ],
  },
  {
    name: 'Organic Processed Food', slug: 'organic-processed-food', icon: 'cookie', featured: true, image: '/images/site/category4.png',
    children: [
      { name: 'Flours & Atta', slug: 'flours-atta', featured: true, icon: 'package' },
      { name: 'Snacks', slug: 'snacks', icon: 'cookie' },
      { name: 'Sweeteners (Jaggery, Honey)', slug: 'sweeteners', featured: true, icon: 'candy' },
      { name: 'Beverages & Tea', slug: 'beverages-tea', icon: 'coffee' },
      { name: 'Pickles, Jams & Sauces', slug: 'pickles-jams-sauces', icon: 'jar' },
      { name: 'Ready to Cook', slug: 'ready-to-cook', icon: 'chef-hat' },
      { name: 'Edible Oils & Ghee', slug: 'edible-oils-ghee', icon: 'droplets' },
    ],
  },
];

export const PLANS = [
  { slug: 'free', name: 'Free Plan', price: 0, period: 'lifetime', maxProducts: 5, maxInquiries: 10, maxQuotes: 5, maxImages: 3, featuredSlots: 0, verifiedBadge: false, priorityRank: 0, analytics: false, aiTools: false, features: ['5 products', '10 buyer contacts / month', '5 quotes / month', 'Basic showroom'], order: 0 },
  { slug: 'silver', name: 'Silver Plan', price: 1999, period: 'quarterly', maxProducts: 25, maxInquiries: 50, maxQuotes: 30, maxImages: 6, featuredSlots: 1, verifiedBadge: true, priorityRank: 1, analytics: true, aiTools: true, features: ['Inquiry max 50 a month', 'One page Business profile', '25 products', 'Verified badge', 'Analytics & AI tools'], order: 1 },
  { slug: 'gold', name: 'Gold Plan', price: 3499, period: 'custom', periodDays: 180, maxProducts: 100, maxInquiries: 100, maxQuotes: -1, maxImages: 10, featuredSlots: 5, verifiedBadge: true, priorityRank: 2, analytics: true, aiTools: true, features: ['Inquiry max 100 a month', 'Limited description supplier contact', '100 products', 'Unlimited quotes', '5 featured products', 'Priority in search'], highlight: true, order: 2 },
  { slug: 'platinum', name: 'Platinum Plan', price: 5999, period: 'yearly', maxProducts: -1, maxInquiries: -1, maxQuotes: -1, maxImages: 15, featuredSlots: 20, verifiedBadge: true, priorityRank: 3, analytics: true, aiTools: true, features: ['Unlimited inquiry', 'Unlimited catalog product & highest search ranking', 'Verified badge', '20 featured products', 'Dedicated support'], order: 3 },
];

export async function seedMarketplace(prisma) {
  let created = 0;
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    const parent = await prisma.category.upsert({ where: { slug: c.slug }, update: { image: c.image || undefined }, create: { slug: c.slug, name: c.name, icon: c.icon, image: c.image || null, featured: !!c.featured, order: i } });
    if (parent.createdAt.getTime() > Date.now() - 5000) created++;
    for (let j = 0; j < c.children.length; j++) {
      const ch = c.children[j];
      const row = await prisma.category.upsert({ where: { slug: ch.slug }, update: { image: ch.image || undefined, ...(ch.featured ? { featured: true } : {}) }, create: { slug: ch.slug, name: ch.name, icon: ch.icon, image: ch.image || null, featured: !!ch.featured, parentId: parent.id, order: j } });
      if (row.createdAt.getTime() > Date.now() - 5000) created++;
    }
  }
  if (created) console.log(`✔ ${created} marketplace categories`);
  if ((await prisma.plan.count()) === 0) {
    for (const p of PLANS) await prisma.plan.create({ data: { ...p, features: JSON.stringify(p.features) } });
    console.log(`✔ ${PLANS.length} membership plans (Paid plans are OFF by default: everything is free and unlimited until you switch them on in Admin → Marketplace)`);
  }
  await prisma.setting.upsert({ where: { key: 'marketplace' }, update: {}, create: { key: 'marketplace', value: JSON.stringify({ paidPlans: false }) } });
}
