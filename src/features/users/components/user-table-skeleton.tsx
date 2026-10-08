'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';

interface Props {
  rows?: number;
}

const DEFAULT_ROWS = 5;

/**
 * Skeleton for `UserDataTable`. Keeps the 6-column grid of the loaded table so
 * swapping in real data causes no layout shift (component-inventory.md §1.5).
 */
export function UserTableSkeleton({ rows = DEFAULT_ROWS }: Props) {
  const t = useTranslations('common');

  return (
    <TableBody role="status" aria-busy="true" aria-label={t('status.loading')}>
      {Array.from({ length: rows }, (_, index) => (
        <TableRow key={index}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-3 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="size-8 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}
