'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AlertCircle, FileWarning, Link2Off, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessageKey } from '@/lib/api/error-mapper';
import type { ApiError } from '@/lib/api/types';
import { useMediaDetail } from '../hooks/use-media-detail';
import { isVideoMimeType } from '../schemas/media.schema';

interface Props {
  mediaId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Center modal that previews the presigned URL returned by
 * `GET /api/media/{id}` (component-inventory.md §2.4 › MediaPreviewDialog).
 *
 * Presigned URLs are short-lived: when the browser fails to load the asset the
 * dialog treats it as an expired link and offers a reload, which refetches the
 * detail endpoint and gets a freshly signed URL. Never cached, never persisted
 * (conventions §11.2).
 *
 * Video playback config (autoplay / muted / native vs custom controls) is
 * **TBD** (conventions §14): native `controls`, `muted`, no autoplay for now.
 */
export function MediaPreviewDialog({ mediaId, open, onOpenChange }: Props) {
  const t = useTranslations('media');
  const tCommon = useTranslations('common');
  const tError = useTranslations();
  const [assetFailed, setAssetFailed] = useState(false);

  const { data: media, isLoading, isError, error, refetch } = useMediaDetail(mediaId);
  const apiError = error as unknown as ApiError | null;

  const reload = () => {
    setAssetFailed(false);
    void refetch();
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <div role="status" aria-busy="true" aria-label={t('preview.loading')} className="space-y-3">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-3 w-40" />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="py-8 text-center">
          <AlertCircle className="mx-auto size-6 text-rose-600 dark:text-rose-400" aria-hidden />
          <p className="mt-3 text-sm text-muted-foreground">
            {apiError ? tError(getErrorMessageKey(apiError)) : tError('error.unknown')}
          </p>
          <Button type="button" className="mt-4" onClick={reload}>
            {tCommon('action.retry')}
          </Button>
        </div>
      );
    }

    if (!media) {
      return (
        <p className="py-8 text-center text-sm text-muted-foreground">{tError('error.unknown')}</p>
      );
    }

    const isVideo = isVideoMimeType(media.mimeType);
    const isImage = media.mimeType.startsWith('image/');

    // An `<img>` / `<video>` error on a presigned URL almost always means the
    // signature expired before the browser fetched it.
    if (assetFailed) {
      return (
        <div className="py-8 text-center">
          <Link2Off className="mx-auto size-6 text-amber-600 dark:text-amber-400" aria-hidden />
          <h3 className="mt-3 text-sm font-semibold text-card-foreground">
            {t('preview.expiredTitle')}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">{t('preview.expiredDescription')}</p>
          <Button type="button" className="mt-4" onClick={reload}>
            {t('preview.reload')}
          </Button>
        </div>
      );
    }

    if (isVideo) {
      return (
        <video
          src={media.url}
          controls
          muted
          playsInline
          preload="metadata"
          className="max-h-[70vh] w-full rounded-xl bg-muted"
          onError={() => setAssetFailed(true)}
        />
      );
    }

    if (isImage) {
      return (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
          <Image
            src={media.url}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-contain"
            onError={() => setAssetFailed(true)}
          />
        </div>
      );
    }

    return (
      <div className="py-8 text-center">
        <FileWarning className="mx-auto size-6 text-muted-foreground" aria-hidden />
        <p className="mt-3 text-sm text-muted-foreground">{t('preview.unsupported')}</p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle>{t('preview.title')}</DialogTitle>
              <DialogDescription className="truncate font-mono text-xs">
                {media ? media.id : tCommon('status.loading')}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label={t('preview.close')}>
                <X className="size-4" aria-hidden />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {renderBody()}
      </DialogContent>
    </Dialog>
  );
}
