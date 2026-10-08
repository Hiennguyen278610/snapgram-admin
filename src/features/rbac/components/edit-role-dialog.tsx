'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessageKey } from '@/lib/api/error-mapper';
import { useUpdateRole } from '../hooks/use-update-role';
import {
  isRoleFieldErrorKey,
  updateRoleSchema,
  type RoleDetail,
  type UpdateRoleInput,
} from '../schemas/role.schema';

interface Props {
  role: RoleDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function resolveFieldError(
  message: string | undefined,
  t: (key: string) => string
): string | undefined {
  if (!message) return undefined;
  return isRoleFieldErrorKey(message) ? t(message) : message;
}

export function EditRoleDialog({ role, open, onOpenChange }: Props) {
  const t = useTranslations('rbac');
  const tCommon = useTranslations('common');
  const tError = useTranslations();
  const updateMutation = useUpdateRole();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateRoleInput>({
    resolver: zodResolver(updateRoleSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { name: role.name, description: role.description ?? '' },
  });

  // System roles are read-only (backend answers 403); never render the form.
  if (role.system === true) return null;

  const pending = updateMutation.isPending || isSubmitting;

  const onSubmit = (values: UpdateRoleInput) => {
    updateMutation.mutate(
      { id: role.id, payload: values },
      {
        onSuccess: (updated) => {
          toast.success(t('toast.updated', { name: updated.name }));
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(t('error.updateFailed'), {
            description: tError(getErrorMessageKey(error)),
          });
        },
      }
    );
  };

  const nameError = resolveFieldError(errors.name?.message, tError);
  const descriptionError = resolveFieldError(errors.description?.message, tError);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('action.edit')}</DialogTitle>
          <DialogDescription>{t('form.editDescription', { name: role.name })}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="rbac-edit-role-name">{t('form.name')}</FieldLabel>
            <Input
              id="rbac-edit-role-name"
              placeholder={t('form.namePlaceholder')}
              aria-invalid={!!errors.name}
              disabled={pending}
              {...register('name')}
            />
            <FieldError errors={[{ message: nameError }]} />
          </Field>

          <Field data-invalid={!!errors.description}>
            <FieldLabel htmlFor="rbac-edit-role-description">{t('form.description')}</FieldLabel>
            <Textarea
              id="rbac-edit-role-description"
              placeholder={t('form.descriptionPlaceholder')}
              aria-invalid={!!errors.description}
              disabled={pending}
              {...register('description')}
            />
            <FieldError errors={[{ message: descriptionError }]} />
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                {tCommon('action.cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {tCommon('action.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
