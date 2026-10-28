import { ok, fail } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { PROVIDERS, getAiConfig, saveAiConfig, publicAiConfig } from '@/lib/ai/config';
import { testProvider } from '@/lib/ai/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  if (!(await requireAdmin())) return fail('Admins only', 403);
  return ok({ value: publicAiConfig(await getAiConfig()), providers: PROVIDERS });
}

export async function PUT(req: Request) {
  if (!(await requireAdmin())) return fail('Admins only', 403);
  const { value } = await req.json().catch(() => ({}));
  if (!value || typeof value !== 'object') return fail('Invalid data');
  return ok({ value: publicAiConfig(await saveAiConfig(value)) });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return fail('Admins only', 403);
  const b = await req.json().catch(() => ({}));
  try {
    return ok(await testProvider(b.provider || 'gemini'));
  } catch (e) {
    return fail((e as Error).message);
  }
}
