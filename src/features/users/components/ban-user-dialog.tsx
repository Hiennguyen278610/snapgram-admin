'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { banUserSchema, type AdminUser, type BanUserInput } from '../schemas/user.schema';

interface Props {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

/**
 * The ban schema carries i18n keys as messages so the contract stays in one
 * place; this resolves them at render time. Anything that is not one of our
 * keys (a raw zod fallback message) is passed through untouched.
 */
const FIELD_ERROR_PREFIX = 'users.form.';

function resolveFieldError(
  message: string | undefined,
  t: (key: string) => string
): string | undefined {
  if (!message) return undefined;
  return message.startsWith(FIELD_ERROR_PREFIX) ? t(message) : message;
}

/**
 * Destructive confirm dialog (conventions.md §8): two-step confirmation, rose
 * confirm button, no dismiss on backdrop click or Escape while submitting.
 */
export function BanUserDialog({ user, open, onOpenChange, onConfirm, isPending }: Props) {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  // Root-scoped so the resolver can resolve full-path validation keys
  // (e.g. `users.form.reasonRequired`) emitted by `banUserSchema`.
  const tRoot = useTranslations();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BanUserInput>({
    resolver: zodResolver(banUserSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { reason: '' },
  });

  const reasonError = resolveFieldError(errors.reason?.message, tRoot);

  useEffect(() => {
    if (!open) reset({ reason: '' });
  }, [open, reset]);

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
            {t('action.banConfirm', { username: user.displayName ?? user.username })}
          </AlertDialogTitle>
          <AlertDialogDescription>{t('action.banDescription')}</AlertDialogDescription>
        </AlertDialogHeader>

        <form
          className="space-y-4"
          noValidate
          onSubmit={handleSubmit((values) => onConfirm(values.reason))}
        >
          <Field data-invalid={!!errors.reason}>
            <FieldLabel htmlFor="ban-reason">{t('action.reason')}</FieldLabel>
            <Textarea
              id="ban-reason"
              placeholder={t('action.reasonPlaceholder')}
              aria-invalid={!!errors.reason}
              disabled={isPending}
              {...register('reason')}
            />
            <FieldError errors={[reasonError ? { message: reasonError } : undefined]} />
          </Field>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{tCommon('action.cancel')}</AlertDialogCancel>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {tCommon('action.confirm')}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
