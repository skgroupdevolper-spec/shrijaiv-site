// Demo marketplace data so the site is not empty on first start: 4 verified sellers, 16 products,
// 1 buyer with 6 open buy leads and a few approved reviews. Uses the images of the original site.
// Runs only when there are no products yet (never touches a live marketplace).
// Demo accounts (password: Demo@12345): seller1@demo.shrijaiv.com … seller4@…, buyer@demo.shrijaiv.com
import bcrypt from 'bcryptjs';

const IMG = '/images/site';
export const DEMO_PASSWORD = 'Demo@12345';

const SELLERS = [
  { slug: 'green-valley-organics', companyName: 'Green Valley Organics', businessType: 'farmer', city: 'Jaipur', state: 'Rajasthan', year: 2016, employees: '11-50', gst: '08AAACG1234F1Z5', fssai: '12219012000345', logo: `${IMG}/logo1.png`, banner: `${IMG}/banner-1.png`, about: 'Family-run organic farm in the Aravalli foothills growing wheat, bajra, mustard and seasonal vegetables. NPOP certified since 2017; we supply retailers, restaurants and exporters across North India.', certs: ['NPOP (India Organic)', 'FSSAI', 'PGS-India'], rating: 4.8, ratingCount: 36 },
  { slug: 'kerala-natural-care', companyName: 'Kerala Natural Care', businessType: 'manufacturer', city: 'Kochi', state: 'Kerala', year: 2019, employees: '51-200', gst: '32AABCK5678G1Z2', fssai: '', logo: `${IMG}/logo2.png`, banner: `${IMG}/banner-2.png`, about: 'Ayurveda-inspired organic skin and hair care — cold-pressed coconut oil, herbal face packs, soaps and shampoos. ECOCERT COSMOS certified, private label available.', certs: ['ECOCERT COSMOS', 'GMP', 'Cruelty Free'], rating: 4.7, ratingCount: 52 },
  { slug: 'himalayan-harvest-foods', companyName: 'Himalayan Harvest Foods', businessType: 'brand', city: 'Dehradun', state: 'Uttarakhand', year: 2014, employees: '51-200', gst: '05AADCH9012H1Z8', fssai: '10019031000112', logo: `${IMG}/logo3.png`, banner: `${IMG}/banner-3.png`, about: 'Organic processed foods from the hills: millet flours, cold-pressed oils, jams, honey and ready-to-cook mixes. USDA & EU organic certified, exporting to 12 countries.', certs: ['USDA Organic', 'EU Organic', 'FSSAI', 'ISO 22000'], rating: 4.9, ratingCount: 71 },
  { slug: 'deccan-spice-traders', companyName: 'Deccan Spice Traders', businessType: 'wholesaler', city: 'Hyderabad', state: 'Telangana', year: 2011, employees: '11-50', gst: '36AAFCD3456J1Z1', fssai: '13620011000987', logo: `${IMG}/logo4.png`, banner: `${IMG}/banner-4.png`, about: 'Bulk organic spices, pulses and dry fruits sourced directly from certified farmer groups in Telangana, Andhra and Karnataka. Minimum order 100 kg, pan-India delivery.', certs: ['NPOP (India Organic)', 'FSSAI', 'APEDA'], rating: 4.6, ratingCount: 24 },
];

const P = (seller, cat, slug, name, image, priceMin, priceMax, priceUnit, moq, summary, extra = {}) => ({ seller, cat, slug, name, image, priceMin, priceMax, priceUnit, moq, summary, ...extra });

