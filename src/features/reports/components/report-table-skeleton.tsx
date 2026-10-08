'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Props {
  rows?: number;
}

const DEFAULT_ROWS = 5;

/**
 * Skeleton for `ReportQueueTable`. Keeps the 7-column grid of the loaded queue
 * so swapping in real data causes no layout shift, and doubles as the
 * `<Suspense>` fallback for the URL-driven part of the page (route-map §7).
 */
export function ReportTableSkeleton({ rows = DEFAULT_ROWS }: Props) {
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');

  return (
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
        <TableBody role="status" aria-busy="true" aria-label={tCommon('status.loading')}>
          {Array.from({ length: rows }, (_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-3 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-3 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-3 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-3 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20 rounded-4xl" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-3 w-28" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto size-7 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
