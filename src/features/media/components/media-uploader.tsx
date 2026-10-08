'use client';

import { useRef, useState } from 'react';
import { Loader2, RotateCcw, Upload, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useConfirmUpload } from '../hooks/use-confirm-upload';
import { useRequestPresignedUrl } from '../hooks/use-request-presigned-url';
import {
  MediaUploadError,
  isExpiredPresignedUrl,
  runPresignedUpload,
  type PresignedUploadStep,
} from '../lib/presigned-upload';
import {
  MEDIA_MIME_WHITELIST,
  validateMediaFile,
  type Media,
  type MediaValidationError,
} from '../schemas/media.schema';

interface Props {
  onUploaded?: (media: Media) => void;
}

type UploadStatus = 'idle' | PresignedUploadStep | 'error';

interface UploadState {
  status: UploadStatus;
  percent: number;
  /** `media.validation.*` code or `media.error.*` key suffix. */
  messageKey: string | null;
}

const IDLE_STATE: UploadState = { status: 'idle', percent: 0, messageKey: null };

/**
 * Presigned 3-step uploader (conventions §11.1):
 * request URL → PUT binary to MinIO with a real progress bar → confirm.
 *
 * Mandatory for every video and for images of 5MB or more. Cancel goes through
 * an `AbortController`; on network failure the user gets a Retry button. An
 * expired presigned URL (403) is retried exactly once by `runPresignedUpload`.
 */
export function MediaUploader({ onUploaded }: Props) {
  const t = useTranslations('media');
  const requestMutation = useRequestPresignedUrl();
  const confirmMutation = useConfirmUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>(IDLE_STATE);
  const [validationError, setValidationError] = useState<MediaValidationError | null>(null);

  const isBusy =
    state.status === 'requesting' || state.status === 'uploading' || state.status === 'confirming';

  const startUpload = async (nextFile: File) => {
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ status: 'requesting', percent: 0, messageKey: null });

    try {
      const media = await runPresignedUpload({
        file: nextFile,
        signal: controller.signal,
        onStep: (step) => {
          setState((previous) => ({
            status: step,
            percent: step === 'uploading' ? 0 : previous.percent,
            messageKey: null,
          }));
        },
        onProgress: (percent) => {
          setState((previous) => ({ ...previous, percent }));
        },
        deps: {
          requestPresignedUrl: (payload) => requestMutation.mutateAsync(payload),
          confirmUpload: (mediaId) => confirmMutation.mutateAsync(mediaId),
        },
      });

      controllerRef.current = null;
      setFile(null);
      setState(IDLE_STATE);
      onUploaded?.(media);
    } catch (error) {
      controllerRef.current = null;
      if (error instanceof MediaUploadError && error.aborted) {
        setState(IDLE_STATE);
        return;
      }
      setState({
        status: 'error',
        percent: 0,
        messageKey: isExpiredPresignedUrl(error) ? 'expiredUrl' : 'uploadFailed',
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    event.target.value = '';
    if (!nextFile) return;

    const error = validateMediaFile(nextFile);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    setFile(nextFile);
    void startUpload(nextFile);
  };

  const handleCancel = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setFile(null);
    setState(IDLE_STATE);
  };

  const handleRetry = () => {
    if (!file) return;
    void startUpload(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    if (isBusy) return;
    const dropped = event.dataTransfer.files?.[0];
    if (!dropped) return;

    const error = validateMediaFile(dropped);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    setFile(dropped);
    void startUpload(dropped);
  };

  const statusLabel = () => {
    if (state.status === 'requesting') return t('upload.requesting');
    if (state.status === 'confirming') return t('upload.confirming');
    return t('upload.uploading');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('upload.presignedTitle')}</CardTitle>
        <CardDescription>{t('upload.presignedDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept={MEDIA_MIME_WHITELIST.join(',')}
          className="sr-only"
          aria-label={t('upload.selectFile')}
          onChange={handleFileChange}
        />

        {state.status === 'idle' ? (
          <div
            data-testid="media-dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center"
          >
            <Upload className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">{t('upload.dropHint')}</p>
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
              {t('upload.selectFile')}
            </Button>
          </div>
        ) : null}

        {isBusy ? (
          <div className="space-y-2" role="status" aria-live="polite">
            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {statusLabel()}
              </span>
              <span>{t('upload.progressLabel', { percent: state.percent })}</span>
            </div>
            <Progress
              value={state.percent}
              aria-label={t('upload.progressLabel', { percent: state.percent })}
            />
            <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
              <X className="size-4" aria-hidden />
              {t('upload.cancel')}
            </Button>
          </div>
        ) : null}

        {state.status === 'error' ? (
          <div className="space-y-2" role="alert">
            <p className="text-xs text-rose-600 dark:text-rose-400">
              {state.messageKey === 'expiredUrl' ? t('error.expiredUrl') : t('error.uploadFailed')}
            </p>
            <Button type="button" size="sm" onClick={handleRetry} disabled={!file}>
              <RotateCcw className="size-4" aria-hidden />
              {t('upload.retry')}
            </Button>
          </div>
        ) : null}

        {validationError ? (
          <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
            {t(`validation.${validationError}`)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
