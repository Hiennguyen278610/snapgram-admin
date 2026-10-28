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
import { useDeleteUser } from '../hooks/use-delete-user';
import type { AdminUser } from '../schemas/user.schema';

interface Props {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteUserDialog({ user, open, onOpenChange }: Props) {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const tError = useTranslations();
  const deleteMutation = useDeleteUser();

  if (!user) return null;

  const isPending = deleteMutation.isPending;

  const onConfirm = () => {
    deleteMutation.mutate(user.id, {
      onSuccess: () => {
        toast.success(t('toast.userDeleted', { username: user.username }));
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(tError(getErrorMessageKey(err)), { id: 'delete-user-error' });
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
          <AlertDialogTitle>
            {t('deleteDialog.title', { username: user.username })}
          </AlertDialogTitle>
          <AlertDialogDescription>{t('deleteDialog.description')}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{tCommon('action.cancel')}</AlertDialogCancel>
          <Button type="button" variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {t('deleteDialog.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
