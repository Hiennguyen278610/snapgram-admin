'use client';

import { Loader2, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { useLogout } from '@/features/auth/hooks/use-logout';

function getInitials(name?: string | null, username?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }
  return 'AD';
}

export function UserNav() {
  const t = useTranslations('nav.userNav');
  const { data: user, isLoading } = useCurrentUser();
  const logoutMutation = useLogout();

  if (isLoading) {
    return <div className="size-8 animate-pulse rounded-full bg-muted" />;
  }

  const displayName = user?.displayName || user?.username || 'Admin';
  const initials = getInitials(user?.displayName, user?.username);
  const role = user?.role || 'ADMIN';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative flex items-center gap-2.5 rounded-full p-1 pl-1.5 pr-2.5 hover:bg-muted"
          aria-label={t('profile')}
        >
          <Avatar size="sm" className="size-7">
            {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={displayName} /> : null}
            <AvatarFallback className="text-[11px] font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden flex-col items-start text-left sm:flex">
            <span className="max-w-[120px] truncate text-xs font-semibold text-foreground leading-tight">
              {displayName}
            </span>
            <span className="text-[10px] text-muted-foreground leading-none">
              @{user?.username || 'admin'}
            </span>
          </div>
          <Badge
            variant="outline"
            className="hidden text-[10px] font-medium border-primary/30 text-primary md:inline-flex px-1.5 py-0 h-4"
          >
            {role}
          </Badge>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-2">
        <DropdownMenuLabel className="p-2 font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-primary">
                {role}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || 'admin@snapgram.com'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
          disabled={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
        >
          {logoutMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <LogOut className="size-4" aria-hidden />
          )}
          <span>{logoutMutation.isPending ? t('loggingOut') : t('logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
