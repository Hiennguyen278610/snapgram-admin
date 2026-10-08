'use client';

import { Suspense, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { getErrorMessageKey } from '@/lib/api/error-mapper';
import type { ApiError } from '@/lib/api/types';
import { useDismissReport } from '../hooks/use-dismiss-report';
import { useReportFilters } from '../hooks/use-report-filters';
import { useReportsList } from '../hooks/use-reports-list';
import { useResolveReport } from '../hooks/use-resolve-report';
import type { Report } from '../schemas/report.schema';
import { DismissReportDialog } from './dismiss-report-dialog';
import { ReportDetailDialog } from './report-detail-dialog';
import { ReportQueueTable, type ReportRowAction } from './report-queue-table';
import { ReportQueueTabs } from './report-queue-tabs';
import { ReportTableFilters } from './report-table-filters';
import { ReportTableSkeleton } from './report-table-skeleton';
import { ResolveReportDialog } from './resolve-report-dialog';

/**
 * Everything that reads the query string lives here so the page heading and
 * description can still be statically rendered around the `<Suspense>`
 * boundary (route-map §7 + Next.js `useSearchParams` build constraint).
 */
function ReportQueue() {
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');
  const tError = useTranslations();

  const { filters, page, setPage } = useReportFilters();
  const { data, isLoading, isError, isFetching, error, refetch } = useReportsList(filters);
  const resolveMutation = useResolveReport();
  const dismissMutation = useDismissReport();

  const [selectedReportId, setSelectedReportId] = useState<string | undefined>(undefined);
  const [resolveTarget, setResolveTarget] = useState<Report | undefined>(undefined);
  const [dismissTarget, setDismissTarget] = useState<Report | undefined>(undefined);

  const reports = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const handleRowAction = (action: ReportRowAction, report: Report) => {
    if (action === 'view') {
      setSelectedReportId(report.id);
      return;
    }
    if (action === 'resolve') {
      setResolveTarget(report);
      return;
    }
    setDismissTarget(report);
  };

  const handleResolveConfirm = () => {
    if (!resolveTarget) return;
    resolveMutation.mutate(resolveTarget.id, {
      onSuccess: () => {
        toast.success(t('toast.resolveSuccess'));
        setResolveTarget(undefined);
      },
      onError: (mutationError) => {
        // Stable id so a retried failure does not stack identical toasts (§9).
        toast.error(tError(getErrorMessageKey(mutationError)), { id: 'reports-resolve-error' });
      },
    });
  };

  const handleDismissConfirm = () => {
    if (!dismissTarget) return;
    dismissMutation.mutate(dismissTarget.id, {
      onSuccess: () => {
        toast.success(t('toast.dismissSuccess'));
        setDismissTarget(undefined);
      },
      onError: (mutationError) => {
        toast.error(tError(getErrorMessageKey(mutationError)), { id: 'reports-dismiss-error' });
      },
    });
  };

  return (
    <>
      <ReportQueueTabs />
      <ReportTableFilters />

      {isLoading ? (
        <ReportQueueTable status="loading" />
      ) : isError ? (
        <ReportQueueTable
          status="error"
          error={error as unknown as ApiError}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : reports.length === 0 ? (
        <ReportQueueTable status="empty" />
      ) : (
        <ReportQueueTable
          status="ready"
          reports={reports}
          page={page}
          totalPages={totalPages}
          onSelectReport={setSelectedReportId}
          onPageChange={setPage}
          onAction={handleRowAction}
        />
      )}

      {isFetching && !isLoading ? (
        <p role="status" className="sr-only">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {tCommon('status.loading')}
        </p>
      ) : null}

      {selectedReportId ? (
        <ReportDetailDialog
          reportId={selectedReportId}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedReportId(undefined);
          }}
          onResolve={setResolveTarget}
          onDismiss={setDismissTarget}
        />
      ) : null}

      {resolveTarget ? (
        <ResolveReportDialog
          report={resolveTarget}
          open
          onOpenChange={(open) => {
            if (!open) setResolveTarget(undefined);
          }}
          onConfirm={handleResolveConfirm}
          isPending={resolveMutation.isPending}
        />
      ) : null}

      {dismissTarget ? (
        <DismissReportDialog
          report={dismissTarget}
          open
          onOpenChange={(open) => {
            if (!open) setDismissTarget(undefined);
          }}
          onConfirm={handleDismissConfirm}
          isPending={dismissMutation.isPending}
        />
      ) : null}
    </>
  );
}

export function ReportsPageContent() {
  const t = useTranslations('reports');

  return (
    <section className="py-6">
      {/* Rendered on every branch so the shell never loses its page heading. */}
      <h1 className="font-display text-2xl text-card-foreground">{t('title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>

      <div className="mt-6 space-y-4">
        <Suspense fallback={<ReportTableSkeleton />}>
          <ReportQueue />
        </Suspense>
      </div>
    </section>
  );
}