const PRODUCTS = [
  P(0, 'vegetables', 'organic-fresh-vegetables-basket', 'Organic Fresh Vegetables Basket', `${IMG}/product-1.png`, 45, 70, 'per kg', '50 kg', 'Seasonal mixed vegetables harvested the same morning — tomato, spinach, bottle gourd, okra and more. Chemical-free, PGS-India certified.', { featured: true, origin: 'Rajasthan', leadTime: '1-2 days', shelfLife: '5-7 days (refrigerated)', packaging: 'Crates of 10 kg', stock: 'in stock', rating: 4.8, ratingCount: 14, specs: [['Variety', 'Seasonal mix (6-8 items)'], ['Grading', 'A grade, hand sorted'], ['Harvest', 'Same day']] }),
  P(0, 'grains-cereals', 'organic-whole-wheat-sharbati', 'Organic Sharbati Wheat', `${IMG}/product1.png`, 38, 46, 'per kg', '500 kg', 'Premium Sharbati wheat from organic fields near Jaipur. Low gluten, naturally sweet, ideal for chakki atta.', { origin: 'Rajasthan', moq: '500 kg', leadTime: '3-5 days', shelfLife: '12 months', packaging: '50 kg PP bags', stock: 'in stock', rating: 4.9, ratingCount: 9, specs: [['Moisture', '< 11%'], ['Protein', '11-12%'], ['Certification', 'NPOP']] }),
  P(0, 'oil-seeds', 'organic-black-mustard-seeds', 'Organic Black Mustard Seeds', `${IMG}/product2.png`, 85, 110, 'per kg', '200 kg', 'Bold black mustard seeds, sun-dried and machine cleaned. Suitable for cold-pressing and spice blends.', { origin: 'Rajasthan', leadTime: '3-5 days', shelfLife: '18 months', packaging: '25 / 50 kg bags', stock: 'in stock' }),
  P(0, 'dairy-products', 'organic-a2-desi-ghee', 'Organic A2 Desi Cow Ghee', `${IMG}/product-4.png`, 1800, 2200, 'per litre', '20 litre', 'Bilona-method ghee from grass-fed Gir cows. Rich aroma, golden colour, no additives.', { featured: true, origin: 'Rajasthan', leadTime: '5-7 days', shelfLife: '9 months', packaging: '500 ml / 1 l glass jars', stock: 'made to order', rating: 5, ratingCount: 21 }),
  P(1, 'cream-moisturisers', 'organic-aloe-saffron-moisturiser', 'Organic Aloe & Saffron Moisturiser', `${IMG}/product3.png`, 180, 240, 'per piece', '100 pieces', 'Light, non-greasy daily moisturiser with organic aloe vera, Kashmiri saffron and kokum butter. Private label ready.', { featured: true, origin: 'Kerala', leadTime: '7-10 days', shelfLife: '24 months', packaging: '50 g / 100 g jars', stock: 'in stock', rating: 4.7, ratingCount: 18, specs: [['Skin type', 'All'], ['Preservative', 'Natural (ECOCERT approved)'], ['Private label', 'MOQ 500 pcs']] }),
  P(1, 'face-wash-cleansers', 'organic-neem-tulsi-face-wash', 'Organic Neem & Tulsi Face Wash', `${IMG}/product4.png`, 120, 160, 'per piece', '200 pieces', 'Gentle foaming cleanser with neem, tulsi and tea tree for oily and acne-prone skin. Sulphate and paraben free.', { origin: 'Kerala', leadTime: '7-10 days', shelfLife: '24 months', packaging: '100 ml tube', stock: 'in stock', rating: 4.6, ratingCount: 11 }),
  P(1, 'hair-care', 'cold-pressed-virgin-coconut-oil', 'Cold-Pressed Virgin Coconut Oil', `${IMG}/product5.png`, 320, 420, 'per litre', '50 litre', 'Single-origin virgin coconut oil, cold-pressed within 24 hours of harvest. Food and cosmetic grade.', { origin: 'Kerala', leadTime: '3-5 days', shelfLife: '18 months', packaging: '1 l / 5 l / 20 l', stock: 'in stock', rating: 4.9, ratingCount: 27 }),
  P(1, 'soaps-body-care', 'handmade-organic-turmeric-soap', 'Handmade Organic Turmeric Soap', `${IMG}/product6.png`, 55, 75, 'per piece', '500 pieces', 'Cold-process soap with organic turmeric, coconut oil and shea butter. Hand cut, cured for 6 weeks.', { origin: 'Kerala', leadTime: '10-14 days', shelfLife: '24 months', packaging: '100 g, paper wrapped', stock: 'in stock' }),
  P(2, 'flours-atta', 'organic-ragi-finger-millet-flour', 'Organic Ragi (Finger Millet) Flour', `${IMG}/product-2.png`, 70, 95, 'per kg', '100 kg', 'Stone-ground ragi flour from Uttarakhand hill farms. High in calcium and fibre, gluten free.', { featured: true, origin: 'Uttarakhand', leadTime: '3-5 days', shelfLife: '8 months', packaging: '1 kg / 5 kg / 25 kg', stock: 'in stock', rating: 4.8, ratingCount: 16, specs: [['Grind', 'Stone (chakki)'], ['Gluten', 'Free'], ['Certification', 'USDA / EU / NPOP']] }),
  P(2, 'sweeteners', 'organic-himalayan-multiflora-honey', 'Organic Himalayan Multiflora Honey', `${IMG}/product-3.png`, 450, 600, 'per kg', '50 kg', 'Raw, unheated honey from Apis cerana hives in the Garhwal Himalaya. NMR tested, no added sugar.', { origin: 'Uttarakhand', leadTime: '5-7 days', shelfLife: '36 months', packaging: '250 g – 25 kg', stock: 'limited', rating: 5, ratingCount: 33 }),
  P(2, 'pickles-jams-sauces', 'organic-plum-jam-no-added-sugar', 'Organic Plum Jam (No Added Sugar)', `${IMG}/product7.png`, 140, 180, 'per piece', '120 pieces', 'Slow-cooked hill plums sweetened only with apple concentrate. 70% fruit.', { origin: 'Uttarakhand', leadTime: '7-10 days', shelfLife: '12 months', packaging: '250 g glass jar', stock: 'in stock', rating: 4.7, ratingCount: 8 }),
  P(2, 'ready-to-cook', 'organic-millet-khichdi-mix', 'Organic Millet Khichdi Mix', `${IMG}/product8.png`, 95, 130, 'per piece', '200 pieces', 'Ready-to-cook mix of foxtail millet, moong dal and hill spices. Cooks in 15 minutes.', { origin: 'Uttarakhand', leadTime: '7-10 days', shelfLife: '9 months', packaging: '300 g pouch', stock: 'in stock' }),
  P(2, 'beverages-tea', 'organic-green-tea-tulsi', 'Organic Green Tea with Tulsi', `${IMG}/product-5.png`, 380, 520, 'per kg', '25 kg', 'Whole-leaf green tea from Kausani gardens blended with organic tulsi. Loose leaf and tea bags.', { featured: true, origin: 'Uttarakhand', leadTime: '5-7 days', shelfLife: '24 months', packaging: 'Bulk 5 kg / retail 100 g', stock: 'in stock', rating: 4.8, ratingCount: 12 }),
  P(3, 'spices-herbs', 'organic-turmeric-powder-high-curcumin', 'Organic Turmeric Powder (5% Curcumin)', `${IMG}/product9.png`, 160, 210, 'per kg', '100 kg', 'Lakadong-type turmeric with curcumin above 5%. Steam sterilised, lab tested for heavy metals.', { featured: true, origin: 'Telangana', leadTime: '3-5 days', shelfLife: '24 months', packaging: '25 kg bags', stock: 'in stock', rating: 4.7, ratingCount: 19, specs: [['Curcumin', '≥ 5%'], ['Mesh', '60-80'], ['Sterilisation', 'Steam']] }),
  P(3, 'pulses', 'organic-toor-dal-arhar', 'Organic Toor Dal (Arhar)', `${IMG}/product10.png`, 120, 145, 'per kg', '500 kg', 'Unpolished organic toor dal from certified farmer groups. Uniform size, quick cooking.', { origin: 'Telangana', leadTime: '3-5 days', shelfLife: '12 months', packaging: '30 / 50 kg bags', stock: 'in stock', rating: 4.5, ratingCount: 7 }),
  P(3, 'dry-fruits-nuts', 'organic-cashew-w320', 'Organic Cashew W320', `${IMG}/single-product.png`, 780, 900, 'per kg', '100 kg', 'Whole organic cashew kernels, W320 grade, vacuum packed. Direct from processing units in Andhra Pradesh.', { origin: 'Andhra Pradesh', leadTime: '5-7 days', shelfLife: '12 months', packaging: '10 kg vacuum tins', stock: 'in stock', rating: 4.8, ratingCount: 15 }),
];

