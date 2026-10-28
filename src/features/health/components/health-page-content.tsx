'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/i18n/routing';
import { formatDateTime } from '@/lib/i18n/format';
import { useAllServicesHealth } from '../hooks/use-all-services-health';
import { AccessDeniedCard } from '@/components/layout/access-denied-card';
import { usePermission } from '@/features/auth/hooks/use-permission';
import { ExternalLinksCard } from './external-links-card';
import { ServiceStatusCard } from './service-status-card';

export function HealthPageContent() {
  const t = useTranslations('health');
  // Full-path service label keys resolve from the root namespace.
  const tRoot = useTranslations();
  const locale = useLocale() as Locale;
  const { hasAnyPermission, isLoading: isAuthLoading } = usePermission();
  const { services, isLoading, isError, lastChecked, refetch } = useAllServicesHealth();

  if (!isAuthLoading && !hasAnyPermission('SYSTEM:SETTINGS_READ', 'AUDIT:VIEW')) {
    return <AccessDeniedCard />;
  }

  const lastCheckedLabel = lastChecked ? formatDateTime(lastChecked, locale) : null;

  return (
    <section className="py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-card-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
          {lastCheckedLabel ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t('lastChecked', { time: lastCheckedLabel })}
            </p>
          ) : null}
        </div>

        <Button type="button" variant="outline" onClick={refetch} disabled={isLoading}>
          <RefreshCw className="size-4" aria-hidden />
          {t('refresh')}
        </Button>
      </div>

      <div className="mt-6">
        {isError ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <AlertCircle className="mx-auto size-6 text-rose-600 dark:text-rose-400" aria-hidden />
            <h2 className="mt-3 text-lg font-semibold text-card-foreground">{t('error.title')}</h2>
            <Button type="button" className="mt-4" onClick={refetch}>
              {t('error.retry')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <ServiceStatusCard
                key={service.id}
                label={tRoot(service.labelKey)}
                status={isLoading ? 'UNKNOWN' : service.status}
                isLoading={isLoading}
                lastChecked={
                  service.lastChecked ? formatDateTime(service.lastChecked, locale) : null
                }
              />
            ))}
            <ExternalLinksCard />
          </div>
        )}
      </div>
    </section>
  );
}
