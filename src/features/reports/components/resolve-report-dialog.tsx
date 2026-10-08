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
import { isModeratableStatus, type Report } from '../schemas/report.schema';

interface Props {
  report: Report;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

/**
 * Two-step confirm for resolving a report (conventions §8). The toast is raised
 * by the page that owns the mutation, so this dialog stays presentational.
 *
 * BI-008: returns `null` when the report is no longer actionable — `RESOLVED`
 * and `DISMISSED` reports are read-only.
 */
export function ResolveReportDialog({ report, open, onOpenChange, onConfirm, isPending }: Props) {
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');

  if (!isModeratableStatus(report.status)) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        size="sm"
        onEscapeKeyDown={(event) => {
          if (isPending) event.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{t('action.resolveConfirm')}</AlertDialogTitle>
          <AlertDialogDescription>{t('action.resolveDescription')}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{tCommon('action.cancel')}</AlertDialogCancel>
          <Button type="button" disabled={isPending} onClick={onConfirm}>
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {t('action.resolve')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
