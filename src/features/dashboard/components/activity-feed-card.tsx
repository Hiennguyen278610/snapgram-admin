'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import type { Locale } from '@/i18n/routing';
import { formatDateTime } from '@/lib/i18n/format';
import type { AdminUserResponse } from '../schemas/stats.schema';

interface Props {
  users: AdminUserResponse[];
  isLoading?: boolean;
}

const SKELETON_ROWS = 5;

function initialOf(user: AdminUserResponse): string {
  const source = user.displayName ?? user.username;
  return source.charAt(0).toUpperCase();
}

export function ActivityFeedCard({ users, isLoading = false }: Props) {
  const t = useTranslations('dashboard');
  const locale = useLocale() as Locale;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-card-foreground">{t('recentUsers.title')}</h2>

      {isLoading ? (
        <ul className="mt-4 space-y-4" data-testid="activity-feed-skeleton">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <li key={index} className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </li>
          ))}
        </ul>
      ) : users.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t('recentUsers.empty')}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {users.map((user) => (
            <li key={user.id} className="flex items-center gap-3">
              <Avatar size="lg">
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                <AvatarFallback>{initialOf(user)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-card-foreground">
                  {user.displayName ?? user.username}
                </p>
                <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
              </div>
              {user.createdAt ? (
                <time dateTime={user.createdAt} className="shrink-0 text-xs text-muted-foreground">
                  {formatDateTime(user.createdAt, locale)}
                </time>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
