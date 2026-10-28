'use client';

import { ChevronLeft, ChevronRight, Eye, MoreHorizontal, ShieldCheck, XCircle } from 'lucide-react';
import { usePermission } from '@/features/auth/hooks/use-permission';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Locale } from '@/i18n/routing';
import type { ApiError } from '@/lib/api/types';
import { formatDateTime } from '@/lib/i18n/format';
import { isModeratableStatus, type Report } from '../schemas/report.schema';
import { ReportStatusBadge } from './report-status-badge';
import { ReportTableSkeleton } from './report-table-skeleton';
import { ReportTargetBadge } from './report-target-badge';
import { ReportsEmpty } from './reports-empty';
import { ReportsError } from './reports-error';

export type ReportRowAction = 'view' | 'resolve' | 'dismiss';

const ID_PREVIEW_LENGTH = 8;

function shortId(value: string): string {
  return value.slice(0, ID_PREVIEW_LENGTH);
}

interface ReportActionMenuProps {
  report: Report;
  onAction: (action: ReportRowAction, report: Report) => void;
}

function ReportActionMenu({ report, onAction }: ReportActionMenuProps) {
  const t = useTranslations('reports');
  const { isAdmin, hasPermission } = usePermission();
  const canModerate = isAdmin || hasPermission('REPORT:RESOLVE') || hasPermission('REPORT:DISMISS');

  // BI-008: RESOLVED / DISMISSED are read-only — the backend has no status
  // guard, so the UI is the only thing preventing a broken transition.
  const moderatable = isModeratableStatus(report.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('action.openMenu')}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuLabel className="font-normal text-muted-foreground">
          {shortId(report.id)}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onAction('view', report)}>
          <Eye className="size-4" aria-hidden />
          {t('action.view')}
        </DropdownMenuItem>
        {canModerate ? (
          <>
            <DropdownMenuItem
              disabled={!moderatable}
              title={!moderatable ? t('detail.actionBlocked') : undefined}
              onSelect={() => onAction('resolve', report)}
            >
              <ShieldCheck className="size-4" aria-hidden />
              {t('action.resolve')}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={!moderatable}
              title={!moderatable ? t('detail.actionBlocked') : undefined}
              onSelect={() => onAction('dismiss', report)}
            >
              <XCircle className="size-4" aria-hidden />
              {t('action.dismiss')}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ReadyProps {
  status: 'ready';
  reports: Report[];
  page: number;
  totalPages: number;
  onSelectReport: (id: string) => void;
  onPageChange: (page: number) => void;
  onAction: (action: ReportRowAction, report: Report) => void;
}

interface LoadingProps {
  status: 'loading';
}

interface EmptyProps {
  status: 'empty';
}

interface ErrorProps {
  status: 'error';
  error: ApiError | null;
  onRetry: () => void;
}

export type ReportQueueTableProps = ReadyProps | LoadingProps | EmptyProps | ErrorProps;

/**
 * Explicit status variants instead of a pile of `isLoading`/`isError`/`isEmpty`
 * booleans (vercel-composition-patterns › avoid boolean prop proliferation).
 */
export function ReportQueueTable(props: ReportQueueTableProps) {
  const t = useTranslations('reports');
  const locale = useLocale() as Locale;

  if (props.status === 'loading') return <ReportTableSkeleton />;
  if (props.status === 'empty') return <ReportsEmpty />;
  if (props.status === 'error') return <ReportsError error={props.error} onRetry={props.onRetry} />;

  const { reports, page, totalPages, onSelectReport, onPageChange, onAction } = props;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>{t('table.column.id')}</TableHead>
              <TableHead>{t('table.column.target')}</TableHead>
              <TableHead>{t('table.column.reporter')}</TableHead>
              <TableHead>{t('table.column.reason')}</TableHead>
              <TableHead>{t('table.column.status')}</TableHead>
              <TableHead>{t('table.column.created')}</TableHead>
              <TableHead className="text-right">{t('table.column.actions')}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {reports.map((report) => (
              <TableRow
                key={report.id}
                tabIndex={0}
                className="cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                onClick={() => onSelectReport(report.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectReport(report.id);
                  }
                }}
              >
                <TableCell>
                  <span className="font-mono text-xs text-card-foreground" title={report.id}>
                    {shortId(report.id)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ReportTargetBadge targetType={report.targetType} />
                    <span
                      className="max-w-32 truncate font-mono text-xs text-muted-foreground"
                      title={report.targetId}
                    >
                      {report.targetId}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className="block max-w-40 truncate font-mono text-xs text-muted-foreground"
                    title={report.reporterId}
                  >
                    {report.reporterId}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className="block max-w-56 truncate text-sm text-card-foreground"
                    title={report.reason}
                  >
                    {report.reason}
                  </span>
                </TableCell>
                <TableCell>
                  <ReportStatusBadge status={report.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <time dateTime={report.createdAt}>
                    {formatDateTime(report.createdAt, locale)}
                  </time>
                </TableCell>
                <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                  <ReportActionMenu report={report} onAction={onAction} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <p className="px-2 text-sm text-muted-foreground">
                {t('pagination.pageLabel', { page: page + 1, total: totalPages })}
              </p>
            </PaginationItem>
            <PaginationItem>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 0}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft className="size-4" aria-hidden />
                {t('pagination.previous')}
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => onPageChange(page + 1)}
              >
                {t('pagination.next')}
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
