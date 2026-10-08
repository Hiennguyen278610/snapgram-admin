'use client';

import { Ban, Eye, MoreHorizontal, ShieldCheck, UserCheck } from 'lucide-react';
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
import { UserStatusBadge } from './user-status-badge';
import type { AdminUser } from '../schemas/user.schema';

export type UserAction = 'view' | 'ban' | 'unban' | 'assignRole';

interface Props {
  user: AdminUser;
  onAction: (action: UserAction, user: AdminUser) => void;
}

export function UserActionMenu({ user, onAction }: Props) {
  const t = useTranslations('users');

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
        <DropdownMenuItem onClick={() => onAction('assignRole', user)}>
          <ShieldCheck className="size-4" aria-hidden />
          {t('action.assignRole')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.banned === true ? (
          <DropdownMenuItem onClick={() => onAction('unban', user)}>
            <UserCheck className="size-4" aria-hidden />
            {t('action.unban')}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem variant="destructive" onClick={() => onAction('ban', user)}>
            <Ban className="size-4" aria-hidden />
            {t('action.ban')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
