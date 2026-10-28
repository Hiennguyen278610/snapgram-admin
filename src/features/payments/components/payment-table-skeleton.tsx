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

export function PaymentTableSkeleton({ rows = DEFAULT_ROWS }: Props) {
  const t = useTranslations('payments.table');
  const tCommon = useTranslations('common');

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>{t('orderId')}</TableHead>
            <TableHead>{t('product')}</TableHead>
            <TableHead>{t('amount')}</TableHead>
            <TableHead>{t('status')}</TableHead>
            <TableHead>{t('createdAt')}</TableHead>
            <TableHead>{t('expiresAt')}</TableHead>
            <TableHead className="text-right">{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody role="status" aria-busy="true" aria-label={tCommon('status.loading')}>
          {Array.from({ length: rows }, (_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-8 w-20 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
