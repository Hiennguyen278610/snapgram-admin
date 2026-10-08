'use client';

import { useLocale } from 'next-intl';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Locale } from '@/i18n/routing';
import { formatNumber } from '@/lib/i18n/format';

interface Props {
  label: string;
  value: number;
  icon?: LucideIcon;
  isLoading?: boolean;
}

/**
 * Flat metric card — design-system.md §3.3 (no gradient surfaces) and §4
 * (`Stat Number` uses the display face at >= 24px).
 *
 * Loading placeholder uses the shadcn `Skeleton` component
 * (component-inventory.md §1.5).
 */
export function StatMetricCard({ label, value, icon: Icon, isLoading = false }: Props) {
  const locale = useLocale() as Locale;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon ? <Icon className="size-5 text-muted-foreground" aria-hidden /> : null}
      </div>
      {isLoading ? (
        <Skeleton data-testid="stat-metric-skeleton" className="mt-3 h-8 w-24" />
      ) : (
        <p className="mt-3 font-display text-2xl text-card-foreground">
          {formatNumber(value, locale)}
        </p>
      )}
    </div>
  );
}
