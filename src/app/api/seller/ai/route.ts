import { ok, fail, rateLimit, clientIp } from '@/lib/api';
import { requireSeller } from '@/lib/auth';
import { entitlements } from '@/lib/marketplace/plans';
import { complete, AiError } from '@/lib/ai/client';
import { parseJsonLoose } from '@/lib/ai/pure';
import { localeInfo } from '@/lib/i18n/config';

export const maxDuration = 60;

/**
 * AI helpers for sellers:
 *  task "describe"  → { summary, description (HTML), metaTitle, metaDescription, tags }
 *  task "translate" → { text } in the given language
 *  task "about"     → company "About" text
 */
export async function POST(req: Request) {
  const ctx = await requireSeller();
  if (!ctx) return fail('Unauthorized', 401);
  if (!rateLimit('sai:' + ctx.seller.id, 40, 60 * 60_000)) return fail('Too many AI requests this hour', 429);
  const e = await entitlements(ctx.seller.id);
  if (!e.aiTools) return fail('AI tools are included in paid plans. Upgrade to use them.', 403);
  const b = await req.json().catch(() => ({}));
  const task = String(b.task || 'describe');
  const base = `You write for SHRIJAIV Organic, India's organic B2B marketplace. Be concrete, honest and specific; never invent certifications, lab results or prices that were not given. Indian English. No marketing fluff, no emojis.`;
  try {
    if (task === 'describe') {
      const name = String(b.name || '').trim();
      if (!name) return fail('Please enter the product name first');
      const facts = [b.category && `Category: ${b.category}`, b.specs && `Specs: ${b.specs}`, b.certifications && `Certifications: ${b.certifications}`, b.origin && `Origin: ${b.origin}`, b.moq && `MOQ: ${b.moq}`, b.packaging && `Packaging: ${b.packaging}`, b.notes && `Seller notes: ${b.notes}`].filter(Boolean).join('\n');
      const raw = await complete({ system: base, json: true, maxTokens: 1400, prompt: `Write the listing for this organic product sold by "${ctx.seller.companyName}".\nProduct: ${name}\n${facts}\n\nReturn JSON: {"summary": "1-2 sentences, max 220 characters, for the card", "description": "HTML with <p>, <h3> and <ul>: what it is, how it is grown/made, quality & grading, uses, packaging & shelf life, why buy from this seller — 180-320 words", "metaTitle": "max 60 chars", "metaDescription": "max 155 chars", "tags": "6-10 comma separated search keywords"}` });
      const j = parseJsonLoose(raw);
      if (!j) return fail('The AI did not return a usable answer. Please try again.');
      return ok({ result: j });
    }
    if (task === 'about') {
      const raw = await complete({ system: base, maxTokens: 900, prompt: `Write an "About us" text (HTML, 2-4 short <p>, 120-220 words) for a seller showroom.\nCompany: ${ctx.seller.companyName}\nType: ${ctx.seller.businessType || ''}\nLocation: ${[ctx.seller.city, ctx.seller.state].filter(Boolean).join(', ')}\nSince: ${ctx.seller.yearEstablished || ''}\nWhat they sell / notes: ${String(b.notes || '').slice(0, 1500)}` });
      return ok({ result: { text: raw.trim() } });
    }
    if (task === 'translate') {
      const text = String(b.text || '').slice(0, 6000);
      const lang = localeInfo(String(b.locale || 'hi')).name;
      if (!text) return fail('Nothing to translate');
      const raw = await complete({ system: `You are a professional translator for Indian B2B commerce. Keep HTML tags, numbers, units and brand names unchanged.`, maxTokens: 2500, prompt: `Translate into ${lang}. Reply with the translation only.\n\n${text}` });
      return ok({ result: { text: raw.trim() } });
    }
    return fail('Unknown task');
  } catch (err) {
    const m = err instanceof AiError ? err.message : (err as Error).message;
    return fail(m.includes('No API key') ? 'AI is not configured yet. The admin can add an API key in Admin → AI assistant.' : m);
  }
}
