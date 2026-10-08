'use client';

import { ShieldOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function RbacEmpty() {
  const t = useTranslations('rbac');

  return (
    <div className="rounded-2xl border border-border bg-card p-10 text-center">
      <ShieldOff className="mx-auto size-6 text-muted-foreground" aria-hidden />
      <h2 className="mt-3 text-lg font-semibold text-card-foreground">{t('table.empty')}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t('table.emptyDescription')}</p>
    </div>
  );
}
