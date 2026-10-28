'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Locale } from '@/i18n/routing';
import { formatDateTime } from '@/lib/i18n/format';
import type { AdminUser } from '../schemas/user.schema';
import { UserStatusBadge } from './user-status-badge';
import { UserTableSkeleton } from './user-table-skeleton';

interface Props {
  users: AdminUser[];
  isLoading?: boolean;
  onSelectUser: (id: string) => void;
  renderActions: (user: AdminUser) => React.ReactNode;
}

function initialOf(user: AdminUser): string {
  const source = user.displayName ?? user.username;
  return source.charAt(0).toUpperCase();
}

/**
 * Only the three roles declared in `users.role.*` are mapped; any dynamic role
 * coming from the backend falls back to its raw name so `next-intl` never
 * throws on a missing key.
 */
const ROLE_MESSAGE_KEYS = {
  admin: 'role.admin',
  moderator: 'role.moderator',
  user: 'role.user',
} as const;

function RoleBadge({ role }: { role: string }) {
  const t = useTranslations('users');
  const key = role.toLowerCase() as keyof typeof ROLE_MESSAGE_KEYS;
  const label = key in ROLE_MESSAGE_KEYS ? t(ROLE_MESSAGE_KEYS[key]) : role;

  return (
    <Badge variant="secondary" data-role={role}>
      {label}
    </Badge>
  );
}

export function UserDataTable({ users, isLoading = false, onSelectUser, renderActions }: Props) {
  const t = useTranslations('users');
  const locale = useLocale() as Locale;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>{t('table.column.user')}</TableHead>
            <TableHead>{t('table.column.email')}</TableHead>
            <TableHead>{t('table.column.role')}</TableHead>
            <TableHead>{t('table.column.status')}</TableHead>
            <TableHead>{t('table.column.created')}</TableHead>
            <TableHead className="text-right">{t('table.column.actions')}</TableHead>
          </TableRow>
        </TableHeader>

        {isLoading ? (
          <UserTableSkeleton />
        ) : (
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                tabIndex={0}
                className="cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                onClick={() => onSelectUser(user.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectUser(user.id);
                  }
                }}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                      <AvatarFallback>{initialOf(user)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-card-foreground">
                        {user.displayName ?? user.username}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(user.roles && user.roles.length > 0
                      ? user.roles
                      : user.role
                        ? [user.role]
                        : ['USER']
                    ).map((r) => (
                      <RoleBadge key={r} role={r} />
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <UserStatusBadge user={user} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.createdAt ? (
                    <time dateTime={user.createdAt}>{formatDateTime(user.createdAt, locale)}</time>
                  ) : null}
                </TableCell>
                <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                  {renderActions(user)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>
    </div>
  );
}