const REQUIREMENTS = [
  { cat: 'grains-cereals', title: 'Organic Wheat Flour — 20 tons monthly', details: 'Looking for NPOP certified organic chakki atta for our retail brand. Need monthly supply, lab reports and packaging in 5 kg bags.', quantity: '20', unit: 'ton', budgetMin: 40, budgetMax: 48, city: 'Mumbai', state: 'Maharashtra', featured: true },
  { cat: 'cream-moisturisers', title: 'Private label organic face cream', details: 'D2C skincare brand needs ECOCERT certified moisturiser, 50 g jars, our label. First order 2,000 units.', quantity: '2000', unit: 'pieces', budgetMin: 150, budgetMax: 220, city: 'Bengaluru', state: 'Karnataka' },
  { cat: 'spices-herbs', title: 'Organic turmeric powder for export', details: 'Exporter to UAE and UK. Need USDA/EU organic turmeric powder, curcumin ≥ 4%, 25 kg bags, FOB Mundra.', quantity: '10', unit: 'ton', budgetMin: 150, budgetMax: 200, city: 'Ahmedabad', state: 'Gujarat', featured: true },
  { cat: 'sweeteners', title: 'Raw organic honey — 500 kg', details: 'Restaurant chain looking for raw multiflora honey in 5 kg food-service packs. Quarterly contract.', quantity: '500', unit: 'kg', budgetMin: 400, budgetMax: 550, city: 'New Delhi', state: 'Delhi' },
  { cat: 'edible-oils-ghee', title: 'A2 Cow Ghee — bulk for retail', details: 'Need bilona A2 ghee, 500 ml glass jars with our label, FSSAI compliant, 1,000 jars per month.', quantity: '1000', unit: 'pieces', budgetMin: 900, budgetMax: 1100, city: 'Pune', state: 'Maharashtra' },
  { cat: 'vegetables', title: 'Daily organic vegetables for 3 restaurants', details: 'Looking for a farm near Jaipur to supply seasonal organic vegetables daily — about 60 kg per day.', quantity: '60', unit: 'kg', budgetMin: 40, budgetMax: 70, city: 'Jaipur', state: 'Rajasthan' },
];

