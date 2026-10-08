'use client';

import { AlertCircle, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type { Locale } from '@/i18n/routing';
import { getErrorMessageKey } from '@/lib/api/error-mapper';
import type { ApiError } from '@/lib/api/types';
import { formatDateTime, formatNumber } from '@/lib/i18n/format';
import { usePermissionsList } from '../hooks/use-permissions-list';
import { useRoleDetail } from '../hooks/use-role-detail';
import { PermissionMatrix } from './permission-matrix';

interface Props {
  roleId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm text-card-foreground">{children}</span>
    </div>
  );
}

export function RoleDetailDialog({ roleId, open, onOpenChange }: Props) {
  const t = useTranslations('rbac');
  const tCommon = useTranslations('common');
  const tError = useTranslations();
  const locale = useLocale() as Locale;

  const roleQuery = useRoleDetail(roleId);
  const permissionsQuery = usePermissionsList();

  const role = roleQuery.data;
  const permissions = permissionsQuery.data;
  const isLoading = roleQuery.isLoading || permissionsQuery.isLoading;
  const isError = roleQuery.isError || permissionsQuery.isError;
  const error = (roleQuery.error ?? permissionsQuery.error) as ApiError | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl"
      >
        <DialogHeader className="border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle>{t('detail.title')}</DialogTitle>
              <DialogDescription>{role ? role.name : tCommon('status.loading')}</DialogDescription>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label={tCommon('action.close')}>
                <X className="size-4" aria-hidden />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="p-4">
          {isLoading ? (
            <div
              className="space-y-4"
              role="status"
              aria-busy="true"
              aria-label={t('detail.loading')}
            >
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : isError ? (
            <div className="text-center">
              <AlertCircle
                className="mx-auto size-6 text-rose-600 dark:text-rose-400"
                aria-hidden
              />
              <p className="mt-3 text-sm text-muted-foreground">
                {error ? tError(getErrorMessageKey(error)) : tError('error.unknown')}
              </p>
              <Button
                type="button"
                className="mt-4"
                onClick={() => {
                  void roleQuery.refetch();
                  void permissionsQuery.refetch();
                }}
              >
                {tCommon('action.retry')}
              </Button>
            </div>
          ) : !role ? (
            <p className="text-sm text-muted-foreground">{t('detail.notFound')}</p>
          ) : (
            <div className="space-y-5">
              <div className="divide-y divide-border">
                <DetailRow label={t('table.column.name')}>
                  <span className="font-medium">{role.name}</span>
                </DetailRow>
                <DetailRow label={t('table.column.description')}>
                  {role.description ? role.description : t('table.noDescription')}
                </DetailRow>
                <DetailRow label={t('detail.users')}>
                  {formatNumber(role.userCount, locale)}
                </DetailRow>
                <DetailRow label={t('table.column.system')}>
                  <Badge variant="outline">
                    {role.system === true ? t('role.system') : t('role.custom')}
                  </Badge>
                </DetailRow>
                {role.createdAt ? (
                  <DetailRow label={t('detail.created')}>
                    <time dateTime={role.createdAt}>{formatDateTime(role.createdAt, locale)}</time>
                  </DetailRow>
                ) : null}
                {role.updatedAt ? (
                  <DetailRow label={t('detail.updated')}>
                    <time dateTime={role.updatedAt}>{formatDateTime(role.updatedAt, locale)}</time>
                  </DetailRow>
                ) : null}
              </div>

              <Separator />

              <div className="space-y-3">
                {role.system === true ? (
                  <p className="text-xs text-muted-foreground">{t('role.systemHint')}</p>
                ) : null}

                <PermissionMatrix
                  key={role.id}
                  roleId={role.id}
                  permissions={permissions ?? {}}
                  selectedIds={role.permissions.map((permission) => permission.id)}
                  disabled={role.system === true}
                  onSaved={() => {
                    void roleQuery.refetch();
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
