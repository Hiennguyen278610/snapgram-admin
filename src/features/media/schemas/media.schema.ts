import { z } from 'zod';

/**
 * Media schemas — field-by-field from `docs/ui-plan/api-docs/media-apidocs.md`
 * (Media Service Swagger, verified 2026-10-08).
 *
 * The DTO marks every field optional; the FE treats the identity/URL fields as
 * required (the UI cannot render a tile without them) while keeping the
 * derived-metadata fields (`width`, `height`, `durationSec`, `thumbnailUrl`)
 * nullable + optional — images never carry a duration and videos may not carry
 * a thumbnail.
 *
 * Zod style follows the rest of the repo (see `report.schema.ts`): plain
 * `z.string()` for ids / date-times instead of `.uuid()` / `.datetime()`.
 *
 * BI-010 fixed 2026-10-16: the API Gateway now forwards the admin httpOnly
 * cookie to `/api/media/**`. Unit/E2E still run against MSW for isolation.
 */
export const MEDIA_STATUSES = ['PENDING', 'READY', 'PROCESSING', 'FAILED', 'DELETED'] as const;

/** MIME whitelist validated on the client BEFORE requesting a presigned URL (conventions §11.1). */
export const MEDIA_MIME_WHITELIST = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

/** Direct multipart upload is only allowed under this size (conventions §11.1). */
export const MAX_DIRECT_UPLOAD_BYTES = 5 * 1024 * 1024;

export const mediaStatusSchema = z.enum(MEDIA_STATUSES);

export const mediaSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  url: z.string(),
  thumbnailUrl: z.string().nullable().optional(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  status: z.string(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  durationSec: z.number().nullable().optional(),
  createdAt: z.string(),
});

export const pageMediaSchema = z.object({
  content: z.array(mediaSchema).optional().default([]),
  totalElements: z.number().optional().default(0),
  totalPages: z.number().optional().default(0),
  number: z.number().optional().default(0),
  size: z.number().optional().default(0),
  numberOfElements: z.number().optional().default(0),
  first: z.boolean().optional().default(true),
  last: z.boolean().optional().default(true),
  empty: z.boolean().optional().default(false),
});

/** `POST /api/media/presigned` request body. */
export const presignedUrlRequestSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().min(0),
});

/** `POST /api/media/presigned` response body. */
export const presignedUrlResponseSchema = z.object({
  mediaId: z.string(),
  uploadUrl: z.string(),
  fileUrl: z.string(),
  expiresInSeconds: z.number(),
});

export type Media = z.infer<typeof mediaSchema>;
export type PageMedia = z.infer<typeof pageMediaSchema>;
export type PresignedUrlRequest = z.infer<typeof presignedUrlRequestSchema>;
export type PresignedUrlResponse = z.infer<typeof presignedUrlResponseSchema>;
export type MediaStatus = (typeof MEDIA_STATUSES)[number];

/** The minimal `File` surface the validators need (so tests can stay plain objects). */
export interface MediaFileLike {
  name: string;
  type: string;
  size: number;
}

/** Client-side validation failure codes — mapped to `media.validation.*` i18n keys. */
export type MediaValidationError =
  'mimeNotAllowed' | 'fileEmpty' | 'fileTooLarge' | 'presignedRequired';

export function isAllowedMimeType(mimeType: string): boolean {
  return (MEDIA_MIME_WHITELIST as readonly string[]).includes(mimeType);
}

export function isVideoMimeType(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

/**
 * Presigned flow is mandatory for every video and for any image of 5MB or more
 * (conventions §11.1). Direct upload is the fast path for images under 5MB —
 * the boundary is exclusive so exactly 5MB goes through the presigned flow.
 */
export function requiresPresignedUpload(mimeType: string, sizeBytes: number): boolean {
  return isVideoMimeType(mimeType) || sizeBytes >= MAX_DIRECT_UPLOAD_BYTES;
}

/**
 * Validates MIME whitelist + size before asking the API for an `uploadUrl`
 * (conventions §11.1 › Client Pre-validation). Returns `null` when the file is
 * acceptable.
 */
export function validateMediaFile(file: MediaFileLike): MediaValidationError | null {
  if (file.size <= 0) return 'fileEmpty';
  if (!isAllowedMimeType(file.type)) return 'mimeNotAllowed';
  return null;
}

/**
 * Extra guard for the direct multipart path: videos and files of 5MB or more
 * must go through the presigned flow instead.
 */
export function validateDirectUploadFile(file: MediaFileLike): MediaValidationError | null {
  const baseError = validateMediaFile(file);
  if (baseError) return baseError;
  if (file.size >= MAX_DIRECT_UPLOAD_BYTES) return 'fileTooLarge';
  if (isVideoMimeType(file.type)) return 'presignedRequired';
  return null;
}
