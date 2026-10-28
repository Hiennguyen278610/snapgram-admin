'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { PaymentOrder } from '../schemas/payment.schema';

interface Props {
  payment: PaymentOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function PaymentReconcileDialog({
  payment,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: Props) {
  const t = useTranslations('payments.reconcileDialog');
  const tCommon = useTranslations('common');

  if (!payment) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        size="sm"
        onEscapeKeyDown={(event) => {
          if (isPending) event.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('description', { orderId: payment.orderId })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{tCommon('action.cancel')}</AlertDialogCancel>
          <Button type="button" disabled={isPending} onClick={onConfirm}>
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {t('confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
