'use client';

import type { ComponentType, SVGProps } from 'react';
import { useTranslations } from 'next-intl';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Flag,
  Headphones,
  LayoutDashboard,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, usePathname } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/layout/brand-logo';
import { usePermission } from '@/features/auth/hooks/use-permission';
import { UserMenu } from '@/components/layout/user-menu';
import { useUIStore } from '@/stores/ui-store';

type NavKey = 'dashboard' | 'users' | 'rbac' | 'reports' | 'support' | 'payments' | 'systemHealth';

type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface NavItem {
  key: NavKey;
  href: string;
  icon: NavIcon;
  external?: boolean;
  adminOnly?: boolean;
  requiredPermission?: string;
  requiredAnyPermissions?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { key: 'users', href: '/admin/users', icon: Users, requiredPermission: 'USER:READ' },
  { key: 'rbac', href: '/admin/rbac', icon: ShieldAlert, adminOnly: true },
  {
    key: 'reports',
    href: '/admin/moderation/reports',
    icon: Flag,
    requiredPermission: 'REPORT:VIEW',
  },
  {
    key: 'support',
    href: '/admin/support',
    icon: Headphones,
    requiredPermission: 'SUPPORT:TICKET_READ',
  },
  {
    key: 'payments',
    href: '/admin/payments',
    icon: CreditCard,
    requiredPermission: 'PAYMENT:READ',
  },
  {
    key: 'systemHealth',
    href: '/admin/system-health',
    icon: Activity,
    requiredAnyPermissions: ['SYSTEM:SETTINGS_READ', 'AUDIT:VIEW'],
  },
];

const ITEM_BASE =
  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50';

export function SidebarNav() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { isAdmin, hasPermission, hasAnyPermission, isLoading } = usePermission();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    // While loading user permissions, don't flash unauthorized menus if user is not admin
    if (isLoading) {
      return item.key === 'dashboard';
    }
    if (isAdmin) {
      return true;
    }
    if (item.adminOnly) {
      return false;
    }
    if (item.requiredPermission) {
      return hasPermission(item.requiredPermission);
    }
    if (item.requiredAnyPermissions) {
      return hasAnyPermission(...item.requiredAnyPermissions);
    }
    return true;
  });

  return (
    <aside
      aria-label={tCommon('app.title')}
      data-collapsed={collapsed}
      className={cn(
        'hidden shrink-0 flex-col border-r border-border bg-card px-3 py-4 transition-[width] duration-200 lg:flex',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 pb-6',
          collapsed ? 'flex-col gap-3 justify-center' : 'justify-between'
        )}
      >
        <BrandLogo size="md" collapsed={collapsed} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label={t('toggleSidebar')}
          onClick={toggleSidebar}
        >
          {collapsed ? (
            <ChevronRight className="size-5" aria-hidden />
          ) : (
            <ChevronLeft className="size-5" aria-hidden />
          )}
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const label = t(item.key);
          const active = !item.external && isActive(item.href);
          const itemClassName = cn(
            ITEM_BASE,
            collapsed && 'justify-center px-0',
            active
              ? 'bg-accent font-semibold text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
          );

          if (item.external) {
            return (
              <a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label}, ${t('openExternal')}`}
                title={collapsed ? label : undefined}
                className={itemClassName}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                {!collapsed && <span className="truncate">{label}</span>}
              </a>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              aria-label={collapsed ? label : undefined}
              title={collapsed ? label : undefined}
              className={itemClassName}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border pt-4">
        <UserMenu />
      </div>
    </aside>
  );
}
