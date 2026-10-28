'use client';

import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
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
import { formatCurrency, formatDateTime } from '@/lib/i18n/format';
import type { PaymentOrder } from '../schemas/payment.schema';
import { PaymentStatusBadge } from './payment-status-badge';

interface Props {
  data: PaymentOrder[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onReconcile: (payment: PaymentOrder) => void;
}

export function PaymentDataTable({ data, page, totalPages, onPageChange, onReconcile }: Props) {
  const t = useTranslations('payments.table');
  const tProducts = useTranslations('payments.products');
  const tAction = useTranslations('payments.action');
  const locale = useLocale() as Locale;

  const resolveProductName = (code: string) => {
    if (code === 'BLUE_TICK') {
      return tProducts('BLUE_TICK');
    }
    return code;
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <p className="text-base font-medium text-foreground">{t('empty')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('emptyDescription')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="font-mono text-xs">{t('orderId')}</TableHead>
              <TableHead>{t('product')}</TableHead>
              <TableHead>{t('amount')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('createdAt')}</TableHead>
              <TableHead>{t('expiresAt')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((order) => (
              <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                <TableCell
                  className="font-mono text-xs text-muted-foreground"
                  title={order.orderId}
                >
                  {order.orderId}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {resolveProductName(order.productCode)}
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  {formatCurrency(order.amount, order.currency, locale)}
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(order.createdAt, locale)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {order.expiresAt ? formatDateTime(order.expiresAt, locale) : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={order.status === 'SUCCESS'}
                    onClick={() => onReconcile(order)}
                    title={order.status === 'SUCCESS' ? undefined : tAction('reconcile')}
                  >
                    <RefreshCw className="size-3.5" aria-hidden />
                    <span>{tAction('reconcile')}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <Pagination>
          <PaginationContent className="justify-end">
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 0}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 text-xs text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
