'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Check, ChevronsUpDown, LogOut, Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { useUIStore } from '@/stores/ui-store';

type ThemeOption = 'light' | 'dark' | 'system';

const THEME_OPTIONS: { value: ThemeOption; icon: LucideIcon }[] = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
];

function getInitials(displayName: string) {
  return displayName.slice(0, 2).toUpperCase();
}

/**
 * Signed-in admin menu pinned to the bottom of the sidebar. It is the single
 * home for the theme control (light / dark / system), language switching and
 * logout. Renders nothing when there is no session so the layout never shows a
 * half-authenticated identity.
 */
export function UserMenu() {
  const t = useTranslations('userMenu');
  const tTheme = useTranslations('theme');
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();
  const { theme, setTheme } = useTheme();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  // Theme is persisted client-side only, so the first paint always shows the
  // same thing on both server and client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (isLoading || !mounted) {
    return <Skeleton className="h-12 w-full rounded-lg" />;
  }

  if (!user) {
    return null;
  }

  const displayName = user.displayName || user.username;
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('openMenu')}
          title={collapsed ? displayName : undefined}
          className={cn(
            'flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50',
            collapsed && 'justify-center px-0'
          )}
        >
          <Avatar className="size-8 shrink-0">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback className="text-xs font-medium">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-card-foreground">
                  {displayName}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="top" sideOffset={8} className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <LanguageSwitcher />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ThemeIcon className="size-4" aria-hidden />
            {tTheme('toggle')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {THEME_OPTIONS.map(({ value, icon: Icon }) => (
              <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
                <Icon className="size-4" aria-hidden />
                {tTheme(value)}
                {theme === value && <Check className="ml-auto size-4" aria-hidden />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <LogOut className="size-4" aria-hidden />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
