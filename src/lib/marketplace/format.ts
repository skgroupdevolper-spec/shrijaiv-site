// Pure formatting helpers safe for client components.
export const INDIAN_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman & Nicobar', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];

/** Official short codes (vehicle / ISO style) so every state gets a unique badge */
const STATE_CODES: Record<string, string> = {
  'Andhra Pradesh': 'AP', 'Arunachal Pradesh': 'AR', Assam: 'AS', Bihar: 'BR', Chhattisgarh: 'CG', Goa: 'GA', Gujarat: 'GJ', Haryana: 'HR', 'Himachal Pradesh': 'HP', Jharkhand: 'JH', Karnataka: 'KA', Kerala: 'KL', 'Madhya Pradesh': 'MP', Maharashtra: 'MH', Manipur: 'MN', Meghalaya: 'ML', Mizoram: 'MZ', Nagaland: 'NL', Odisha: 'OD', Punjab: 'PB', Rajasthan: 'RJ', Sikkim: 'SK', 'Tamil Nadu': 'TN', Telangana: 'TS', Tripura: 'TR', 'Uttar Pradesh': 'UP', Uttarakhand: 'UK', 'West Bengal': 'WB', 'Andaman & Nicobar': 'AN', Chandigarh: 'CH', 'Dadra & Nagar Haveli and Daman & Diu': 'DN', Delhi: 'DL', 'Jammu & Kashmir': 'JK', Ladakh: 'LA', Lakshadweep: 'LD', Puducherry: 'PY',
};
export function stateCode(s: string) {
  if (STATE_CODES[s]) return STATE_CODES[s];
  const w = s.replace(/[^A-Za-z ]/g, ' ').split(/\s+/).filter((x) => x && !/^(and|of|the)$/i.test(x));
  return (w.length > 1 ? w[0][0] + w[1][0] : s.slice(0, 2)).toUpperCase();
}

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
