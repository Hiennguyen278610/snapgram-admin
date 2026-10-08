import { describe, expect, it } from 'vitest';
import {
  MAX_DIRECT_UPLOAD_BYTES,
  isAllowedMimeType,
  isVideoMimeType,
  mediaSchema,
  pageMediaSchema,
  presignedUrlRequestSchema,
  presignedUrlResponseSchema,
  requiresPresignedUpload,
  validateDirectUploadFile,
  validateMediaFile,
} from './media.schema';

const validMedia = {
  id: 'm-1',
  ownerId: 'u-1',
  url: 'http://localhost:9000/snapgram-media/m-1.jpg',
  thumbnailUrl: 'http://localhost:9000/snapgram-media/m-1-thumb.webp',
  mimeType: 'image/jpeg',
  sizeBytes: 1024,
  status: 'READY',
  width: 100,
  height: 100,
  durationSec: null,
  createdAt: '2026-10-08T06:00:00Z',
};

describe('media.schema', () => {
  it('accepts a fully populated MediaResponse', () => {
    const parsed = mediaSchema.safeParse(validMedia);
    expect(parsed.success).toBe(true);
  });

  it('accepts missing nullable metadata fields', () => {
    const parsed = mediaSchema.safeParse({
      id: 'm-1',
      ownerId: 'u-1',
      url: 'http://localhost:9000/x',
      mimeType: 'video/mp4',
      sizeBytes: 10,
      status: 'PROCESSING',
      createdAt: '2026-10-08T06:00:00Z',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.thumbnailUrl).toBeUndefined();
      expect(parsed.data.durationSec).toBeUndefined();
    }
  });

  it('rejects a media payload without an id', () => {
    expect(
      mediaSchema.safeParse({
        ownerId: 'u-1',
        url: 'http://localhost:9000/x',
        mimeType: 'image/jpeg',
        sizeBytes: 10,
        status: 'READY',
        createdAt: '2026-10-08T06:00:00Z',
      }).success
    ).toBe(false);
  });

  it('defaults PageMediaResponse fields when the backend omits them', () => {
    const parsed = pageMediaSchema.parse({ content: [validMedia] });

    expect(parsed.content).toHaveLength(1);
    expect(parsed.totalElements).toBe(0);
    expect(parsed.totalPages).toBe(0);
    expect(parsed.number).toBe(0);
    expect(parsed.first).toBe(true);
    expect(parsed.last).toBe(true);
    expect(parsed.empty).toBe(false);
  });

  it('validates the presigned request body (fileName + mimeType min 1, sizeBytes >= 0)', () => {
    expect(
      presignedUrlRequestSchema.safeParse({
        fileName: 'a.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 0,
      }).success
    ).toBe(true);
    expect(
      presignedUrlRequestSchema.safeParse({ fileName: '', mimeType: 'image/jpeg', sizeBytes: 1 })
        .success
    ).toBe(false);
    expect(
      presignedUrlRequestSchema.safeParse({
        fileName: 'a.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: -1,
      }).success
    ).toBe(false);
  });

  it('validates the presigned response body', () => {
    expect(
      presignedUrlResponseSchema.safeParse({
        mediaId: 'm-1',
        uploadUrl: 'http://localhost:9000/x',
        fileUrl: 'http://localhost:9000/x',
        expiresInSeconds: 900,
      }).success
    ).toBe(true);
    expect(presignedUrlResponseSchema.safeParse({ mediaId: 'm-1' }).success).toBe(false);
  });

  it('knows the MIME whitelist', () => {
    expect(isAllowedMimeType('image/jpeg')).toBe(true);
    expect(isAllowedMimeType('video/mp4')).toBe(true);
    expect(isAllowedMimeType('application/pdf')).toBe(false);
    expect(isAllowedMimeType('')).toBe(false);
  });

  it('detects video MIME types', () => {
    expect(isVideoMimeType('video/mp4')).toBe(true);
    expect(isVideoMimeType('image/png')).toBe(false);
  });

  it('requires the presigned flow for every video and for files of 5MB or more', () => {
    expect(requiresPresignedUpload('video/mp4', 10)).toBe(true);
    expect(requiresPresignedUpload('image/jpeg', MAX_DIRECT_UPLOAD_BYTES)).toBe(true);
    expect(requiresPresignedUpload('image/jpeg', MAX_DIRECT_UPLOAD_BYTES - 1)).toBe(false);
  });

  it('validates MIME whitelist + empty files before requesting a presigned URL', () => {
    expect(validateMediaFile({ name: 'a.jpg', type: 'image/jpeg', size: 10 })).toBeNull();
    expect(validateMediaFile({ name: 'a.pdf', type: 'application/pdf', size: 10 })).toBe(
      'mimeNotAllowed'
    );
    expect(validateMediaFile({ name: 'a.jpg', type: 'image/jpeg', size: 0 })).toBe('fileEmpty');
  });

  it('rejects oversized and video files from the direct upload path', () => {
    expect(
      validateDirectUploadFile({
        name: 'big.png',
        type: 'image/png',
        size: MAX_DIRECT_UPLOAD_BYTES,
      })
    ).toBe('fileTooLarge');
    expect(validateDirectUploadFile({ name: 'clip.mp4', type: 'video/mp4', size: 1024 })).toBe(
      'presignedRequired'
    );
    expect(
      validateDirectUploadFile({
        name: 'small.png',
        type: 'image/png',
        size: MAX_DIRECT_UPLOAD_BYTES - 1,
      })
    ).toBeNull();
  });
});
