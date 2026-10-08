'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { ApiError } from '@/lib/api/types';
import { useDeleteMedia } from '../hooks/use-delete-media';
import { useMediaList } from '../hooks/use-media-list';
import type { Media } from '../schemas/media.schema';
import { MediaDeleteDialog } from './media-delete-dialog';
import { MediaDirectUploader } from './media-direct-uploader';
import { MediaLibraryGrid } from './media-library-grid';
import { MediaPreviewDialog } from './media-preview-dialog';
import { MediaUploader } from './media-uploader';

const PAGE_SIZE = 12;

/**
 * Client orchestrator for the media library: list query, pagination, dialog
 * state and Sonner toasts. The uploaders own their own upload state machine.
 */
export function MediaPageContent() {
  const t = useTranslations('media');
  const tCommon = useTranslations('common');

  const [page, setPage] = useState(0);
  const { data, isLoading, isError, isFetching, error, refetch } = useMediaList({
    page,
    size: PAGE_SIZE,
  });
  const deleteMutation = useDeleteMedia();

  const [selectedMediaId, setSelectedMediaId] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Media | undefined>(undefined);
  const [deleteError, setDeleteError] = useState<ApiError | null>(null);

  const items = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(t('toast.deleteSuccess'));
        setDeleteTarget(undefined);
      },
      onError: (mutationError) => {
        setDeleteError(mutationError);
        // Stable id so a retried failure does not stack identical toasts (§9).
        toast.error(t('error.deleteFailed'), { id: 'media-delete-error' });
      },
    });
  };

  const handleUploaded = () => {
    toast.success(t('toast.uploadSuccess'));
  };

  return (
    <section className="py-6">
      <h1 className="font-display text-2xl text-card-foreground">{t('title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>

      <div className="mt-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <MediaUploader onUploaded={handleUploaded} />
          <MediaDirectUploader onUploaded={handleUploaded} />
        </div>

        {isLoading ? (
          <MediaLibraryGrid status="loading" />
        ) : isError ? (
          <MediaLibraryGrid
            status="error"
            error={error as unknown as ApiError}
            onRetry={() => {
              void refetch();
            }}
          />
        ) : items.length === 0 ? (
          <MediaLibraryGrid status="empty" />
        ) : (
          <MediaLibraryGrid
            status="ready"
            items={items}
            page={page}
            totalPages={totalPages}
            onSelect={(media) => setSelectedMediaId(media.id)}
            onDelete={(media) => {
              setDeleteError(null);
              setDeleteTarget(media);
            }}
            onPageChange={setPage}
          />
        )}

        {isFetching && !isLoading ? (
          <p role="status" className="sr-only">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {tCommon('status.loading')}
          </p>
        ) : null}
      </div>

      {selectedMediaId ? (
        <MediaPreviewDialog
          mediaId={selectedMediaId}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedMediaId(undefined);
          }}
        />
      ) : null}

      {deleteTarget ? (
        <MediaDeleteDialog
          media={deleteTarget}
          open
          onOpenChange={(open) => {
            if (!open) {
              setDeleteTarget(undefined);
              setDeleteError(null);
            }
          }}
          onConfirm={handleDeleteConfirm}
          isPending={deleteMutation.isPending}
          error={deleteError}
        />
      ) : null}
    </section>
  );
}
