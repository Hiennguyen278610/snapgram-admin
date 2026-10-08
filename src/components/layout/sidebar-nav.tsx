'use client';

import type { ComponentType, SVGProps } from 'react';
import { useTranslations } from 'next-intl';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Flag,
  HardDrive,
  Images,
  LayoutDashboard,
  ShieldAlert,
  Users,
  Waypoints,
} from 'lucide-react';
import { cn } from 'cn';
import { Link, usePathname } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui-store';

type NavKey =
  'dashboard' | 'users' | 'rbac' | 'reports' | 'media' | 'systemHealth' | 'kafka' | 'minio';

type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface NavItem {
  key: NavKey;
  href: string;
  icon: NavIcon;
  external?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { key: 'users', href: '/admin/users', icon: Users },
  { key: 'rbac', href: '/admin/rbac', icon: ShieldAlert },
  { key: 'reports', href: '/admin/moderation/reports', icon: Flag },
  { key: 'media', href: '/admin/media', icon: Images },
  { key: 'systemHealth', href: '/admin/system-health', icon: Activity },
  {
    key: 'kafka',
    href: 'http://localhost:8089',
    icon: Waypoints,
    external: true,
  },
  {
    key: 'minio',
    href: 'http://localhost:9001',
    icon: HardDrive,
    external: true,
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

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

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
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!collapsed && (
          <span className="font-display truncate text-xl text-card-foreground">
            {tCommon('app.title')}
          </span>
        )}
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
        {NAV_ITEMS.map((item) => {
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
    </aside>
  );
}
