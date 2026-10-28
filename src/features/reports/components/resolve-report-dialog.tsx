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

  const isUserReport = report.targetType === 'USER';
  const targetUsername = report.targetAuthorUsername || report.targetId.slice(0, 8);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        size="sm"
        onEscapeKeyDown={(event) => {
          if (isPending) event.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isUserReport
              ? t('action.resolveUserConfirm', { username: targetUsername })
              : t('action.resolveConfirm')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isUserReport ? t('action.resolveUserDescription') : t('action.resolveDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isUserReport ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
            {t('action.resolveUserWarning')}
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{tCommon('action.cancel')}</AlertDialogCancel>
          <Button
            type="button"
            variant={isUserReport ? 'destructive' : 'default'}
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {isUserReport ? t('action.resolveUser') : t('action.resolve')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
