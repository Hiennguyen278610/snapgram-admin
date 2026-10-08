'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from 'cn';
import type { ReportStatus } from '@/lib/api/query-keys';

interface Props {
  status: ReportStatus;
}

/**
 * Absolute-rules Rule 5 exception: the `amber` / `sky` / `emerald` pairs below
 * are the semantic status palettes sanctioned for moderation states. `DISMISSED`
 * intentionally falls back to the neutral muted token — a rejected report is
 * not a warning, it is simply closed.
 */
const STATUS_CLASSES: Record<ReportStatus, string> = {
  PENDING:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50',
  REVIEWED:
    'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/50',
  RESOLVED:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50',
  DISMISSED: 'bg-muted text-muted-foreground border-border',
};

export function ReportStatusBadge({ status }: Props) {
  const t = useTranslations('reports');

  return (
    <Badge variant="outline" className={cn(STATUS_CLASSES[status])} data-status={status}>
      {t(`status.${status.toLowerCase()}`)}
    </Badge>
  );
}
