'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Loader2, Plus } from 'lucide-react';
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
import { useRolesList } from '@/features/rbac/hooks/use-roles-list';
import { getErrorMessageKey } from '@/lib/api/error-mapper';
import { useCreateUser } from '../hooks/use-create-user';
import { createAdminUserSchema, type CreateAdminUserInput } from '../schemas/user.schema';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_ROLES = ['ADMIN', 'MODERATOR', 'USER'] as const;

const ROLE_MESSAGE_KEYS: Record<string, 'role.admin' | 'role.moderator' | 'role.user'> = {
  ADMIN: 'role.admin',
  MODERATOR: 'role.moderator',
  USER: 'role.user',
};

const DEFAULT_VALUES: CreateAdminUserInput = {
  username: '',
  email: '',
  password: '',
  displayName: '',
  roles: ['USER'],
  emailVerified: true,
};

export function CreateUserDialog({ open, onOpenChange }: Props) {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const tError = useTranslations();
  const { data: allRolesData } = useRolesList();
  const createMutation = useCreateUser();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateAdminUserInput>({
    resolver: zodResolver(createAdminUserSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const emailVerified = watch('emailVerified');
  const selectedRoles = watch('roles') ?? ['USER'];

  const availableRoles = useMemo(() => {
    if (allRolesData && allRolesData.length > 0) {
      return allRolesData.map((r) => r.name);
    }
    return [...DEFAULT_ROLES];
  }, [allRolesData]);

  const roleLabel = (role: string) =>
    role in ROLE_MESSAGE_KEYS ? t(ROLE_MESSAGE_KEYS[role]) : role;

  const toggleRole = (role: string) => {
    if (role === 'USER') return;
    const next = selectedRoles.includes(role)
      ? selectedRoles.filter((r) => r !== role)
      : [...selectedRoles, role];
    setValue('roles', next);
  };

  useEffect(() => {
    if (open) {
      reset(DEFAULT_VALUES);
    }
  }, [open, reset]);

  const isPending = isSubmitting || createMutation.isPending;

  const onSubmit = (values: CreateAdminUserInput) => {
    createMutation.mutate(values, {
      onSuccess: (createdUser) => {
        toast.success(t('toast.userCreated', { username: createdUser.username }));
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(tError(getErrorMessageKey(err)), { id: 'create-user-error' });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('createDialog.title')}</DialogTitle>
          <DialogDescription>{t('createDialog.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Field>
            <FieldLabel htmlFor="create-username">{t('createDialog.username')}</FieldLabel>
            <Input
              id="create-username"
              placeholder="e.g. john_doe"
              autoComplete="off"
              disabled={isPending}
              aria-invalid={Boolean(errors.username)}
              {...register('username')}
            />
            {errors.username?.message ? (
              <FieldError>{t(errors.username.message.replace('users.', ''))}</FieldError>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="create-email">{t('createDialog.email')}</FieldLabel>
            <Input
              id="create-email"
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
            <FieldLabel htmlFor="create-password">{t('createDialog.password')}</FieldLabel>
            <Input
              id="create-password"
              type="password"
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              disabled={isPending}
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
            {errors.password?.message ? (
              <FieldError>{t(errors.password.message.replace('users.', ''))}</FieldError>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="create-displayName">{t('createDialog.displayName')}</FieldLabel>
            <Input
              id="create-displayName"
              placeholder="e.g. John Doe"
              autoComplete="off"
              disabled={isPending}
              {...register('displayName')}
            />
          </Field>

          <div className="space-y-2">
            <FieldLabel>{t('createDialog.roles')}</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {availableRoles.map((role) => {
                const isSelected = selectedRoles.includes(role);
                const isBase = role === 'USER';
                return (
                  <Button
                    key={role}
                    type="button"
                    size="sm"
                    variant={isSelected ? 'default' : 'outline'}
                    disabled={isPending || isBase}
                    onClick={() => toggleRole(role)}
                    className="h-7 text-xs gap-1"
                  >
                    {isSelected ? (
                      <Check className="size-3" aria-hidden />
                    ) : (
                      <Plus className="size-3" aria-hidden />
                    )}
                    {roleLabel(role)}
                  </Button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">{t('createDialog.rolesHint')}</p>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <Checkbox
              id="create-emailVerified"
              checked={emailVerified}
              onCheckedChange={(checked) => setValue('emailVerified', Boolean(checked))}
              disabled={isPending}
            />
            <label
              htmlFor="create-emailVerified"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              {t('createDialog.emailVerified')}
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
              {t('createDialog.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