const REVIEWS = [
  ['organic-fresh-vegetables-basket', 'Helen Guo', 5, 'Fresh and exactly as described', 'We run a café in Jaipur and have been ordering weekly for 4 months. Vegetables arrive fresh at 7 am, invoices on time.'],
  ['organic-a2-desi-ghee', 'John Doe', 5, 'Best ghee we have stocked', 'Aroma and colour are outstanding. Our customers keep asking for it. Packaging survived transport to Mumbai without a single broken jar.'],
  ['organic-aloe-saffron-moisturiser', 'Sarah Lee', 4, 'Great for private label', 'Smooth texture and the ECOCERT paperwork was ready. Lead time was 12 days instead of 10, otherwise perfect.'],
  ['organic-himalayan-multiflora-honey', 'Rohit Mehra', 5, 'Genuine raw honey', 'NMR report shared before shipping. Crystallises naturally in winter which is exactly what raw honey should do.'],
  ['organic-turmeric-powder-high-curcumin', 'Fatima Khan', 5, 'Lab reports provided', 'Curcumin tested 5.3% in our own lab. Clean, bright colour, consistent across 3 orders.'],
  ['organic-ragi-finger-millet-flour', 'Anil Kumar', 4, 'Good quality, quick dispatch', 'Dispatched in 3 days. Flour is fine and fresh. Would like 10 kg packs as well.'],
];

