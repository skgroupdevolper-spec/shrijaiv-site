// Marketplace starting data: category tree (from the original SHRIJAIV site), default plans and settings.
// Idempotent: only creates what is missing, never overwrites what the admin changed.

export const CATEGORIES = [
  {
    name: 'Organic Agriculture', slug: 'organic-agriculture', icon: 'wheat', featured: true,
    children: [
      { name: 'Fruit', slug: 'fruit', icon: 'apple' },
      { name: 'Vegetables', slug: 'vegetables', icon: 'carrot' },
      { name: 'Dairy Products', slug: 'dairy-products', icon: 'milk' },
      { name: 'Oil Seeds', slug: 'oil-seeds', icon: 'droplets' },
      { name: 'Pulses', slug: 'pulses', icon: 'bean' },
      { name: 'Grains & Cereals', slug: 'grains-cereals', icon: 'wheat' },
      { name: 'Spices & Herbs', slug: 'spices-herbs', icon: 'leaf' },
      { name: 'Dry Fruits & Nuts', slug: 'dry-fruits-nuts', icon: 'nut' },
      { name: 'Seeds & Saplings', slug: 'seeds-saplings', icon: 'sprout' },
      { name: 'Fertilizers & Bio-inputs', slug: 'fertilizers-bio-inputs', icon: 'flask-conical' },
    ],
  },
  {
    name: 'Organic Beauty', slug: 'organic-beauty', icon: 'sparkles', featured: true,
    children: [
      { name: 'Cream & Moisturisers', slug: 'cream-moisturisers', icon: 'droplet' },
      { name: 'Face Wash & Cleansers', slug: 'face-wash-cleansers', icon: 'smile' },
      { name: 'Hair Care', slug: 'hair-care', icon: 'scissors' },
      { name: 'Soaps & Body Care', slug: 'soaps-body-care', icon: 'bath' },
      { name: 'Essential Oils', slug: 'essential-oils', icon: 'flower' },
      { name: 'Herbal Cosmetics', slug: 'herbal-cosmetics', icon: 'brush' },
    ],
  },
  {
    name: 'Organic Processed Food', slug: 'organic-processed-food', icon: 'cookie', featured: true,
    children: [
      { name: 'Flours & Atta', slug: 'flours-atta', icon: 'package' },
      { name: 'Snacks', slug: 'snacks', icon: 'cookie' },
      { name: 'Sweeteners (Jaggery, Honey)', slug: 'sweeteners', icon: 'candy' },
      { name: 'Beverages & Tea', slug: 'beverages-tea', icon: 'coffee' },
      { name: 'Pickles, Jams & Sauces', slug: 'pickles-jams-sauces', icon: 'jar' },
      { name: 'Ready to Cook', slug: 'ready-to-cook', icon: 'chef-hat' },
      { name: 'Edible Oils & Ghee', slug: 'edible-oils-ghee', icon: 'droplets' },
    ],
  },
];

export const PLANS = [
  { slug: 'free', name: 'Free', price: 0, period: 'lifetime', maxProducts: 5, maxInquiries: 10, maxQuotes: 5, maxImages: 3, featuredSlots: 0, verifiedBadge: false, priorityRank: 0, analytics: false, aiTools: false, features: ['5 products', '10 buyer contacts / month', '5 quotes / month', 'Basic showroom'], order: 0 },
  { slug: 'starter', name: 'Starter', price: 999, period: 'monthly', maxProducts: 25, maxInquiries: 50, maxQuotes: 30, maxImages: 6, featuredSlots: 1, verifiedBadge: true, priorityRank: 1, analytics: true, aiTools: true, features: ['25 products', '50 buyer contacts / month', '30 quotes / month', 'Verified badge', '1 featured product', 'Analytics & AI tools'], order: 1 },
  { slug: 'growth', name: 'Growth', price: 2499, period: 'monthly', maxProducts: 100, maxInquiries: -1, maxQuotes: -1, maxImages: 10, featuredSlots: 5, verifiedBadge: true, priorityRank: 2, analytics: true, aiTools: true, features: ['100 products', 'Unlimited buyer contacts', 'Unlimited quotes', 'Verified badge', '5 featured products', 'Priority in search', 'Analytics & AI tools'], highlight: true, order: 2 },
  { slug: 'enterprise', name: 'Enterprise', price: 19999, period: 'yearly', maxProducts: -1, maxInquiries: -1, maxQuotes: -1, maxImages: 15, featuredSlots: 20, verifiedBadge: true, priorityRank: 3, analytics: true, aiTools: true, features: ['Unlimited products', 'Unlimited buyer contacts & quotes', 'Verified badge', '20 featured products', 'Top priority in search', 'Dedicated support'], order: 3 },
];

export async function seedMarketplace(prisma) {
  let created = 0;
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    const parent = await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: { slug: c.slug, name: c.name, icon: c.icon, featured: !!c.featured, order: i } });
    if (parent.createdAt.getTime() > Date.now() - 5000) created++;
    for (let j = 0; j < c.children.length; j++) {
      const ch = c.children[j];
      const row = await prisma.category.upsert({ where: { slug: ch.slug }, update: {}, create: { slug: ch.slug, name: ch.name, icon: ch.icon, parentId: parent.id, order: j } });
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
