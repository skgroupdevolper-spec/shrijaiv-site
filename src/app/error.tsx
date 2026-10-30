'use client';
import RecoverError from '@/components/site/RecoverError';

export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RecoverError {...props} />;
}
