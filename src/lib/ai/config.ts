// AI provider settings: one row in the Setting table (key "ai"), deep-merged with defaults.
// Used by the chatbot, the "write with AI" helpers in the seller dashboard and translations.
// Secrets are only returned to the browser masked (see maskSecrets / unmaskSecrets).
import { prisma } from '@/lib/db';
import { deepMerge, maskSecrets, unmaskSecrets } from './pure';

export type ProviderId = 'gemini' | 'claude' | 'openai' | 'openrouter';
export const PROVIDERS: { id: ProviderId; name: string; keyHint: string; keyUrl: string }[] = [
  { id: 'gemini', name: 'Google Gemini', keyHint: 'AIza…', keyUrl: 'https://aistudio.google.com/apikey' },
  { id: 'claude', name: 'Claude (Anthropic)', keyHint: 'sk-ant-…', keyUrl: 'https://console.anthropic.com/settings/keys' },
  { id: 'openai', name: 'ChatGPT (OpenAI)', keyHint: 'sk-…', keyUrl: 'https://platform.openai.com/api-keys' },
  { id: 'openrouter', name: 'OpenRouter', keyHint: 'sk-or-…', keyUrl: 'https://openrouter.ai/keys' },
];

export type AiConfig = {
  provider: ProviderId; // default provider for AI helpers
  providers: Record<ProviderId, { key: string; model: string }>;
  useTranslationGeminiKey: boolean; // reuse the Gemini key from Languages when none is set here
  maxCallsPerDay: number; // 0 = unlimited
};

export const DEFAULT_AI: AiConfig = {
  provider: 'gemini',
  providers: {
    gemini: { key: '', model: 'gemini-3.8-flash' },
    claude: { key: '', model: 'claude-haiku-5-5' },
    openai: { key: '', model: 'gpt-4.1-mini' },
    openrouter: { key: '', model: 'anthropic/claude-haiku-5.5' },
  },
  useTranslationGeminiKey: true,
  maxCallsPerDay: 0,
};

const KEY = 'ai';

export async function getAiConfig(): Promise<AiConfig> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: KEY } });
    return deepMerge(DEFAULT_AI, row ? JSON.parse(row.value) : {});
  } catch {
    return DEFAULT_AI;
  }
}

/** Saves a (possibly partial, possibly masked) config coming from the admin screen */
export async function saveAiConfig(incoming: Partial<AiConfig>): Promise<AiConfig> {
  const current = await getAiConfig();
  const next = deepMerge(current, unmaskSecrets(incoming || {}, current));
  await prisma.setting.upsert({ where: { key: KEY }, update: { value: JSON.stringify(next) }, create: { key: KEY, value: JSON.stringify(next) } });
  return next;
}

/** Config safe to send to the browser (keys masked) */
export function publicAiConfig(cfg: AiConfig) {
  return maskSecrets(cfg);
}
