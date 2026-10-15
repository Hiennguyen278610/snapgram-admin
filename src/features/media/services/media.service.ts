import { apiClient } from '@/lib/api/client';
import type { MediaFilters } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import {
  mediaSchema,
  pageMediaSchema,
  presignedUrlResponseSchema,
  type Media,
  type PageMedia,
  type PresignedUrlRequest,
  type PresignedUrlResponse,
} from '../schemas/media.schema';

// BI-010 fixed 2026-10-16 — gateway now forwards the admin cookie to /api/media/**.
export const MEDIA_ENDPOINT = '/api/media';

function invalidShape(label: string, data: unknown, issues: unknown): ApiError {
  console.warn(`[media] Invalid ${label} response shape`, issues);
  return {
    httpStatus: 0,
    kind: 'server',
    message: 'Invalid response shape',
    rawResponse: data,
  };
}

/**
 * GET /api/media/me — the current admin's own library.
 *
 * `page` defaults to 0 and `size` to 20. The literal `/me` segment is matched by
 * the MSW handler BEFORE `/:id`, otherwise the detail handler swallows it.
 *
 * BI-010 fixed 2026-10-16 — gateway now forwards the admin cookie to /api/media/**.
 */
export async function fetchMyMedia(filters: MediaFilters = {}): Promise<PageMedia> {
  const params: Record<string, string | number> = {
    page: filters.page ?? 0,
    size: filters.size ?? 20,
  };

  const { data } = await apiClient.get(`${MEDIA_ENDPOINT}/me`, { params });

  const parsed = pageMediaSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('media list', data, parsed.error.issues);
  }

  return parsed.data;
}

// BI-010 fixed 2026-10-16 — gateway now forwards the admin cookie to /api/media/**.
export async function fetchMediaDetail(mediaId: string): Promise<Media> {
  const { data } = await apiClient.get(`${MEDIA_ENDPOINT}/${encodeURIComponent(mediaId)}`);

  const parsed = mediaSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('media detail', data, parsed.error.issues);
  }

  return parsed.data;
}

/**
 * Step 1 of the presigned flow (conventions §11.1): ask the Media Service for a
 * signed PUT URL. The client pre-validates MIME + size before calling this.
 *
 * BI-010 fixed 2026-10-16 — gateway now forwards the admin cookie to /api/media/**.
 */
export async function requestPresignedUrl(
  payload: PresignedUrlRequest
): Promise<PresignedUrlResponse> {
  const { data } = await apiClient.post(`${MEDIA_ENDPOINT}/presigned`, payload);

  const parsed = presignedUrlResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('presigned url', data, parsed.error.issues);
  }

  return parsed.data;
}

/**
 * Step 3 of the presigned flow: the Media Service verifies the object on MinIO
 * and extracts metadata.
 *
 * BI-010 fixed 2026-10-16 — gateway now forwards the admin cookie to /api/media/**.
 */
export async function confirmPresignedUpload(mediaId: string): Promise<Media> {
  const { data } = await apiClient.post(`${MEDIA_ENDPOINT}/${encodeURIComponent(mediaId)}/confirm`);

  const parsed = mediaSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('confirm upload', data, parsed.error.issues);
  }

  return parsed.data;
}

/**
 * Direct multipart upload — reserved for avatars / small images (< 5MB).
 * Axios sets the multipart boundary automatically for a `FormData` body.
 *
 * BI-010 fixed 2026-10-16 — gateway now forwards the admin cookie to /api/media/**.
 */
export async function directUpload(file: File | Blob): Promise<Media> {
  const body = new FormData();
  body.append('file', file);

  const { data } = await apiClient.post(`${MEDIA_ENDPOINT}/upload`, body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const parsed = mediaSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('direct upload', data, parsed.error.issues);
  }

  return parsed.data;
}

/** `DELETE /api/media/{id}` answers `200` with an empty body. */
// BI-010 fixed 2026-10-16 — gateway now forwards the admin cookie to /api/media/**.
export async function deleteMedia(mediaId: string): Promise<void> {
  await apiClient.delete(`${MEDIA_ENDPOINT}/${encodeURIComponent(mediaId)}`);
}