export async function seedDemo(prisma) {
  if ((await prisma.product.count()) > 0) return;
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const cats = new Map((await prisma.category.findMany({ select: { id: true, slug: true } })).map((c) => [c.slug, c.id]));
  const sellers = [];
  for (let i = 0; i < SELLERS.length; i++) {
    const s = SELLERS[i];
    const email = `seller${i + 1}@demo.shrijaiv.com`;
    const user = await prisma.user.upsert({ where: { email }, update: {}, create: { name: s.companyName, email, role: 'SELLER', passwordHash: hash, phone: `98290${String(10000 + i * 1111).slice(0, 5)}` } });
    const profile = await prisma.sellerProfile.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        userId: user.id, slug: s.slug, companyName: s.companyName, about: s.about, logo: s.logo, banner: s.banner, businessType: s.businessType,
        gstNumber: s.gst, fssaiNumber: s.fssai || null, yearEstablished: s.year, employees: s.employees, phone: user.phone, whatsapp: user.phone, email,
        city: s.city, state: s.state, certifications: JSON.stringify(s.certs.map((name) => ({ name, number: '', file: '' }))),
        status: 'approved', verified: true, verifiedAt: new Date(), featured: i < 2, ratingAvg: s.rating, ratingCount: s.ratingCount,
      },
    });
    sellers.push(profile);
  }
  const bySlug = new Map();
  for (const p of PRODUCTS) {
    const gallery = [p.image, `${IMG}/p${(PRODUCTS.indexOf(p) % 3) + 1}.png`];
    const row = await prisma.product.create({
      data: {
        sellerId: sellers[p.seller].id, categoryId: cats.get(p.cat) || null, slug: p.slug, name: p.name, summary: p.summary,
        description: `<p>${p.summary}</p><p>Supplied by <strong>${SELLERS[p.seller].companyName}</strong>, ${SELLERS[p.seller].city}. Samples available on request; bulk pricing for orders above the MOQ. All lots come with certification copies and a lab report.</p>`,
        images: JSON.stringify(gallery), priceMin: p.priceMin, priceMax: p.priceMax, priceUnit: p.priceUnit, moq: p.moq, stock: p.stock || 'in stock',
        specs: JSON.stringify((p.specs || []).map(([label, value]) => ({ label, value }))), certifications: JSON.stringify(SELLERS[p.seller].certs.slice(0, 2)),
        origin: p.origin || SELLERS[p.seller].state, brand: SELLERS[p.seller].companyName, packaging: p.packaging, shelfLife: p.shelfLife, leadTime: p.leadTime,
        status: 'approved', featured: !!p.featured, views: 120 + Math.floor(Math.random() * 900), ratingAvg: p.rating || 0, ratingCount: p.ratingCount || 0,
      },
    });
    bySlug.set(p.slug, row);
  }
  // demo buyer + buy leads
  const bu = await prisma.user.upsert({ where: { email: 'buyer@demo.shrijaiv.com' }, update: {}, create: { name: 'Organic Basket Retail', email: 'buyer@demo.shrijaiv.com', role: 'BUYER', passwordHash: hash, phone: '9876543210' } });
  const buyer = await prisma.buyerProfile.upsert({ where: { userId: bu.id }, update: {}, create: { userId: bu.id, companyName: 'Organic Basket Retail', buyerType: 'retailer', city: 'Mumbai', state: 'Maharashtra', phone: bu.phone, whatsapp: bu.phone, verified: true } });
  if ((await prisma.requirement.count()) === 0) {
    for (const r of REQUIREMENTS) {
      await prisma.requirement.create({ data: { buyerId: buyer.id, categoryId: cats.get(r.cat) || null, title: r.title, details: r.details, quantity: r.quantity, unit: r.unit, budgetMin: r.budgetMin, budgetMax: r.budgetMax, deliveryCity: r.city, deliveryState: r.state, status: 'open', featured: !!r.featured, views: 40 + Math.floor(Math.random() * 300), expiresAt: new Date(Date.now() + 45 * 86_400_000) } });
    }
  }
  for (const [slug, authorName, rating, title, body] of REVIEWS) {
    const p = bySlug.get(slug);
    if (!p) continue;
    await prisma.review.create({ data: { sellerId: p.sellerId, productId: p.id, buyerId: buyer.id, authorName, rating, title, body, status: 'approved', verifiedPurchase: true } });
  }
  console.log(`✔ Demo marketplace: ${SELLERS.length} sellers, ${PRODUCTS.length} products, ${REQUIREMENTS.length} buy leads, ${REVIEWS.length} reviews (demo logins: seller1@demo.shrijaiv.com / buyer@demo.shrijaiv.com, password ${DEMO_PASSWORD})`);
}
