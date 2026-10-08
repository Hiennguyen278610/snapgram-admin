'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';

interface Props {
  rows?: number;
}

const DEFAULT_ROWS = 5;

/**
 * Skeleton for `RoleDataTable`. Keeps the 5-column grid of the loaded table so
 * swapping in real data causes no layout shift (brief §5).
 */
export function RoleTableSkeleton({ rows = DEFAULT_ROWS }: Props) {
  const t = useTranslations('common');

  return (
    <TableBody role="status" aria-busy="true" aria-label={t('status.loading')}>
      {Array.from({ length: rows }, (_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton className="h-3 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3 w-56" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3 w-10" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-4xl" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto size-7 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}
