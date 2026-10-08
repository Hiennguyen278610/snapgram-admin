import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import { MediaUploadError, runPresignedUpload } from '../lib/presigned-upload';
import type { Media } from '../schemas/media.schema';
import { MediaUploader } from './media-uploader';

vi.mock('../lib/presigned-upload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/presigned-upload')>();
  return { ...actual, runPresignedUpload: vi.fn() };
});

const mockedRunPresignedUpload = vi.mocked(runPresignedUpload);
const onUploaded = vi.fn();

const media: Media = {
  id: 'm-1',
  ownerId: 'u-1',
  url: 'http://localhost:9000/snapgram-media/m-1.mp4',
  thumbnailUrl: null,
  mimeType: 'video/mp4',
  sizeBytes: 3,
  status: 'READY',
  width: null,
  height: null,
  durationSec: 10,
  createdAt: '2026-10-08T06:00:00Z',
};

const videoFile = new File([new Uint8Array([1, 2, 3])], 'clip.mp4', { type: 'video/mp4' });

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function fileInput() {
  return screen.getByLabelText('Choose a file');
}

describe('MediaUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts idle with the drop zone and no progress bar', () => {
    renderWithProviders(<MediaUploader onUploaded={onUploaded} />);

    expect(screen.getByText('Upload a large file or video')).toBeInTheDocument();
    expect(screen.getByTestId('media-dropzone')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('runs the 3-step flow and reports real progress', async () => {
    const pending = deferred<Media>();
    mockedRunPresignedUpload.mockImplementation(async ({ onStep, onProgress }) => {
      onStep?.('requesting');
      onStep?.('uploading');
      onProgress?.(42);
      return pending.promise;
    });
    renderWithProviders(<MediaUploader onUploaded={onUploaded} />);

    await act(async () => {
      await userEvent.upload(fileInput(), videoFile);
    });

    expect(mockedRunPresignedUpload).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Uploading 42%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await act(async () => {
      pending.resolve(media);
      await Promise.resolve();
    });

    expect(onUploaded).toHaveBeenCalledWith(media);
    expect(screen.getByTestId('media-dropzone')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('pre-validates the MIME whitelist before requesting a URL', async () => {
    // `applyAccept: false` — a user can force a non-whitelisted file through the
    // accept filter, and the component must still reject it.
    const user = userEvent.setup({ applyAccept: false });
    renderWithProviders(<MediaUploader onUploaded={onUploaded} />);

    await user.upload(
      fileInput(),
      new File([new Uint8Array([1])], 'doc.pdf', { type: 'application/pdf' })
    );

    expect(mockedRunPresignedUpload).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/not supported/i);
  });

  it('rejects an empty file', async () => {
    renderWithProviders(<MediaUploader onUploaded={onUploaded} />);

    await userEvent.upload(fileInput(), new File([], 'empty.png', { type: 'image/png' }));

    expect(mockedRunPresignedUpload).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('The selected file is empty.');
  });

  it('cancels through the AbortController', async () => {
    let capturedSignal: AbortSignal | undefined;
    const pending = deferred<Media>();
    mockedRunPresignedUpload.mockImplementation(async ({ onStep, signal }) => {
      capturedSignal = signal;
      onStep?.('uploading');
      return pending.promise;
    });
    renderWithProviders(<MediaUploader onUploaded={onUploaded} />);

    await act(async () => {
      await userEvent.upload(fileInput(), videoFile);
    });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel upload' }));
    expect(capturedSignal?.aborted).toBe(true);

    await act(async () => {
      pending.reject(new MediaUploadError('aborted', { aborted: true }));
      await Promise.resolve();
    });

    expect(screen.getByTestId('media-dropzone')).toBeInTheDocument();
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it('shows an error and retries the upload with the same file', async () => {
    mockedRunPresignedUpload
      .mockRejectedValueOnce(new MediaUploadError('boom', { httpStatus: 500 }))
      .mockResolvedValueOnce(media);
    renderWithProviders(<MediaUploader onUploaded={onUploaded} />);

    await act(async () => {
      await userEvent.upload(fileInput(), videoFile);
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Upload failed. Try again.');

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Retry upload' }));
    });

    expect(mockedRunPresignedUpload).toHaveBeenCalledTimes(2);
    expect(onUploaded).toHaveBeenCalledWith(media);
  });

  it('reports an expired presigned URL distinctly', async () => {
    mockedRunPresignedUpload.mockRejectedValue(
      new MediaUploadError('expired', { httpStatus: 403 })
    );
    renderWithProviders(<MediaUploader onUploaded={onUploaded} />);

    await act(async () => {
      await userEvent.upload(fileInput(), videoFile);
    });

    expect(screen.getByRole('alert')).toHaveTextContent('The upload link expired. Try again.');
  });
});
