// Pure formatting helpers safe for client components.
export const INDIAN_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman & Nicobar', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];

export function images(json?: string | null): string[] {
  try {
    const v = JSON.parse(json || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function inr(n?: number | null) {
  if (n == null) return '';
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export function priceLabel(p: { priceMin?: number | null; priceMax?: number | null; priceUnit?: string | null }) {
  if (p.priceMin == null && p.priceMax == null) return 'Price on request';
  const unit = p.priceUnit ? ` ${p.priceUnit}` : '';
  if (p.priceMin != null && p.priceMax != null && p.priceMax !== p.priceMin) return `${inr(p.priceMin)} – ${inr(p.priceMax)}${unit}`;
  return `${inr(p.priceMin ?? p.priceMax)}${unit}`;
}
