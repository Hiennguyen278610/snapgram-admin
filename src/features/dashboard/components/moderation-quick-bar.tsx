'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import { formatNumber } from '@/lib/i18n/format';
import type { AdminDashboardResponse } from '../schemas/stats.schema';

interface Props {
  stats: AdminDashboardResponse;
  isLoading?: boolean;
}

const SKELETON_PILLS = 3;

/**
 * Horizontal, scrollbar-free stat strip (layout-system.md §3.2 — tier 2).
 * `no-scrollbar` does not exist in Tailwind v4, so the arbitrary variant is
 * used instead.
 */
export function ModerationQuickBar({ stats, isLoading = false }: Props) {
  const t = useTranslations('dashboard');
  const locale = useLocale() as Locale;

  const items = [
    { key: 'emailVerified', label: t('stats.emailVerifiedUsers'), value: stats.emailVerifiedUsers },
    { key: 'twoFaEnabled', label: t('stats.twoFaEnabledUsers'), value: stats.twoFaEnabledUsers },
    { key: 'newThisWeek', label: t('stats.newUsersThisWeek'), value: stats.newUsersThisWeek },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-card-foreground">{t('quickStats.title')}</h2>
      <div className="mt-3 flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {isLoading
          ? Array.from({ length: SKELETON_PILLS }, (_, index) => (
              <div
                key={index}
                data-testid="quick-bar-skeleton"
                className="h-9 w-32 shrink-0 animate-pulse rounded-full bg-muted"
              />
            ))
          : items.map((item) => (
              <span
                key={item.key}
                className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm text-card-foreground"
              >
                <span className="text-muted-foreground">{item.label}</span>{' '}
                <span className="font-medium">{formatNumber(item.value, locale)}</span>
              </span>
            ))}
      </div>
    </div>
  );
}
