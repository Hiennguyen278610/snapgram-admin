'use client';

import { Menu, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui-store';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { UserNav } from '@/components/layout/user-nav';
import { ServiceStatusPill } from '@/features/health/components/service-status-pill';

export function TopBar() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 lg:hidden"
        aria-label={t('toggleSidebar')}
        onClick={toggleSidebar}
      >
        <Menu className="size-5" aria-hidden />
      </Button>

      <p className="font-display min-w-0 flex-1 truncate text-lg text-card-foreground">
        {tCommon('app.title')}
      </p>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          aria-label={t('searchPlaceholder')}
          onClick={() => setCommandOpen(true)}
          className="hidden w-[320px] max-w-[390px] justify-start gap-2 rounded-full bg-muted px-3 text-muted-foreground transition-colors hover:bg-accent md:inline-flex lg:w-[390px]"
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{t('searchPlaceholder')}</span>
        </Button>

        <ServiceStatusPill />

        <ThemeToggle />

        <UserNav />
      </div>
    </header>
  );
}
