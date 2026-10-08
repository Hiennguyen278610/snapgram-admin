'use client';

import { AlertCircle, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import type { Locale } from '@/i18n/routing';
import { getErrorMessageKey } from '@/lib/api/error-mapper';
import type { ApiError } from '@/lib/api/types';
import { formatDateTime } from '@/lib/i18n/format';
import { useUserDetail } from '../hooks/use-user-detail';
import type { AdminUser } from '../schemas/user.schema';
import { UserStatusBadge } from './user-status-badge';

interface Props {
  userId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions?: React.ReactNode;
}

function initialOf(user: AdminUser): string {
  const source = user.displayName ?? user.username;
  return source.charAt(0).toUpperCase();
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm text-card-foreground">{children}</span>
    </div>
  );
}

export function UserDetailDrawer({ userId, open, onOpenChange, actions }: Props) {
  const t = useTranslations('users');
  const tError = useTranslations();
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const { data: user, isLoading, isError, error, refetch } = useUserDetail(userId);
  const apiError = error as unknown as ApiError | null;

  const roles = user?.roles ?? (user?.role ? [user.role] : []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full overflow-y-auto p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle>{t('detail.title')}</SheetTitle>
              <SheetDescription>
                {user ? `@${user.username}` : tCommon('status.loading')}
              </SheetDescription>
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label={t('detail.close')}>
                <X className="size-4" aria-hidden />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="p-4">
          {isLoading ? (
            <div
              className="space-y-4"
              role="status"
              aria-busy="true"
              aria-label={t('detail.loading')}
            >
              <Skeleton className="size-14 rounded-full" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : isError ? (
            <div className="text-center">
              <AlertCircle
                className="mx-auto size-6 text-rose-600 dark:text-rose-400"
                aria-hidden
              />
              <p className="mt-3 text-sm text-muted-foreground">
                {apiError ? tError(getErrorMessageKey(apiError)) : tError('error.unknown')}
              </p>
              <Button
                type="button"
                className="mt-4"
                onClick={() => {
                  void refetch();
                }}
              >
                {tCommon('action.retry')}
              </Button>
            </div>
          ) : !user ? (
            <p className="text-sm text-muted-foreground">{t('detail.notFound')}</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                  <AvatarFallback>{initialOf(user)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-base font-medium text-card-foreground">
                    {user.displayName ?? user.username}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="ml-auto">
                  <UserStatusBadge user={user} />
                </div>
              </div>

              <Separator />

              <div className="divide-y divide-border">
                <DetailRow label={t('table.column.role')}>
                  {roles.length > 0 ? roles.join(', ') : t('action.noRoles')}
                </DetailRow>
                {user.createdAt ? (
                  <DetailRow label={t('detail.joined')}>
                    <time dateTime={user.createdAt}>{formatDateTime(user.createdAt, locale)}</time>
                  </DetailRow>
                ) : null}
                {user.lastSeenAt ? (
                  <DetailRow label={t('detail.lastSeen')}>
                    <time dateTime={user.lastSeenAt}>
                      {formatDateTime(user.lastSeenAt, locale)}
                    </time>
                  </DetailRow>
                ) : null}
                {user.bannedAt ? (
                  <DetailRow label={t('detail.bannedAt')}>
                    <time dateTime={user.bannedAt}>{formatDateTime(user.bannedAt, locale)}</time>
                  </DetailRow>
                ) : null}
                {user.banReason ? (
                  <DetailRow label={t('detail.banReason')}>{user.banReason}</DetailRow>
                ) : null}
              </div>

              {actions ? (
                <>
                  <Separator />
                  <div className="flex flex-wrap gap-2">{actions}</div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
