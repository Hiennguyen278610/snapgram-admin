'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  items?: number;
}

const DEFAULT_ITEMS = 8;

/**
 * Mirrors `MediaLibraryGrid`'s aspect-square grid so swapping in real data
 * causes no layout shift (component-inventory.md loading convention).
 */
export function MediaLibrarySkeleton({ items = DEFAULT_ITEMS }: Props) {
  const t = useTranslations('media');
  const tCommon = useTranslations('common');

  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <div
          role="status"
          aria-busy="true"
          aria-label={tCommon('status.loading')}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          {Array.from({ length: items }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        <span className="sr-only">{t('grid.title')}</span>
      </CardContent>
    </Card>
  );
}
