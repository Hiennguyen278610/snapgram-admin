'use client';

import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { getErrorMessageKey } from '@/lib/api/error-mapper';
import type { ApiError } from '@/lib/api/types';

interface Props {
  error: ApiError | null;
  onRetry: () => void;
}

export function ReportsError({ error, onRetry }: Props) {
  const t = useTranslations('reports');
  // Full-path keys (`error.*`) are resolved from the root namespace.
  const tError = useTranslations();

  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <AlertCircle className="mx-auto size-6 text-rose-600 dark:text-rose-400" aria-hidden />
      <h2 className="mt-3 text-lg font-semibold text-card-foreground">{t('error.loadFailed')}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {error ? tError(getErrorMessageKey(error)) : tError('error.unknown')}
      </p>
      <Button type="button" className="mt-4" onClick={onRetry}>
        {tError('common.action.retry')}
      </Button>
    </div>
  );
}
