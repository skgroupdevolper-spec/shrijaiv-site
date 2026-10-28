// Text AI client shared by the chatbot, seller "write with AI" tools and admin tests:
// Gemini, Claude, ChatGPT (OpenAI) and OpenRouter. Every call has a timeout and never logs keys.
// AI_FAKE=1 returns fixed sample answers (no network, no cost) for tests.
import { getSetting } from '@/lib/settings';
import { AiConfig, getAiConfig, ProviderId } from './config';
import { outputBudget, parseJsonLoose, scrubSecrets } from './pure';
export { outputBudget, thinkingModel } from './pure';

export class AiError extends Error {
  kind: 'quota' | 'auth' | 'config' | 'bad_output' | 'network' | 'other';
  constructor(kind: AiError['kind'], message: string) {
    super(scrubSecrets(message));
    this.kind = kind;
  }
}

export type CompleteOpts = {
  system: string;
  prompt: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  provider?: ProviderId; // force a provider (used by the Test buttons)
  timeoutMs?: number;
  images?: { mime: string; data: string }[]; // base64 pictures for vision tasks
};

export const isFakeAi = () => process.env.AI_FAKE === '1' || process.env.AUTOPUBLISHER_FAKE_AI === '1';

/** Resolves the key for a provider: the saved key, then the environment, then (Gemini) the Languages key */
export async function providerKey(cfg: AiConfig, id: ProviderId): Promise<string> {
  const own = cfg.providers[id]?.key?.trim();
  if (own) return own;
  const env = { gemini: process.env.GEMINI_API_KEY, claude: process.env.ANTHROPIC_API_KEY, openai: process.env.OPENAI_API_KEY, openrouter: process.env.OPENROUTER_API_KEY }[id];
  if (env) return env.trim();
  if (id === 'gemini' && cfg.useTranslationGeminiKey) {
    const t: any = await getSetting('translation');
    if (t?.geminiKey) return String(t.geminiKey).trim();
  }
  return '';
}

/** Call the default provider from the saved AI settings */
export async function complete(opts: CompleteOpts): Promise<string> {
  const cfg = await getAiConfig();
  const id: ProviderId = opts.provider || cfg.provider;
  if (isFakeAi()) return fakeAnswer(opts);
  const key = await providerKey(cfg, id);
  if (!key) throw new AiError('config', `No API key for ${id}. Add it in Admin → AI assistant.`);
  const model = cfg.providers[id]?.model?.trim();
  if (!model) throw new AiError('config', `No model name set for ${id}.`);
  return callModel(id, key, model, opts);
}

/** Direct call to one provider with a given key and model */
export async function callModel(id: ProviderId, key: string, model: string, opts: CompleteOpts): Promise<string> {
  if (isFakeAi()) return fakeAnswer(opts);
  const timeoutMs = opts.timeoutMs ?? 60_000;
  const temperature = opts.temperature ?? 0.4;
  const maxTokens = opts.maxTokens ?? 1200;
  try {
    if (id === 'gemini') return await callGemini(key, model, opts, temperature, maxTokens, timeoutMs);
    if (id === 'claude') return await callClaude(key, model, opts, temperature, maxTokens, timeoutMs);
    return await callOpenAiCompatible(id, key, model, opts, temperature, maxTokens, timeoutMs);
  } catch (e: any) {
    throw e instanceof AiError ? e : new AiError(e?.name === 'TimeoutError' || e?.name === 'AbortError' ? 'network' : 'other', e?.message || String(e));
  }
}

/** complete() + JSON parsing; on unparseable output asks once more for valid JSON only */
export async function completeJson<T = any>(opts: CompleteOpts): Promise<T> {
  const raw = await complete({ ...opts, json: true });
  const v = parseJsonLoose(raw);
  if (v !== null) return v as T;
  const retry = await complete({ ...opts, json: true, prompt: `${opts.prompt}\n\nYour previous answer was not valid JSON. Return valid JSON only — no code fences, no text before or after.` });
  const v2 = parseJsonLoose(retry);
  if (v2 === null) throw new AiError('bad_output', 'The AI did not return valid JSON (tried twice).');
  return v2 as T;
}

/** Short real call used by the admin "Test" button: returns the answer or throws the exact error */
export async function testProvider(id: ProviderId): Promise<{ answer: string; ms: number; model: string }> {
  const cfg = await getAiConfig();
  const t = Date.now();
  const answer = await complete({ provider: id, system: 'You are a connection test. Reply briefly.', prompt: 'Reply with exactly: {"ok":true,"message":"SHRIJAIV AI connected"}', json: true, temperature: 0, maxTokens: 200, timeoutMs: 45_000 });
  return { answer: answer.slice(0, 500), ms: Date.now() - t, model: isFakeAi() ? 'fake' : cfg.providers[id].model };
}

