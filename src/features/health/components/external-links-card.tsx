'use client';

import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EXTERNAL_LINKS } from '@/lib/constants/services';

/**
 * Static quick links to the infrastructure dashboards. These are plain public
 * URLs, so they come from `NEXT_PUBLIC_*` env values via `EXTERNAL_LINKS`.
 */
export function ExternalLinksCard() {
  // Full-path keys (`health.external.*`) resolve from the root namespace.
  const t = useTranslations();

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-base font-semibold text-card-foreground">{t('health.external.title')}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('health.external.description')}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {EXTERNAL_LINKS.map((link) => (
          <Button key={link.labelKey} asChild variant="outline">
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              {t(link.labelKey)}
              <ExternalLink className="size-4" aria-hidden />
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}
