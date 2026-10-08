'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageOff, Play, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/i18n/routing';
import { formatNumber } from '@/lib/i18n/format';
import { isVideoMimeType, type Media } from '../schemas/media.schema';

const ID_PREVIEW_LENGTH = 8;
const KB = 1024;

interface Props {
  media: Media;
  onSelect: (media: Media) => void;
  onDelete: (media: Media) => void;
}

/** Compact, locale-aware file size. The DTO only carries bytes, not a name. */
function formatFileSize(bytes: number, locale: Locale): string {
  if (bytes >= KB * KB) {
    return `${formatNumber(Math.round((bytes / (KB * KB)) * 10) / 10, locale)} MB`;
  }
  if (bytes >= KB) {
    return `${formatNumber(Math.round(bytes / KB), locale)} KB`;
  }
  return `${formatNumber(bytes, locale)} B`;
}

export function MediaGridItem({ media, onSelect, onDelete }: Props) {
  const t = useTranslations('media');
  const locale = useLocale() as Locale;
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  const thumbnail = media.thumbnailUrl ?? media.url;
  const showThumbnail = Boolean(thumbnail) && !thumbnailFailed;
  const isVideo = isVideoMimeType(media.mimeType);
  const shortId = media.id.slice(0, ID_PREVIEW_LENGTH);
  const previewLabel = t('grid.itemLabel', { mimeType: media.mimeType });
  const deleteLabel = t('grid.deleteLabel', { mimeType: media.mimeType });

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => onSelect(media)}
        aria-label={previewLabel}
        className="block w-full cursor-pointer text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <div className="relative aspect-square w-full bg-muted">
          {showThumbnail ? (
            <Image
              src={thumbnail}
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, 240px"
              className="object-cover"
              onError={() => setThumbnailFailed(true)}
            />
          ) : (
            <span className="flex size-full items-center justify-center">
              <ImageOff className="size-6 text-muted-foreground" aria-hidden />
            </span>
          )}

          {isVideo ? (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-xs text-foreground">
              <Play className="size-3" aria-hidden />
              {t('grid.videoBadge')}
            </span>
          ) : null}
        </div>

        <div className="space-y-0.5 border-t border-border p-2">
          <p className="truncate font-mono text-xs text-card-foreground" title={media.id}>
            {shortId}
          </p>
          <p className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="truncate">{media.mimeType}</span>
            <span className="shrink-0">{formatFileSize(media.sizeBytes, locale)}</span>
          </p>
        </div>
      </button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={deleteLabel}
        className="absolute top-2 right-2 bg-background/80 hover:text-rose-600"
        onClick={() => onDelete(media)}
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
