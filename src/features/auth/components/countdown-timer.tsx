'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  seconds: number;
  onComplete?: () => void;
}

export function CountdownTimer({ seconds, onComplete }: Props) {
  const t = useTranslations('auth.login');
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete?.();
      return;
    }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining, onComplete]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <span role="timer" aria-live="polite">
      {t('lockoutCountdown', { time: `${mm}:${ss}` })}
    </span>
  );
}
