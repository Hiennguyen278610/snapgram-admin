'use client';

import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface Props {
  title?: string;
  description?: string;
}

export function AccessDeniedCard({ title, description }: Props) {
  const tError = useTranslations('error.forbidden');
  const tCommon = useTranslations('common');

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-4">
      <div className="size-14 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
        <ShieldAlert className="size-8" aria-hidden />
      </div>
      <div className="max-w-md space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {title || tError('accessDenied')}
        </h2>
        <p className="text-sm text-muted-foreground">{description || tError('accessDenied')}</p>
      </div>
      <Button asChild variant="outline">
        <Link href="/admin/dashboard">{tCommon('action.back') || 'Go to Dashboard'}</Link>
      </Button>
    </div>
  );
}
