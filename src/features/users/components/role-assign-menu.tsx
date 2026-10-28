'use client';

import { useMemo, useState } from 'react';
import { Loader2, ShieldCheck, ShieldMinus } from 'lucide-react';
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
import { useRolesList } from '@/features/rbac/hooks/use-roles-list';
import { getErrorMessageKey } from '@/lib/api/error-mapper';
import type { ApiError } from '@/lib/api/types';
import { useAssignRole } from '../hooks/use-assign-role';
import { useRemoveRole } from '../hooks/use-remove-role';
import { useUserDetail } from '../hooks/use-user-detail';
import type { AdminUser } from '../schemas/user.schema';

interface Props {
  user: AdminUser;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_ROLES = ['ADMIN', 'MODERATOR', 'USER'] as const;

const ROLE_MESSAGE_KEYS: Record<string, 'role.admin' | 'role.moderator' | 'role.user'> = {
  ADMIN: 'role.admin',
  MODERATOR: 'role.moderator',
  USER: 'role.user',
};

export function RoleAssignMenu({ user, onOpenChange }: Props) {
  const t = useTranslations('users');
  const tError = useTranslations();
  const tCommon = useTranslations('common');
  const { data: liveUser } = useUserDetail(user.id);
  const currentUser = liveUser ?? user;

  const { data: allRolesData } = useRolesList();
  const assignMutation = useAssignRole();
  const removeMutation = useRemoveRole();
  const [error, setError] = useState<ApiError | null>(null);

  const currentRoles = useMemo(() => currentUser.roles ?? [], [currentUser.roles]);
  const isBusy = assignMutation.isPending || removeMutation.isPending;

  const availableRoles = useMemo(() => {
    if (allRolesData && allRolesData.length > 0) {
      return allRolesData.map((r) => r.name);
    }
    return [...DEFAULT_ROLES];
  }, [allRolesData]);

  const assignableRoles = useMemo(
    () => availableRoles.filter((role) => !currentRoles.includes(role)),
    [availableRoles, currentRoles]
  );

  const roleLabel = (role: string) =>
    role in ROLE_MESSAGE_KEYS ? t(ROLE_MESSAGE_KEYS[role]) : role;

  const runAssign = (role: string) => {
    setError(null);
    assignMutation.mutate(
      { id: currentUser.id, role },
      {
        onSuccess: () => toast.success(t('toast.roleAssigned')),
        onError: (mutationError) => setError(mutationError),
      }
    );
  };

  const runRemove = (role: string) => {
    setError(null);
    removeMutation.mutate(
      { id: currentUser.id, role },
      {
        onSuccess: () => toast.success(t('toast.roleRemoved')),
        onError: (mutationError) => setError(mutationError),
      }
    );
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('action.assignRole')}</DialogTitle>
          <DialogDescription>{t('action.rolesFor', { username: user.username })}</DialogDescription>
        </DialogHeader>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {tError(getErrorMessageKey(error))}
          </p>
        ) : null}

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-card-foreground">{t('action.currentRoles')}</p>
            {currentRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('action.noRoles')}</p>
            ) : (
              <ul className="space-y-2">
                {currentRoles.map((role) => (
                  <li
                    key={role}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <span className="text-sm text-card-foreground">{roleLabel(role)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isBusy}
                      aria-label={`${t('action.removeRole')} ${roleLabel(role)}`}
                      onClick={() => runRemove(role)}
                    >
                      {removeMutation.isPending && removeMutation.variables?.role === role ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <ShieldMinus className="size-4" aria-hidden />
                      )}
                      {t('action.removeRole')}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-card-foreground">{t('action.assignRole')}</p>
            <div className="flex flex-wrap gap-2">
              {assignableRoles.map((role) => {
                const isPendingForRole =
                  assignMutation.isPending && assignMutation.variables?.role === role;

                return (
                  <Button
                    key={role}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => runAssign(role)}
                  >
                    {isPendingForRole ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <ShieldCheck className="size-4" aria-hidden />
                    )}
                    {roleLabel(role)}
                  </Button>
                );
              })}
              {assignableRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('action.noRolesAvailable')}</p>
              ) : null}
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {tCommon('action.close')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
