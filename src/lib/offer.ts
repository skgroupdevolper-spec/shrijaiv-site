// "Limited time offer" pop-up (Admin → Offer pop-up). Shown once per page per visit after a short delay.
export type OfferPackage = { name: string; govt: string; fee: string; price: string; time: string; pickup: boolean };
export type OfferSettings = {
  enabled: boolean;
  delay: number; // seconds
  eyebrow: string;
  title: string;
  lead: string;
  govtLabel: string;
  ourLabel: string;
  ourLabelPlain: string;
  noPickup: string;
  totalLabel: string;
  packages: OfferPackage[];
  bullets: string; // one per line
  cta: { label: string; href: string };
  waLabel: string;
  waPrefix: string;
  note: string;
};

export const defaultOffer: OfferSettings = {
  enabled: false,
  delay: 8,
  eyebrow: 'Limited time offer',
  title: 'Launch offer: all seller features free',
  lead: 'During our launch every seller gets the Growth plan features free: unlimited products, unlimited buyer contacts and featured slots.',
  govtLabel: 'Government Fee',
  ourLabel: 'Our fee (Pick-up & Drop-off)',
  ourLabelPlain: 'Our fee',
  noPickup: 'Pick-up & drop-off not included',
  totalLabel: 'Total',
  packages: [],
  bullets: 'Unlimited products and buyer contacts\nVerified badge after document check\nAI writes your product descriptions',
  cta: { label: 'Start selling', href: '/register?as=seller' },
  waLabel: 'Chat on WhatsApp',
  waPrefix: "I'm interested in the",
  note: 'Limited time offer — terms apply.',
};

export const OFFER_TEXT_KEYS = ['eyebrow', 'title', 'lead', 'govtLabel', 'ourLabel', 'ourLabelPlain', 'noPickup', 'totalLabel', 'bullets', 'waLabel', 'waPrefix', 'note'] as const;
