'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useServiceHealth } from '../hooks/use-service-health';
import { normalizeHealthStatus, type NormalizedStatus } from '../schemas/health.schema';

const DOT = {
  UP: 'bg-emerald-500',
  DOWN: 'bg-rose-500',
  UNKNOWN: 'bg-amber-500',
} as const;

/**
 * Compact gateway indicator for the top bar.
 *
 * The label is exposed through both `aria-label` and visible text so status is
 * never conveyed by color alone; the fixed-width text slot keeps the pill from
 * nudging the surrounding actions when the status changes.
 */
export function ServiceStatusPill() {
  const t = useTranslations('health');
  const { data, isLoading } = useServiceHealth('gateway', 30_000);

  const status: NormalizedStatus = isLoading
    ? 'UNKNOWN'
    : data
      ? normalizeHealthStatus(data.status)
      : 'DOWN';

  const label = isLoading
    ? t('pill.checking')
    : status === 'UP'
      ? t('pill.online')
      : t('pill.offline');

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      title={label}
      data-status={status}
      data-testid="service-status-pill"
      className="hidden shrink-0 items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex"
    >
      <span
        className={cn('size-2 shrink-0 rounded-full', DOT[status], isLoading && 'animate-pulse')}
        aria-hidden
      />
      <span className="w-40 truncate text-left">{label}</span>
    </span>
  );
}
