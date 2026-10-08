import { describe, expect, it, vi } from 'vitest';
import type { Media, PresignedUrlResponse } from '../schemas/media.schema';
import {
  MediaUploadError,
  PRESIGNED_UPLOAD_MAX_ATTEMPTS,
  isExpiredPresignedUrl,
  runPresignedUpload,
  uploadWithProgress,
} from './presigned-upload';

/**
 * Deterministic XMLHttpRequest stand-in. jsdom's real XHR never fires
 * realistic `upload.onprogress` events, which is why the factory is injectable.
 */
class FakeUploadTarget {
  onprogress: ((event: ProgressEvent) => void) | null = null;
}

class FakeXhr {
  upload = new FakeUploadTarget();
  status = 0;
  method = '';
  url = '';
  sent: Blob | null = null;
  aborted = false;
  autoStatus: number | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  send(body: Blob) {
    this.sent = body;
    if (this.autoStatus !== null) this.respond(this.autoStatus);
  }

  abort() {
    this.aborted = true;
    this.onabort?.();
  }

  emitProgress(loaded: number, total: number) {
    this.upload.onprogress?.({ loaded, total } as unknown as ProgressEvent);
  }

  respond(status: number) {
    this.status = status;
    this.onload?.();
  }

  fail() {
    this.onerror?.();
  }
}

function asXhr(fake: FakeXhr): XMLHttpRequest {
  return fake as unknown as XMLHttpRequest;
}

const file = new File([new Uint8Array([1, 2, 3])], 'clip.mp4', { type: 'video/mp4' });

function presigned(mediaId: string): PresignedUrlResponse {
  return {
    mediaId,
    uploadUrl: `http://localhost:9000/snapgram-media/${mediaId}.mp4`,
    fileUrl: `http://localhost:9000/snapgram-media/${mediaId}.mp4`,
    expiresInSeconds: 900,
  };
}

function media(id: string): Media {
  return {
    id,
    ownerId: 'u-1',
    url: `http://localhost:9000/snapgram-media/${id}.mp4`,
    thumbnailUrl: null,
    mimeType: 'video/mp4',
    sizeBytes: 3,
    status: 'READY',
    width: null,
    height: null,
    durationSec: 10,
    createdAt: '2026-10-08T06:00:00Z',
  };
}

describe('uploadWithProgress', () => {
  it('PUTs the binary to the presigned URL and resolves on 2xx', async () => {
    const fake = new FakeXhr();
    const promise = uploadWithProgress({
      file,
      uploadUrl: 'http://localhost:9000/snapgram-media/m-1.mp4',
      createXhr: () => asXhr(fake),
    });

    expect(fake.method).toBe('PUT');
    expect(fake.url).toBe('http://localhost:9000/snapgram-media/m-1.mp4');
    expect(fake.sent).toBe(file);

    fake.respond(200);
    await expect(promise).resolves.toBeUndefined();
  });

  it('reports real progress percentages clamped to 0..100', async () => {
    const fake = new FakeXhr();
    const onProgress = vi.fn();
    const promise = uploadWithProgress({
      file,
      uploadUrl: 'http://localhost:9000/x',
      onProgress,
      createXhr: () => asXhr(fake),
    });

    fake.emitProgress(0, 100);
    fake.emitProgress(25, 100);
    fake.emitProgress(100, 100);
    fake.emitProgress(500, 100);
    fake.emitProgress(9, 0);

    fake.respond(200);
    await promise;

    expect(onProgress.mock.calls.map(([percent]) => percent)).toEqual([0, 25, 100, 100, 0]);
  });

  it('works without a progress callback', async () => {
    const fake = new FakeXhr();
    const promise = uploadWithProgress({
      file,
      uploadUrl: 'http://localhost:9000/x',
      createXhr: () => asXhr(fake),
    });

    expect(() => fake.emitProgress(1, 2)).not.toThrow();
    fake.respond(200);

    await expect(promise).resolves.toBeUndefined();
  });

  it('rejects with the status on a 403 (expired presigned URL)', async () => {
    const fake = new FakeXhr();
    const promise = uploadWithProgress({
      file,
      uploadUrl: 'http://localhost:9000/x',
      createXhr: () => asXhr(fake),
    });

    fake.respond(403);

    await expect(promise).rejects.toMatchObject({ httpStatus: 403, aborted: false });
  });

  it('rejects with a network error when the request fails', async () => {
    const fake = new FakeXhr();
    const promise = uploadWithProgress({
      file,
      uploadUrl: 'http://localhost:9000/x',
      createXhr: () => asXhr(fake),
    });

    fake.fail();

    await expect(promise).rejects.toBeInstanceOf(MediaUploadError);
    await expect(promise).rejects.toMatchObject({ httpStatus: 0 });
  });

  it('aborts the XHR when the AbortSignal fires', async () => {
    const fake = new FakeXhr();
    const controller = new AbortController();
    const promise = uploadWithProgress({
      file,
      uploadUrl: 'http://localhost:9000/x',
      signal: controller.signal,
      createXhr: () => asXhr(fake),
    });

    controller.abort();

    expect(fake.aborted).toBe(true);
    await expect(promise).rejects.toMatchObject({ aborted: true });
  });

  it('rejects immediately when the signal is already aborted', async () => {
    const fake = new FakeXhr();
    const controller = new AbortController();
    controller.abort();

    await expect(
      uploadWithProgress({
        file,
        uploadUrl: 'http://localhost:9000/x',
        signal: controller.signal,
        createXhr: () => asXhr(fake),
      })
    ).rejects.toMatchObject({ aborted: true });
  });
});

