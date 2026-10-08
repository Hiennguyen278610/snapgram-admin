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
import { getErrorMessageKey } from '@/lib/api/error-mapper';
import type { ApiError } from '@/lib/api/types';
import type { Media } from '../schemas/media.schema';

interface Props {
  media: Media;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  error?: ApiError | null;
}

/**
 * Two-step destructive confirm for `DELETE /api/media/{id}` (conventions §8 ›
 * Destructive Modal). Flat `bg-rose-600` solid — NO gradient (absolute-rules
 * Rule 2). The page owns the mutation and the success toast.
 */
export function MediaDeleteDialog({
  media,
  open,
  onOpenChange,
  onConfirm,
  isPending,
  error,
}: Props) {
  const t = useTranslations('media');
  const tCommon = useTranslations('common');
  const tError = useTranslations();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        size="sm"
        onEscapeKeyDown={(event) => {
          if (isPending) event.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-rose-600 dark:text-rose-400">
            {t('deleteDialog.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>{t('deleteDialog.description')}</AlertDialogDescription>
        </AlertDialogHeader>

        <p className="truncate font-mono text-xs text-muted-foreground" title={media.id}>
          {media.id}
        </p>

        {error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400">
            {tError(getErrorMessageKey(error))}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{tCommon('action.cancel')}</AlertDialogCancel>
          <Button
            type="button"
            className="bg-rose-600 text-white hover:bg-rose-700"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {t('deleteDialog.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
