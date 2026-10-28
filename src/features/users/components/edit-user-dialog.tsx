'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { getErrorMessageKey } from '@/lib/api/error-mapper';
import { useUpdateUser } from '../hooks/use-update-user';
import {
  updateAdminUserSchema,
  type AdminUser,
  type UpdateAdminUserInput,
} from '../schemas/user.schema';

interface Props {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({ user, open, onOpenChange }: Props) {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const tError = useTranslations();
  const updateMutation = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateAdminUserInput>({
    resolver: zodResolver(updateAdminUserSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      email: user?.email || '',
      password: '',
      emailVerified: user?.emailVerified ?? false,
    },
  });

  const emailVerified = watch('emailVerified');

  useEffect(() => {
    if (user && open) {
      reset({
        displayName: user.displayName || '',
        email: user.email || '',
        password: '',
        emailVerified: user.emailVerified ?? false,
      });
    }
  }, [user, open, reset]);

  if (!user) return null;

  const isPending = isSubmitting || updateMutation.isPending;

  const onSubmit = (values: UpdateAdminUserInput) => {
    // Only send non-empty fields
    const payload: UpdateAdminUserInput = {
      displayName: values.displayName,
      email: values.email,
      emailVerified: values.emailVerified,
    };
    if (values.password && values.password.trim().length > 0) {
      payload.password = values.password;
    }

    updateMutation.mutate(
      { id: user.id, payload },
      {
        onSuccess: (updatedUser) => {
          toast.success(t('toast.userUpdated', { username: updatedUser.username }));
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(tError(getErrorMessageKey(err)), { id: 'edit-user-error' });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('editDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('editDialog.description', { username: user.username })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Field>
            <FieldLabel htmlFor="edit-displayName">{t('editDialog.displayName')}</FieldLabel>
            <Input
              id="edit-displayName"
              placeholder="e.g. John Doe"
              autoComplete="off"
              disabled={isPending}
              {...register('displayName')}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-email">{t('editDialog.email')}</FieldLabel>
            <Input
              id="edit-email"
              type="email"
              placeholder="e.g. user@example.com"
              autoComplete="off"
              disabled={isPending}
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
            {errors.email?.message ? (
              <FieldError>{t(errors.email.message.replace('users.', ''))}</FieldError>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-password">{t('editDialog.resetPassword')}</FieldLabel>
            <Input
              id="edit-password"
              type="password"
              placeholder={t('editDialog.passwordPlaceholder')}
              autoComplete="new-password"
              disabled={isPending}
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
            {errors.password?.message ? (
              <FieldError>{t(errors.password.message.replace('users.', ''))}</FieldError>
            ) : null}
          </Field>

          <div className="flex items-center space-x-2 pt-1">
            <Checkbox
              id="edit-emailVerified"
              checked={emailVerified}
              onCheckedChange={(checked) => setValue('emailVerified', Boolean(checked))}
              disabled={isPending}
            />
            <label
              htmlFor="edit-emailVerified"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              {t('editDialog.emailVerified')}
            </label>
          </div>

          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                {tCommon('action.cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {t('editDialog.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
