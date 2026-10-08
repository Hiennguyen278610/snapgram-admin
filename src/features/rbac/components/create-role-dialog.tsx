'use client';

import { useEffect } from 'react';
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
import { useCreateRole } from '../hooks/use-create-role';
import {
  createRoleSchema,
  isRoleFieldErrorKey,
  type CreateRoleFormValues,
  type CreateRolePayload,
} from '../schemas/role.schema';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_VALUES: CreateRoleFormValues = { name: '', description: '' };

function resolveFieldError(
  message: string | undefined,
  t: (key: string) => string
): string | undefined {
  if (!message) return undefined;
  return isRoleFieldErrorKey(message) ? t(message) : message;
}

export function CreateRoleDialog({ open, onOpenChange }: Props) {
  const t = useTranslations('rbac');
  const tCommon = useTranslations('common');
  // Root-scoped so the resolver can resolve full-path validation keys
  // (e.g. `rbac.error.namePattern`) emitted by `createRoleSchema`.
  const tError = useTranslations();
  const createMutation = useCreateRole();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoleFormValues>({
    resolver: zodResolver(createRoleSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!open) reset(EMPTY_VALUES);
  }, [open, reset]);

  const pending = createMutation.isPending || isSubmitting;

  const onSubmit = (values: CreateRolePayload) => {
    createMutation.mutate(
      { ...values, permissionIds: [] },
      {
        onSuccess: (role) => {
          toast.success(t('toast.created', { name: role.name }));
          reset(EMPTY_VALUES);
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(t('error.createFailed'), {
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
          <DialogTitle>{t('action.create')}</DialogTitle>
          <DialogDescription>{t('form.createDescription')}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="rbac-role-name">{t('form.name')}</FieldLabel>
            <Input
              id="rbac-role-name"
              placeholder={t('form.namePlaceholder')}
              aria-invalid={!!errors.name}
              disabled={pending}
              {...register('name')}
            />
            <FieldError errors={[{ message: nameError }]} />
          </Field>

          <Field data-invalid={!!errors.description}>
            <FieldLabel htmlFor="rbac-role-description">{t('form.description')}</FieldLabel>
            <Textarea
              id="rbac-role-description"
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
