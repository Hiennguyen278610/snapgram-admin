'use client';

import { AlertCircle, SearchX, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import type { Locale } from '@/i18n/routing';
import { getErrorMessageKey } from '@/lib/api/error-mapper';
import type { ApiError } from '@/lib/api/types';
import { formatDateTime } from '@/lib/i18n/format';
import { useReportDetail } from '../hooks/use-report-detail';
import { isModeratableStatus, type Report } from '../schemas/report.schema';
import { ReportStatusBadge } from './report-status-badge';
import { ReportTargetBadge } from './report-target-badge';

interface Props {
  reportId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve?: (report: Report) => void;
  onDismiss?: (report: Report) => void;
}

const ID_PREVIEW_LENGTH = 8;

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right text-sm text-card-foreground">{children}</span>
    </div>
  );
}

/**
 * Right-hand detail drawer for a single report (conventions §8 › Sheet).
 * Only mounted when a report is selected, so the query never runs with an
 * empty id.
 */
export function ReportDetailSheet({ reportId, open, onOpenChange, onResolve, onDismiss }: Props) {
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');
  const tError = useTranslations();
  const locale = useLocale() as Locale;

  const { data: report, isLoading, isError, error, refetch } = useReportDetail(reportId);
  const apiError = error as unknown as ApiError | null;
  const isNotFound = isError && apiError?.kind === 'notFound';
  // BI-008: RESOLVED / DISMISSED reports can only be inspected.
  const moderatable = report ? isModeratableStatus(report.status) : false;
  const blockedHint = t('detail.actionBlocked');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full overflow-y-auto p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle>{t('detail.title')}</SheetTitle>
              <SheetDescription>
                {report ? report.id.slice(0, ID_PREVIEW_LENGTH) : tCommon('status.loading')}
              </SheetDescription>
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label={t('detail.close')}>
                <X className="size-4" aria-hidden />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="p-4">
          {isLoading ? (
            <div
              className="space-y-4"
              role="status"
              aria-busy="true"
              aria-label={t('detail.loading')}
            >
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : isNotFound ? (
            <div className="py-8 text-center">
              <SearchX className="mx-auto size-6 text-muted-foreground" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">{t('detail.notFound')}</p>
            </div>
          ) : isError ? (
            <div className="text-center">
              <AlertCircle
                className="mx-auto size-6 text-rose-600 dark:text-rose-400"
                aria-hidden
              />
              <p className="mt-3 text-sm text-muted-foreground">
                {apiError ? tError(getErrorMessageKey(apiError)) : tError('error.unknown')}
              </p>
              <Button
                type="button"
                className="mt-4"
                onClick={() => {
                  void refetch();
                }}
              >
                {tCommon('action.retry')}
              </Button>
            </div>
          ) : !report ? (
            <p className="text-sm text-muted-foreground">{t('detail.notFound')}</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <ReportStatusBadge status={report.status} />
                <ReportTargetBadge targetType={report.targetType} />
              </div>

              <Separator />

              <div className="divide-y divide-border">
                <DetailRow label={t('table.column.id')}>
                  <span className="font-mono text-xs break-all">{report.id}</span>
                </DetailRow>
                <DetailRow label={t('detail.reporter')}>
                  <span className="font-mono text-xs break-all">{report.reporterId}</span>
                </DetailRow>
                <DetailRow label={t('detail.target')}>
                  <span className="font-mono text-xs break-all">{report.targetId}</span>
                </DetailRow>
                <DetailRow label={t('detail.reason')}>{report.reason}</DetailRow>
                {report.description ? (
                  <DetailRow label={t('detail.description')}>{report.description}</DetailRow>
                ) : null}
                <DetailRow label={t('detail.created')}>
                  <time dateTime={report.createdAt}>
                    {formatDateTime(report.createdAt, locale)}
                  </time>
                </DetailRow>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={!moderatable}
                    title={moderatable ? undefined : blockedHint}
                    onClick={() => onResolve?.(report)}
                  >
                    {t('action.resolve')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!moderatable}
                    title={moderatable ? undefined : blockedHint}
                    onClick={() => onDismiss?.(report)}
                  >
                    {t('action.dismiss')}
                  </Button>
                </div>
                {!moderatable ? (
                  <p className="text-xs text-muted-foreground">{t('detail.statusHint')}</p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