describe('runPresignedUpload', () => {
  it('requests a URL, PUTs the binary, then confirms (3 steps)', async () => {
    const fake = new FakeXhr();
    fake.autoStatus = 200;
    const requestPresignedUrl = vi.fn().mockResolvedValue(presigned('m-1'));
    const confirmUpload = vi.fn().mockResolvedValue(media('m-1'));
    const steps: string[] = [];

    const result = await runPresignedUpload({
      file,
      deps: { requestPresignedUrl, confirmUpload, createXhr: () => asXhr(fake) },
      onStep: (step) => steps.push(step),
    });

    expect(requestPresignedUrl).toHaveBeenCalledWith({
      fileName: 'clip.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 3,
    });
    expect(fake.url).toBe('http://localhost:9000/snapgram-media/m-1.mp4');
    expect(confirmUpload).toHaveBeenCalledWith('m-1');
    expect(steps).toEqual(['requesting', 'uploading', 'confirming']);
    expect(result.id).toBe('m-1');
  });

  it('re-requests a fresh URL and retries exactly once on 403', async () => {
    const requestPresignedUrl = vi
      .fn()
      .mockResolvedValueOnce(presigned('m-1'))
      .mockResolvedValueOnce(presigned('m-2'));
    const confirmUpload = vi.fn().mockResolvedValue(media('m-2'));
    const uploadWithProgressMock = vi
      .fn()
      .mockRejectedValueOnce(new MediaUploadError('expired', { httpStatus: 403 }))
      .mockResolvedValueOnce(undefined);
    const steps: string[] = [];

    const result = await runPresignedUpload({
      file,
      deps: { requestPresignedUrl, confirmUpload, uploadWithProgress: uploadWithProgressMock },
      onStep: (step) => steps.push(step),
    });

    expect(requestPresignedUrl).toHaveBeenCalledTimes(2);
    expect(uploadWithProgressMock).toHaveBeenCalledTimes(2);
    // The retry uses the freshly signed URL, not the expired one.
    expect(uploadWithProgressMock.mock.calls[0][0].uploadUrl).toContain('m-1');
    expect(uploadWithProgressMock.mock.calls[1][0].uploadUrl).toContain('m-2');
    expect(confirmUpload).toHaveBeenCalledWith('m-2');
    expect(result.id).toBe('m-2');
    expect(steps).toEqual(['requesting', 'uploading', 'requesting', 'uploading', 'confirming']);
  });

  it('stops after the second 403 (retry-once semantics)', async () => {
    const requestPresignedUrl = vi
      .fn()
      .mockResolvedValueOnce(presigned('m-1'))
      .mockResolvedValueOnce(presigned('m-2'));
    const confirmUpload = vi.fn();
    const uploadWithProgressMock = vi
      .fn()
      .mockRejectedValueOnce(new MediaUploadError('expired', { httpStatus: 403 }))
      .mockRejectedValueOnce(new MediaUploadError('expired again', { httpStatus: 403 }));

    await expect(
      runPresignedUpload({
        file,
        deps: { requestPresignedUrl, confirmUpload, uploadWithProgress: uploadWithProgressMock },
      })
    ).rejects.toMatchObject({ httpStatus: 403 });

    expect(requestPresignedUrl).toHaveBeenCalledTimes(PRESIGNED_UPLOAD_MAX_ATTEMPTS);
    expect(uploadWithProgressMock).toHaveBeenCalledTimes(2);
    expect(confirmUpload).not.toHaveBeenCalled();
  });

  it('does not retry a non-403 upload failure', async () => {
    const requestPresignedUrl = vi.fn().mockResolvedValue(presigned('m-1'));
    const confirmUpload = vi.fn();
    const uploadWithProgressMock = vi
      .fn()
      .mockRejectedValue(new MediaUploadError('boom', { httpStatus: 500 }));

    await expect(
      runPresignedUpload({
        file,
        deps: { requestPresignedUrl, confirmUpload, uploadWithProgress: uploadWithProgressMock },
      })
    ).rejects.toMatchObject({ httpStatus: 500 });

    expect(requestPresignedUrl).toHaveBeenCalledTimes(1);
    expect(uploadWithProgressMock).toHaveBeenCalledTimes(1);
    expect(confirmUpload).not.toHaveBeenCalled();
  });

  it('propagates an abort without confirming', async () => {
    const requestPresignedUrl = vi.fn().mockResolvedValue(presigned('m-1'));
    const confirmUpload = vi.fn();
    const uploadWithProgressMock = vi
      .fn()
      .mockRejectedValue(new MediaUploadError('aborted', { aborted: true }));

    await expect(
      runPresignedUpload({
        file,
        deps: { requestPresignedUrl, confirmUpload, uploadWithProgress: uploadWithProgressMock },
      })
    ).rejects.toMatchObject({ aborted: true });

    expect(confirmUpload).not.toHaveBeenCalled();
  });

  it('forwards progress and the AbortSignal into the PUT', async () => {
    const requestPresignedUrl = vi.fn().mockResolvedValue(presigned('m-1'));
    const confirmUpload = vi.fn().mockResolvedValue(media('m-1'));
    const onProgress = vi.fn();
    const controller = new AbortController();
    const uploadWithProgressMock = vi.fn().mockResolvedValue(undefined);

    await runPresignedUpload({
      file,
      deps: { requestPresignedUrl, confirmUpload, uploadWithProgress: uploadWithProgressMock },
      signal: controller.signal,
      onProgress,
    });

    const options = uploadWithProgressMock.mock.calls[0][0];
    expect(options.uploadUrl).toBe('http://localhost:9000/snapgram-media/m-1.mp4');
    expect(options.signal).toBe(controller.signal);
    expect(options.onProgress).toBe(onProgress);
  });

  it('falls back to a safe file name and mime type', async () => {
    const requestPresignedUrl = vi.fn().mockResolvedValue(presigned('m-1'));
    const confirmUpload = vi.fn().mockResolvedValue(media('m-1'));
    const uploadWithProgressMock = vi.fn().mockResolvedValue(undefined);
    const anonymous = new Blob([new Uint8Array([1])]);

    await runPresignedUpload({
      file: anonymous,
      deps: { requestPresignedUrl, confirmUpload, uploadWithProgress: uploadWithProgressMock },
    });

    expect(requestPresignedUrl).toHaveBeenCalledWith({
      fileName: 'upload',
      mimeType: 'application/octet-stream',
      sizeBytes: 1,
    });
  });

  it('classifies only 403 MediaUploadErrors as an expired URL', () => {
    expect(isExpiredPresignedUrl(new MediaUploadError('x', { httpStatus: 403 }))).toBe(true);
    expect(isExpiredPresignedUrl(new MediaUploadError('x', { httpStatus: 500 }))).toBe(false);
    expect(isExpiredPresignedUrl(new Error('x'))).toBe(false);
    expect(new MediaUploadError('x').httpStatus).toBe(0);
    expect(new MediaUploadError('x').aborted).toBe(false);
    expect(PRESIGNED_UPLOAD_MAX_ATTEMPTS).toBe(2);
  });
});
