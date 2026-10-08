'use client';

import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDirectUpload } from '../hooks/use-direct-upload';
import {
  MEDIA_MIME_WHITELIST,
  validateDirectUploadFile,
  type Media,
  type MediaValidationError,
} from '../schemas/media.schema';

interface Props {
  onUploaded?: (media: Media) => void;
}

/**
 * Direct multipart upload (`POST /api/media/upload`) for avatars / icons / small
 * images — strictly under 5MB and never a video (conventions §11.1). Because the
 * file is small the UX is a spinner on the button, NOT a progress bar.
 */
export function MediaDirectUploader({ onUploaded }: Props) {
  const t = useTranslations('media');
  const mutation = useDirectUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<MediaValidationError | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so picking the same file twice still fires a change event.
    event.target.value = '';
    if (!file) return;

    const error = validateDirectUploadFile(file);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    mutation.mutate(file, {
      onSuccess: (media) => {
        onUploaded?.(media);
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('upload.directTitle')}</CardTitle>
        <CardDescription>{t('upload.directDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept={MEDIA_MIME_WHITELIST.filter((mime) => mime.startsWith('image/')).join(',')}
          className="sr-only"
          aria-label={t('upload.selectFile')}
          onChange={handleFileChange}
        />

        <Button
          type="button"
          disabled={mutation.isPending}
          onClick={() => inputRef.current?.click()}
        >
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="size-4" aria-hidden />
          )}
          {mutation.isPending ? t('upload.directUploading') : t('upload.directSubmit')}
        </Button>

        {validationError ? (
          <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
            {t(`validation.${validationError}`)}
          </p>
        ) : null}

        {mutation.isError && !validationError ? (
          <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
            {t('error.uploadFailed')}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
