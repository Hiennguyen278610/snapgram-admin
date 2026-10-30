'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export interface BrandLogoProps {
  /** Size variant: 'sm' (24px), 'md' (32px), 'lg' (44px), 'xl' (56px) */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Collapsed mode: shows only the icon, centered */
  collapsed?: boolean;
  /** Whether to show the text label 'Snapgram' and 'Admin' badge */
  showText?: boolean;
  /** Navigation target. Set to null or empty string to disable link wrapping */
  href?: string | null;
  /** Optional custom class name */
  className?: string;
  /** Prioritize image loading (useful above the fold / login hero) */
  priority?: boolean;
  /** Optional badge text, default 'ADMIN' */
  badgeText?: string;
}

const SIZE_CONFIG = {
  sm: {
    iconSize: 24,
    iconClass: 'size-6 rounded-md shadow-xs ring-1 ring-border/50',
    textClass: 'text-sm font-semibold tracking-tight',
    badgeClass: 'text-[9px] px-1 py-0.5 leading-none',
  },
  md: {
    iconSize: 32,
    iconClass: 'size-8 rounded-lg shadow-xs ring-1 ring-border/50',
    textClass: 'text-base font-bold tracking-tight',
    badgeClass: 'text-[10px] px-1.5 py-0.5 leading-none',
  },
  lg: {
    iconSize: 44,
    iconClass: 'size-11 rounded-xl shadow-sm ring-1 ring-border/60',
    textClass: 'text-lg font-bold tracking-tight',
    badgeClass: 'text-xs px-2 py-0.5 leading-none',
  },
  xl: {
    iconSize: 56,
    iconClass: 'size-14 rounded-2xl shadow-md ring-1 ring-border/70',
    textClass: 'text-2xl font-bold tracking-tight',
    badgeClass: 'text-xs px-2.5 py-1 leading-none',
  },
} as const;

export function BrandLogo({
  size = 'md',
  collapsed = false,
  showText = true,
  href = '/admin/dashboard',
  className,
  priority = false,
  badgeText = 'ADMIN',
}: BrandLogoProps) {
  const config = SIZE_CONFIG[size];

  const content = (
    <div
      className={cn(
        'group flex items-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg',
        collapsed ? 'justify-center w-full' : 'gap-2.5 min-w-0',
        className
      )}
    >
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden bg-background p-0.5 transition-transform duration-200 group-hover:scale-105',
          config.iconClass
        )}
      >
        <Image
          src="/brand/logo.png"
          alt="Snapgram Logo"
          width={config.iconSize}
          height={config.iconSize}
          priority={priority}
          unoptimized
          className="size-full object-contain drop-shadow-xs"
        />
      </div>

      {!collapsed && showText && (
        <div className="flex min-w-0 flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'font-display truncate text-card-foreground group-hover:text-primary transition-colors',
                config.textClass
              )}
            >
              Snapgram
            </span>
            {badgeText && (
              <span
                className={cn(
                  'rounded font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 shrink-0 select-none',
                  config.badgeClass
                )}
              >
                {badgeText}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
        title={collapsed ? 'Snapgram Admin' : undefined}
        aria-label="Snapgram Admin"
      >
        {content}
      </Link>
    );
  }

  return content;
}