function fakeAnswer(o: CompleteOpts): string {
  if (/connection test/i.test(o.system)) return JSON.stringify({ ok: true, message: 'SHRIJAIV AI connected (fake mode)' });
  if (o.json) return JSON.stringify({ reply: 'Fake AI answer for a test run.', handover: null });
  return 'Fake AI answer for a test run.';
}

// ---------------------------------------------------------------- providers

export async function http(url: string, init: RequestInit, timeoutMs: number, who: string) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs), cache: 'no-store' });
  const text = await res.text();
  if (!res.ok) {
    let msg = text.slice(0, 600);
    try {
      const j = JSON.parse(text);
      msg = j?.error?.message || j?.error?.type || j?.message || msg;
    } catch {
      /* keep raw text */
    }
    const kind = res.status === 429 || /quota|rate.?limit|resource.?exhausted|overloaded/i.test(msg) ? 'quota' : res.status === 401 || res.status === 403 ? 'auth' : 'other';
    throw new AiError(kind, `${who} HTTP ${res.status}: ${msg}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new AiError('bad_output', `${who} returned a non-JSON response`);
  }
}

async function callGemini(key: string, model: string, o: CompleteOpts, temperature: number, maxTokens: number, timeoutMs: number) {
  maxTokens = outputBudget(model, maxTokens);
  const base = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com';
  const body: any = {
    systemInstruction: { parts: [{ text: o.system }] },
    contents: [{ role: 'user', parts: [{ text: o.prompt }, ...(o.images || []).map((im) => ({ inlineData: { mimeType: im.mime, data: im.data } }))] }],
    generationConfig: { temperature, maxOutputTokens: maxTokens, ...(o.json ? { responseMimeType: 'application/json' } : {}) },
  };
  const j = await http(`${base}/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body) }, timeoutMs, 'Gemini');
  const parts = j?.candidates?.[0]?.content?.parts || [];
  const out = parts.map((p: any) => p.text || '').join('').trim();
  if (!out) throw new AiError('bad_output', `Gemini returned no text (${j?.candidates?.[0]?.finishReason || j?.promptFeedback?.blockReason || 'empty'})`);
  return out;
}

async function callClaude(key: string, model: string, o: CompleteOpts, temperature: number, maxTokens: number, timeoutMs: number) {
  maxTokens = outputBudget(model, maxTokens);
  const body = {
    model,
    max_tokens: maxTokens,
    temperature,
    system: o.system + (o.json ? '\n\nReturn valid JSON only.' : ''),
    messages: [{ role: 'user', content: o.images?.length ? [...o.images.map((im) => ({ type: 'image', source: { type: 'base64', media_type: im.mime, data: im.data } })), { type: 'text', text: o.prompt }] : o.prompt }],
  };
  const j = await http('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify(body) }, timeoutMs, 'Claude');
  const out = (j?.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('').trim();
  if (!out) throw new AiError('bad_output', `Claude returned no text (${j?.stop_reason || 'empty'})`);
  return out;
}

async function callOpenAiCompatible(id: ProviderId, key: string, model: string, o: CompleteOpts, temperature: number, maxTokens: number, timeoutMs: number) {
  const isOpenAi = id === 'openai';
  maxTokens = outputBudget(model, maxTokens);
  const url = isOpenAi ? 'https://api.openai.com/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
  // reasoning models (o-series, gpt-5) only accept the default temperature
  const reasoning = /^(o\d|gpt-5)/i.test(model.replace(/^openai\//, ''));
  const body: any = {
    model,
    messages: [
      { role: 'system', content: o.system },
      { role: 'user', content: o.images?.length ? [{ type: 'text', text: o.prompt }, ...o.images.map((im) => ({ type: 'image_url', image_url: { url: `data:${im.mime};base64,${im.data}` } }))] : o.prompt },
    ],
    ...(reasoning ? {} : { temperature }),
    ...(isOpenAi ? { max_completion_tokens: maxTokens } : { max_tokens: maxTokens }),
    ...(o.json ? { response_format: { type: 'json_object' } } : {}),
  };
  const headers: Record<string, string> = { Authorization: `Bearer ${key}`, 'content-type': 'application/json' };
  if (!isOpenAi) {
    headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_SITE_URL || 'https://shrijaiv.com';
    headers['X-Title'] = 'SHRIJAIV Organic';
  }
  const who = isOpenAi ? 'OpenAI' : 'OpenRouter';
  const j = await http(url, { method: 'POST', headers, body: JSON.stringify(body) }, timeoutMs, who);
  const out = String(j?.choices?.[0]?.message?.content || '').trim();
  if (!out) throw new AiError('bad_output', `${who} returned no text (${j?.choices?.[0]?.finish_reason || 'empty'})`);
  return out;
}

