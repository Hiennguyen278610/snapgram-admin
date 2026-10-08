'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ApiError } from '@/lib/api/types';
import type { Media } from '../schemas/media.schema';
import { MediaEmpty } from './media-empty';
import { MediaError } from './media-error';
import { MediaGridItem } from './media-grid-item';
import { MediaLibrarySkeleton } from './media-library-skeleton';

interface ReadyProps {
  status: 'ready';
  items: Media[];
  page: number;
  totalPages: number;
  onSelect: (media: Media) => void;
  onDelete: (media: Media) => void;
  onPageChange: (page: number) => void;
}

interface LoadingProps {
  status: 'loading';
}

interface EmptyProps {
  status: 'empty';
}

interface ErrorProps {
  status: 'error';
  error: ApiError | null;
  onRetry: () => void;
}

export type MediaLibraryGridProps = ReadyProps | LoadingProps | EmptyProps | ErrorProps;

/**
 * Explicit status variants instead of a pile of `isLoading`/`isError`/`isEmpty`
 * booleans (vercel-composition-patterns › avoid boolean prop proliferation).
 */
export function MediaLibraryGrid(props: MediaLibraryGridProps) {
  const t = useTranslations('media');

  if (props.status === 'loading') return <MediaLibrarySkeleton />;
  if (props.status === 'empty') return <MediaEmpty />;
  if (props.status === 'error') return <MediaError error={props.error} onRetry={props.onRetry} />;

  const { items, page, totalPages, onSelect, onDelete, onPageChange } = props;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('grid.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[420px] pr-3">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((media) => (
              <li key={media.id}>
                <MediaGridItem media={media} onSelect={onSelect} onDelete={onDelete} />
              </li>
            ))}
          </ul>
        </ScrollArea>

        {totalPages > 1 ? (
          <Pagination className="justify-end">
            <PaginationContent>
              <PaginationItem>
                <p className="px-2 text-sm text-muted-foreground">
                  {t('pagination.pageLabel', { page: page + 1, total: totalPages })}
                </p>
              </PaginationItem>
              <PaginationItem>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 0}
                  onClick={() => onPageChange(page - 1)}
                >
                  <ChevronLeft className="size-4" aria-hidden />
                  {t('pagination.previous')}
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => onPageChange(page + 1)}
                >
                  {t('pagination.next')}
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
      </CardContent>
    </Card>
  );
}
