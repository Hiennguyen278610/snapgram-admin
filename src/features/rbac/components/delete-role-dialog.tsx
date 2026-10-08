'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
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
import { useDeleteRole } from '../hooks/use-delete-role';
import type { RoleDetail } from '../schemas/role.schema';

interface Props {
  role: RoleDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Destructive confirm dialog (conventions.md §8): two-step confirmation, rose
 * confirm button, no dismiss on backdrop click or Escape while submitting.
 * System roles are read-only, so they never render this dialog.
 */
export function DeleteRoleDialog({ role, open, onOpenChange }: Props) {
  const t = useTranslations('rbac');
  const tCommon = useTranslations('common');
  const tError = useTranslations();
  const deleteMutation = useDeleteRole();

  if (role.system === true) return null;

  const isPending = deleteMutation.isPending;

  const onConfirm = () => {
    deleteMutation.mutate(role.id, {
      onSuccess: () => {
        toast.success(t('toast.deleted', { name: role.name }));
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(t('error.deleteFailed'), {
          description: tError(getErrorMessageKey(error)),
        });
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        size="sm"
        onEscapeKeyDown={(event) => {
          if (isPending) event.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteDialog.title', { name: role.name })}</AlertDialogTitle>
          <AlertDialogDescription>{t('deleteDialog.description')}</AlertDialogDescription>
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
            {tCommon('action.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
