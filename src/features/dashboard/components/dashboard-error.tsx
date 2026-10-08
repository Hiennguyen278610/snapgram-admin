'use client';

import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { getErrorMessageKey } from '@/lib/api/error-mapper';
import type { ApiError } from '@/lib/api/types';

interface Props {
  error: ApiError;
  onRetry: () => void;
}

export function DashboardError({ error, onRetry }: Props) {
  const t = useTranslations('dashboard');
  // Full-path keys (`error.*`) are resolved from the root namespace.
  const tError = useTranslations();

  return (
    <div className="bg-card border border-border rounded-2xl p-6 text-center">
      <AlertCircle className="mx-auto size-6 text-rose-600 dark:text-rose-400" aria-hidden />
      <h2 className="mt-3 text-lg font-semibold text-card-foreground">{t('error.title')}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{tError(getErrorMessageKey(error))}</p>
      <Button type="button" className="mt-4" onClick={onRetry}>
        {t('error.retry')}
      </Button>
    </div>
  );
}
