'use client';

import { Suspense, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { getErrorMessageKey } from '@/lib/api/error-mapper';
import { Button } from '@/components/ui/button';
import { usePaymentFilters } from '../hooks/use-payment-filters';
import { usePaymentsList } from '../hooks/use-payments-list';
import { useReconcilePayment } from '../hooks/use-reconcile-payment';
import type { PaymentOrder } from '../schemas/payment.schema';
import { AccessDeniedCard } from '@/components/layout/access-denied-card';
import { usePermission } from '@/features/auth/hooks/use-permission';
import { PaymentDataTable } from './payment-data-table';
import { PaymentReconcileDialog } from './payment-reconcile-dialog';
import { PaymentTableFilters } from './payment-table-filters';
import { PaymentTableSkeleton } from './payment-table-skeleton';

function PaymentsTableContainer() {
  const t = useTranslations('payments');
  const tError = useTranslations();
  const tCommon = useTranslations('common');

  const { filters, page, setPage } = usePaymentFilters();
  const { data, isLoading, isError, isFetching, refetch } = usePaymentsList(filters);
  const reconcileMutation = useReconcilePayment();

  const [reconcileTarget, setReconcileTarget] = useState<PaymentOrder | null>(null);

  const payments = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const handleReconcileConfirm = () => {
    if (!reconcileTarget) return;
    reconcileMutation.mutate(reconcileTarget.orderId, {
      onSuccess: () => {
        toast.success(t('toast.reconcileSuccess'));
        setReconcileTarget(null);
      },
      onError: (err) => {
        toast.error(tError(getErrorMessageKey(err)), { id: 'payment-reconcile-error' });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PaymentTableFilters />
        {isFetching && !isLoading ? (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            <span>{tCommon('status.loading')}</span>
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <PaymentTableSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <p className="text-sm font-medium text-destructive">{t('error.loadFailed')}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => void refetch()}
          >
            {tCommon('action.retry')}
          </Button>
        </div>
      ) : (
        <PaymentDataTable
          data={payments}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onReconcile={(p) => setReconcileTarget(p)}
        />
      )}

      <PaymentReconcileDialog
        payment={reconcileTarget}
        open={Boolean(reconcileTarget)}
        onOpenChange={(open) => {
          if (!open) setReconcileTarget(null);
        }}
        onConfirm={handleReconcileConfirm}
        isPending={reconcileMutation.isPending}
      />
    </div>
  );
}

export function PaymentsPageContent() {
  const t = useTranslations('payments');
  const { hasPermission, isLoading } = usePermission();

  if (!isLoading && !hasPermission('PAYMENT:READ')) {
    return <AccessDeniedCard />;
  }

  return (
    <section className="py-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl text-card-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <Suspense fallback={<PaymentTableSkeleton />}>
        <PaymentsTableContainer />
      </Suspense>
    </section>
  );
}
