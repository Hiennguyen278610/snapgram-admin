'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PaymentStatus } from '@/lib/api/query-keys';

interface Props {
  status: PaymentStatus;
}

const STATUS_CLASSES: Record<PaymentStatus, string> = {
  PENDING:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50',
  SUCCESS:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50',
  FAILED:
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50',
  EXPIRED: 'bg-muted text-muted-foreground border-border',
  CANCELLED: 'bg-muted text-muted-foreground border-border',
  REFUNDED:
    'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/50',
};

export function PaymentStatusBadge({ status }: Props) {
  const t = useTranslations('payments.status');

  const labelKey = status.toLowerCase() as
    'pending' | 'success' | 'completed' | 'expired' | 'failed' | 'unknown';
  let label = status as string;
  try {
    label = t(labelKey);
  } catch {
    label = status;
  }

  return (
    <Badge
      variant="outline"
      className={cn(STATUS_CLASSES[status] ?? 'bg-muted text-muted-foreground border-border')}
      data-status={status}
    >
      {label}
    </Badge>
  );
}
