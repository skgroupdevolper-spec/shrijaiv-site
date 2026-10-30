'use client';
import RecoverError from '@/components/site/RecoverError';

export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <RecoverError {...props} />
      </body>
    </html>
  );
}
