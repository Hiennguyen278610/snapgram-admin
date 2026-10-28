'use client';

import { AlertCircle, SearchX, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Locale } from '@/i18n/routing';
import { getErrorMessageKey } from '@/lib/api/error-mapper';
import type { ApiError } from '@/lib/api/types';
import { formatDateTime } from '@/lib/i18n/format';
import { usePermission } from '@/features/auth/hooks/use-permission';
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
 * Center modal for a single report (conventions §8 › Dialog).
 * Only mounted when a report is selected, so the query never runs with an
 * empty id.
 */
export function ReportDetailDialog({ reportId, open, onOpenChange, onResolve, onDismiss }: Props) {
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');
  const tError = useTranslations();
  const locale = useLocale() as Locale;

  const { data: report, isLoading, isError, error, refetch } = useReportDetail(reportId);
  const apiError = error as unknown as ApiError | null;
  const isNotFound = isError && apiError?.kind === 'notFound';
  const { isAdmin, hasPermission } = usePermission();
  const canModerate = isAdmin || hasPermission('REPORT:RESOLVE') || hasPermission('REPORT:DISMISS');

  // BI-008: RESOLVED / DISMISSED reports can only be inspected.
  const moderatable = report ? isModeratableStatus(report.status) : false;
  const blockedHint = t('detail.actionBlocked');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-3xl"
      >
        <DialogHeader className="p-6 pb-0 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle>{t('detail.title')}</DialogTitle>
              <DialogDescription>
                {report ? report.id.slice(0, ID_PREVIEW_LENGTH) : tCommon('status.loading')}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label={t('detail.close')}>
                <X className="size-4" aria-hidden />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

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

              {/* Reported Content Preview Card */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('detail.previewTitle')}
                  </h4>
                  {report.targetStatus ? (
                    <Badge
                      variant="outline"
                      className={
                        report.targetStatus === 'DELETED'
                          ? 'border-rose-300 text-rose-600 dark:border-rose-800 dark:text-rose-400 text-[10px]'
                          : 'border-border text-muted-foreground text-[10px]'
                      }
                    >
                      {report.targetStatus}
                    </Badge>
                  ) : null}
                </div>

                {/* Author Info */}
                {report.targetAuthorUsername || report.targetAuthorDisplayName ? (
                  <div className="flex items-center gap-2.5">
                    <Avatar size="sm" className="size-7">
                      {report.targetAuthorAvatarUrl ? (
                        <AvatarImage
                          src={report.targetAuthorAvatarUrl}
                          alt={report.targetAuthorDisplayName || ''}
                        />
                      ) : null}
                      <AvatarFallback className="text-xs font-semibold">
                        {(report.targetAuthorDisplayName || report.targetAuthorUsername || 'U')
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground">
                        {report.targetAuthorDisplayName || report.targetAuthorUsername}
                      </span>
                      {report.targetAuthorUsername ? (
                        <span className="text-[10px] text-muted-foreground">
                          @{report.targetAuthorUsername}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {/* Content / Caption */}
                {report.targetContent ? (
                  <div className="rounded-lg border border-border bg-card p-3 text-sm text-foreground whitespace-pre-wrap break-words">
                    {report.targetContent}
                  </div>
                ) : !report.targetMediaUrls?.length && !report.targetAuthorUsername ? (
                  <p className="text-xs italic text-muted-foreground">
                    {t('detail.contentUnavailable')}
                  </p>
                ) : null}

                {/* Attached Media Grid */}
                {report.targetMediaUrls && report.targetMediaUrls.length > 0 ? (
                  <div className="space-y-1.5">
                    <span className="text-xs text-muted-foreground">{t('detail.media')}</span>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {report.targetMediaUrls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-card"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Reported media ${index + 1}`}
                            className="size-full object-cover transition-transform group-hover:scale-105"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <Separator />

              {canModerate ? (
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
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
