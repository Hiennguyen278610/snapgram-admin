'use client';

import { Ban, Eye, MoreHorizontal, Pencil, ShieldCheck, Trash2, UserCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePermission } from '@/features/auth/hooks/use-permission';
import { UserStatusBadge } from './user-status-badge';
import type { AdminUser } from '../schemas/user.schema';

export type UserAction = 'view' | 'edit' | 'assignRole' | 'ban' | 'unban' | 'delete';

interface Props {
  user: AdminUser;
  onAction: (action: UserAction, user: AdminUser) => void;
}

export function UserActionMenu({ user, onAction }: Props) {
  const t = useTranslations('users');
  const { isAdmin, hasPermission } = usePermission();

  const canEdit = isAdmin;
  const canDelete = isAdmin;
  const canAssignRole = isAdmin || hasPermission('USER:ROLE_ASSIGN');
  const canBan = isAdmin || hasPermission('USER:BAN');
  const canUnban = isAdmin || hasPermission('USER:UNBAN');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('table.column.actions')}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span className="truncate font-normal text-muted-foreground">@{user.username}</span>
          <UserStatusBadge user={user} />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction('view', user)}>
          <Eye className="size-4" aria-hidden />
          {t('action.viewDetails')}
        </DropdownMenuItem>
        {canEdit ? (
          <DropdownMenuItem onClick={() => onAction('edit', user)}>
            <Pencil className="size-4" aria-hidden />
            {t('action.editUser')}
          </DropdownMenuItem>
        ) : null}
        {canAssignRole ? (
          <DropdownMenuItem onClick={() => onAction('assignRole', user)}>
            <ShieldCheck className="size-4" aria-hidden />
            {t('action.assignRole')}
          </DropdownMenuItem>
        ) : null}
        {canBan || canUnban ? <DropdownMenuSeparator /> : null}
        {user.banned === true
          ? canUnban && (
              <DropdownMenuItem onClick={() => onAction('unban', user)}>
                <UserCheck className="size-4" aria-hidden />
                {t('action.unban')}
              </DropdownMenuItem>
            )
          : canBan && (
              <DropdownMenuItem variant="destructive" onClick={() => onAction('ban', user)}>
                <Ban className="size-4" aria-hidden />
                {t('action.ban')}
              </DropdownMenuItem>
            )}
        {canDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onAction('delete', user)}>
              <Trash2 className="size-4" aria-hidden />
              {t('action.deleteUser')}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
