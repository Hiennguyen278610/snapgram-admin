'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Check, Languages } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Locale sub-menu for the sidebar user menu. Swaps the active locale on the
 * current route so the user keeps their place, and marks the active locale.
 */
export function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Languages className="size-4" aria-hidden />
        {t('label')}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {routing.locales.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => router.replace(pathname, { locale: option })}
          >
            {t(option)}
            {option === locale && <Check className="ml-auto size-4" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
