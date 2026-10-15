import type { Media, PresignedUrlRequest, PresignedUrlResponse } from '../schemas/media.schema';

/**
 * Imperative orchestrator for steps 2 + 3 of the presigned flow
 * (conventions §11.1). Step 2 uses `XMLHttpRequest` on purpose: it is the only
 * browser API that reports real upload progress (`xhr.upload.onprogress`).
 * `fetch` has no upload progress event.
 *
 * The XHR factory is injectable so jsdom unit tests can drive `onprogress`,
 * `abort` and status codes deterministically — jsdom's real XHR never fires
 * realistic upload progress events.
 *
 * Expired presigned URL (conventions §11.1 › Xử lý URL Presigned hết hạn):
 * a `403` from the PUT to MinIO means the signed URL expired. The orchestrator
 * re-requests `/api/media/presigned` and PUTs AGAIN EXACTLY ONCE
 * (`attempt <= 2`). A second failure rejects and the UI stops with an error.
 */
export type PresignedUploadStep = 'requesting' | 'uploading' | 'confirming';

/** Maximum number of PUT attempts (initial + one retry after a 403). */
export const PRESIGNED_UPLOAD_MAX_ATTEMPTS = 2;

export class MediaUploadError extends Error {
  readonly httpStatus: number;
  readonly aborted: boolean;

  constructor(message: string, options: { httpStatus?: number; aborted?: boolean } = {}) {
    super(message);
    this.name = 'MediaUploadError';
    this.httpStatus = options.httpStatus ?? 0;
    this.aborted = options.aborted ?? false;
  }
}

export function isExpiredPresignedUrl(error: unknown): boolean {
  return error instanceof MediaUploadError && error.httpStatus === 403;
}

export interface UploadWithProgressOptions {
  file: Blob;
  uploadUrl: string;
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
  /** Defaults to `() => new XMLHttpRequest()`; injectable for tests. */
  createXhr?: () => XMLHttpRequest;
}

/**
 * PUTs the file binary to MinIO via the presigned URL and resolves once the
 * request completes with a 2xx status. Rejects with a `MediaUploadError`
 * (`httpStatus`, `aborted`) otherwise.
 */
export function uploadWithProgress({
  file,
  uploadUrl,
  signal,
  onProgress,
  createXhr = () => new XMLHttpRequest(),
}: UploadWithProgressOptions): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = createXhr();
    let settled = false;

    const finish = (settle: () => void) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', handleAbort);
      settle();
    };

    function handleAbort() {
      xhr.abort();
    }

    if (signal?.aborted) {
      finish(() => reject(new MediaUploadError('Upload aborted', { aborted: true })));
      return;
    }

    xhr.open('PUT', uploadUrl);

    if (xhr.upload) {
      xhr.upload.onprogress = (event: ProgressEvent) => {
        if (!onProgress) return;
        const total = event.total ?? 0;
        const loaded = event.loaded ?? 0;
        const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
        onProgress(Math.min(100, Math.max(0, percent)));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        finish(resolve);
        return;
      }
      finish(() =>
        reject(
          new MediaUploadError(`Upload failed with status ${xhr.status}`, {
            httpStatus: xhr.status,
          })
        )
      );
    };

    xhr.onerror = () => {
      finish(() => reject(new MediaUploadError('Network error during upload')));
    };

    xhr.onabort = () => {
      finish(() => reject(new MediaUploadError('Upload aborted', { aborted: true })));
    };

    signal?.addEventListener('abort', handleAbort, { once: true });

    xhr.send(file);
  });
}

export interface PresignedUploadDeps {
  requestPresignedUrl: (payload: PresignedUrlRequest) => Promise<PresignedUrlResponse>;
  confirmUpload: (mediaId: string) => Promise<Media>;
  /** Injectable for tests; defaults to the real `uploadWithProgress`. */
  uploadWithProgress?: (options: UploadWithProgressOptions) => Promise<void>;
  /** Injectable XHR factory forwarded to `uploadWithProgress`. */
  createXhr?: () => XMLHttpRequest;
}

export interface RunPresignedUploadOptions {
  file: File | Blob;
  deps: PresignedUploadDeps;
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
  onStep?: (step: PresignedUploadStep) => void;
}

interface FileLike {
  name: string;
  type: string;
  size: number;
}

function toRequestPayload(file: File | Blob): PresignedUrlRequest {
  const named = file as FileLike;
  return {
    fileName: named.name || 'upload',
    mimeType: named.type || 'application/octet-stream',
    sizeBytes: named.size,
  };
}

/**
 * Runs: request presigned URL → PUT binary (with progress) → confirm.
 * Retries the PUT exactly once with a freshly signed URL on `403`.
 */
export async function runPresignedUpload({
  file,
  deps,
  signal,
  onProgress,
  onStep,
}: RunPresignedUploadOptions): Promise<Media> {
  const put = deps.uploadWithProgress ?? uploadWithProgress;
  const payload = toRequestPayload(file);

  onStep?.('requesting');
  let presigned = await deps.requestPresignedUrl(payload);

  onStep?.('uploading');
  let uploaded = false;

  for (let attempt = 1; attempt <= PRESIGNED_UPLOAD_MAX_ATTEMPTS; attempt += 1) {
    try {
      await put({
        file,
        uploadUrl: presigned.uploadUrl,
        signal,
        onProgress,
        createXhr: deps.createXhr,
      });
      uploaded = true;
      break;
    } catch (error) {
      if (isExpiredPresignedUrl(error) && attempt < PRESIGNED_UPLOAD_MAX_ATTEMPTS) {
        // Expired presigned URL: re-request a fresh one and PUT again ONCE.
        onStep?.('requesting');
        presigned = await deps.requestPresignedUrl(payload);
        onStep?.('uploading');
        continue;
      }
      throw error;
    }
  }

  if (!uploaded) {
    // Defensive: the loop above either sets `uploaded` or throws.
    throw new MediaUploadError('Upload did not complete');
  }

  onStep?.('confirming');
  return deps.confirmUpload(presigned.mediaId);
}
