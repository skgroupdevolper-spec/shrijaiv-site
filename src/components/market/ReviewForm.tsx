'use client';
import { useState } from 'react';
import { Star, LoaderCircle, CircleCheck } from 'lucide-react';
import { useT } from '@/components/site/SiteProvider';
import SmartLink from '@/components/ui/SmartLink';

export default function ReviewForm({ sellerId, productId, user }: { sellerId: string; productId?: string; user?: { name: string } | null }) {
  const t = useT();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const r = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, rating, sellerId, productId }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Error');
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }
  if (!user)
    return (
      <p className="rounded-2xl bg-ink/5 px-4 py-3 text-sm text-ink/65">
        <SmartLink href="/login" className="font-bold text-gold-deep">{t('Sign in as a buyer')}</SmartLink> {t('to write a review.')}
      </p>
    );
  if (done)
    return (
      <p className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <CircleCheck className="h-4 w-4" /> {t('Thank you! Your review will appear after a quick check by our team.')}
      </p>
    );
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex items-center gap-1" role="radiogroup" aria-label={t('Rating')}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" role="radio" aria-checked={rating === i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => setRating(i)} className="p-0.5">
            <Star className={`h-7 w-7 transition ${i <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} strokeWidth={1.5} />
          </button>
        ))}
        <span className="ml-2 text-sm text-ink/60">{rating}/5</span>
      </div>
      <input name="title" placeholder={t('Title (optional)')} className="field" />
      <textarea name="body" required minLength={10} rows={4} placeholder={t('How was the product quality, packaging, communication and delivery?')} className="field" />
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="btn btn-gold">
        {loading && <LoaderCircle className="h-4 w-4 animate-spin" />} {t('Submit review')}
      </button>
    </form>
  );
}
