import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireSeller, requireBuyer } from '@/lib/auth';
import { savePublicFile } from '@/lib/upload';

/** Image / PDF uploads from the seller and buyer dashboards (own files only) */
export async function POST(req: Request) {
  const who = (await requireSeller()) || (await requireBuyer());
  if (!who) return fail('Unauthorized', 401);
  const fd = await req.formData();
  const files = fd.getAll('files').filter((f): f is File => typeof f === 'object' && 'arrayBuffer' in f);
  if (!files.length) return fail('No file');
  if (files.length > 10) return fail('At most 10 files at once');
  const out: { url: string; name: string; size: number; mime: string | null }[] = [];
  for (const f of files) {
    if (!/^(image\/(jpeg|png|webp|gif|avif)|application\/pdf)$/.test(f.type)) return fail(`"${f.name}": only JPG, PNG, WebP, GIF or PDF`);
    try {
      const saved = await savePublicFile(f);
      await prisma.media.create({ data: { filename: `${'seller' in who ? 'seller' : 'buyer'}:${who.session.sub}:${f.name}`, url: saved.url, mime: saved.mime, size: saved.size } }).catch(() => null);
      out.push({ url: saved.url, name: f.name, size: saved.size, mime: saved.mime });
    } catch (e) {
      return fail((e as Error).message);
    }
  }
  return ok({ items: out });
}
