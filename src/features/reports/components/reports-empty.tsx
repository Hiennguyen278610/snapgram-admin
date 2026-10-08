'use client';

import { Inbox } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ReportsEmpty() {
  const t = useTranslations('reports');

  return (
    <div className="rounded-2xl border border-border bg-card p-10 text-center">
      <Inbox className="mx-auto size-6 text-muted-foreground" aria-hidden />
      <h2 className="mt-3 text-lg font-semibold text-card-foreground">{t('empty.title')}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t('empty.description')}</p>
    </div>
  );
}
