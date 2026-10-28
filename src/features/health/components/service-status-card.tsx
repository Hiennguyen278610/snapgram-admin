'use client';

import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { NormalizedStatus } from '../schemas/health.schema';

interface Props {
  label: string;
  status: NormalizedStatus;
  /** Already-localized "last checked" timestamp, or null while pending. */
  lastChecked?: string | null;
  isLoading?: boolean;
}

const STATUS_ICON = {
  UP: CheckCircle2,
  DOWN: XCircle,
  UNKNOWN: HelpCircle,
} as const;

/**
 * Only emerald / rose / amber are sanctioned status colors
 * (absolute-rules.md Rule 5) and both light and dark variants are spelled out
 * explicitly for contrast.
 */
const STATUS_TEXT = {
  UP: 'text-emerald-600 dark:text-emerald-400',
  DOWN: 'text-rose-600 dark:text-rose-400',
  UNKNOWN: 'text-amber-600 dark:text-amber-400',
} as const;

const STATUS_KEY = {
  UP: 'status.up',
  DOWN: 'status.down',
  UNKNOWN: 'status.unknown',
} as const;

/** Flat status tile — no gradient, hairline `border-border`, semantic tokens. */
export function ServiceStatusCard({ label, status, lastChecked, isLoading = false }: Props) {
  const t = useTranslations('health');
  const Icon = STATUS_ICON[status];

  return (
    <div
      data-testid="service-status-card"
      data-status={status}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-card-foreground">{label}</p>
        <Icon className={cn('size-5 shrink-0', STATUS_TEXT[status])} aria-hidden />
      </div>

      {isLoading ? (
        <Skeleton data-testid="service-status-skeleton" className="mt-3 h-5 w-24" />
      ) : (
        <p className={cn('mt-3 text-sm font-medium', STATUS_TEXT[status])}>
          {t(STATUS_KEY[status])}
        </p>
      )}

      {!isLoading && lastChecked ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {t('lastChecked', { time: lastChecked })}
        </p>
      ) : null}
    </div>
  );
}
