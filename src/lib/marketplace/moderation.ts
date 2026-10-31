// Admin-first delivery: when switched on (Admin → Marketplace settings), new inquiries and quotes
// wait in Admin → Review queue; the admin forwards them to the seller / buyer (or rejects them).
export const HELD = ['review', 'rejected'] as const;
/** Inquiries a seller may see */
export const SELLER_VISIBLE = { status: { notIn: [...HELD] } };
/** Quotes a buyer may see */
export const BUYER_VISIBLE = { status: { notIn: [...HELD] } };
