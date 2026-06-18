'use client';

import { useEffect, useRef } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || '';

export function isTurnstileConfigured(): boolean {
  const explicit = process.env.NEXT_PUBLIC_TURNSTILE_ENABLED?.trim();
  if (explicit === 'false') return false;
  if (explicit === 'true') return Boolean(SITE_KEY);
  if (process.env.NODE_ENV === 'development') return false;
  return Boolean(SITE_KEY);
}

type TurnstileFieldProps = {
  resetKey: number;
  onToken: (token: string | null) => void;
  onError?: () => void;
};

export function TurnstileField({ resetKey, onToken, onError }: TurnstileFieldProps) {
  const turnstileRef = useRef<TurnstileInstance>(null);

  useEffect(() => {
    if (resetKey === 0) return;
    turnstileRef.current?.reset();
    onToken(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when resetKey changes
  }, [resetKey]);

  if (!isTurnstileConfigured()) return null;

  return (
    <div className="flex min-h-[65px] items-center justify-start">
      <Turnstile
        ref={turnstileRef}
        siteKey={SITE_KEY}
        options={{ appearance: 'always' }}
        onSuccess={(token) => onToken(token)}
        onExpire={() => {
          onToken(null);
          turnstileRef.current?.reset();
        }}
        onError={() => {
          onToken(null);
          onError?.();
        }}
      />
    </div>
  );
}
