'use client';

import { Menu, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui-store';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export function TopBar() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 overflow-hidden border-b border-border bg-card px-4 lg:px-6">
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

      <p className="font-display min-w-0 truncate text-lg text-card-foreground">
        {tCommon('app.title')}
      </p>

      <div className="ml-auto flex min-w-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          aria-label={t('searchPlaceholder')}
          onClick={() => setCommandOpen(true)}
          className="w-full max-w-[390px] min-w-0 justify-start gap-2 rounded-full bg-muted px-3 text-muted-foreground transition-colors hover:bg-accent"
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{t('searchPlaceholder')}</span>
        </Button>

        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
