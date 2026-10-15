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
 * Two-step confirm for dismissing a report (conventions §8 › destructive
 * modal): rose confirm button, no backdrop dismissal, Escape blocked while the
 * request is in flight. The toast is raised by the page that owns the mutation.
 *
 * BI-008: returns `null` when the report is no longer actionable
 * (defense-in-depth; the backend also rejects the transition with 409).
 */
export function DismissReportDialog({ report, open, onOpenChange, onConfirm, isPending }: Props) {
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
          <AlertDialogTitle>{t('action.dismissConfirm')}</AlertDialogTitle>
          <AlertDialogDescription>{t('action.dismissDescription')}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{tCommon('action.cancel')}</AlertDialogCancel>
          <Button
            type="button"
            disabled={isPending}
            className="bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700"
            onClick={onConfirm}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {t('action.dismiss')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
