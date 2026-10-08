import { http, HttpResponse } from 'msw';

const GATEWAY_URL = 'http://localhost:8080/api/media';
/** MinIO PUT target used by the presigned flow (step 2). */
export const MINIO_UPLOAD_URL = 'http://localhost:9000';

const OWNER_ID = '56030fa2-b07b-4599-8c1f-e1e8b4da9622';

export interface MockMedia {
  id: string;
  ownerId: string;
  url: string;
  thumbnailUrl: string | null;
  mimeType: string;
  sizeBytes: number;
  status: string;
  width: number | null;
  height: number | null;
  durationSec: number | null;
  createdAt: string;
}

function minioUrl(id: string, extension = 'bin'): string {
  return `${MINIO_UPLOAD_URL}/snapgram-media/${id}.${extension}`;
}

function seedMedia(
  id: string,
  mimeType: string,
  sizeBytes: number,
  createdAt: string,
  extra: Partial<MockMedia> = {}
): MockMedia {
  return {
    id,
    ownerId: OWNER_ID,
    url: minioUrl(id, mimeType.split('/')[1]),
    thumbnailUrl: mimeType.startsWith('image/') ? minioUrl(`${id}-thumb`, 'webp') : null,
    mimeType,
    sizeBytes,
    status: 'READY',
    width: null,
    height: null,
    durationSec: null,
    createdAt,
    ...extra,
  };
}

/**
 * Deterministic library fixture (6 items: 4 images + 2 videos) so pagination
 * and the thumbnail fallback can be exercised without a real MinIO.
 */
export const MEDIA_FIXTURE: readonly MockMedia[] = [
  seedMedia('aaaaaaaa-1111-4111-8111-111111111101', 'image/jpeg', 184_320, '2026-10-08T06:00:01Z', {
    width: 1080,
    height: 1080,
  }),
  seedMedia('aaaaaaaa-1111-4111-8111-111111111102', 'image/png', 402_944, '2026-10-08T06:05:02Z', {
    width: 720,
    height: 1280,
  }),
  seedMedia('aaaaaaaa-1111-4111-8111-111111111103', 'image/webp', 96_512, '2026-10-08T06:10:03Z', {
    width: 640,
    height: 640,
  }),
  seedMedia(
    'aaaaaaaa-1111-4111-8111-111111111104',
    'image/gif',
    1_258_291,
    '2026-10-08T06:15:04Z',
    { width: 480, height: 270 }
  ),
  seedMedia(
    'bbbbbbbb-2222-4222-8222-222222222201',
    'video/mp4',
    8_388_608,
    '2026-10-08T06:20:05Z',
    { width: 1920, height: 1080, durationSec: 42 }
  ),
  seedMedia(
    'bbbbbbbb-2222-4222-8222-222222222202',
    'video/webm',
    15_728_640,
    '2026-10-08T06:25:06Z',
    { width: 1280, height: 720, durationSec: 96 }
  ),
];

/** Mutable module state so delete/upload are observable across queries. */
let media: MockMedia[] = MEDIA_FIXTURE.map((item) => ({ ...item }));

/** Presigned uploads awaiting `POST /api/media/{id}/confirm`. */
const pendingUploads = new Map<string, MockMedia>();

let presignedSequence = 0;
/** When > 0, the next PUT(s) to MinIO answer 403 to model an expired URL. */
let failPutRemaining = 0;

/** Restores the deterministic fixture set (used by tests between cases). */
export function resetMedia(): void {
  media = MEDIA_FIXTURE.map((item) => ({ ...item }));
  resetPresigned();
}

/** Restores presigned-upload state (sequence + pending + failure toggle). */
export function resetPresigned(): void {
  pendingUploads.clear();
  presignedSequence = 0;
  failPutRemaining = 0;
}

/**
 * Forces the next `times` PUTs to MinIO to answer `403`, which is how an
 * expired presigned URL manifests (conventions §11.1). The FE must then
 * re-request a fresh URL and retry exactly once.
 */
export function failNextPresignedPut(times = 1): void {
  failPutRemaining = times;
}

/** Builds a media item from the fixture shape, overriding only what a test needs. */
export function makeMedia(overrides: Partial<MockMedia> = {}): MockMedia {
  return { ...MEDIA_FIXTURE[0], ...overrides };
}

function byId(id: string): MockMedia | undefined {
  return media.find((item) => item.id === id);
}

function nextMediaId(): string {
  presignedSequence += 1;
  return `cccccccc-3333-4333-8333-${String(presignedSequence).padStart(12, '0')}`;
}

function buildMedia(id: string, fileName: string, mimeType: string, sizeBytes: number): MockMedia {
  const extension = fileName.includes('.') ? fileName.split('.').pop() || 'bin' : 'bin';
  return {
    id,
    ownerId: OWNER_ID,
    url: minioUrl(id, extension),
    thumbnailUrl: mimeType.startsWith('image/') ? minioUrl(`${id}-thumb`, 'webp') : null,
    mimeType,
    sizeBytes,
    status: 'READY',
    width: null,
    height: null,
    durationSec: null,
    createdAt: new Date().toISOString(),
  };
}

function notFound(id: string) {
  return HttpResponse.json(
    {
      status: 404,
      error: 'Not Found',
      message: `Media not found: ${id}`,
      timestamp: new Date().toISOString(),
    },
    { status: 404 }
  );
}

/**
 * MSW matches handlers in REGISTRATION ORDER, so the literal `GET /api/media/me`
 * must come before `GET /api/media/:id` or `me` is swallowed by the `:id` route.
 */
export const mediaHandlers = [
  // GET /api/media/me — paginated library of the current admin.
  http.get(`${GATEWAY_URL}/me`, ({ request }) => {
    const searchParams = new URL(request.url).searchParams;
    const page = Math.max(0, Number(searchParams.get('page') ?? 0));
    const rawSize = Number(searchParams.get('size') ?? 20);
    // The live backend caps `size` at 50; mirror that here.
    const size = Math.min(rawSize > 0 ? rawSize : 20, 50);

    const totalElements = media.length;
    const totalPages = Math.ceil(totalElements / size);
    const content = media.slice(page * size, page * size + size);

    return HttpResponse.json({
      content,
      totalElements,
      totalPages,
      number: page,
      size,
      numberOfElements: content.length,
      first: page === 0,
      last: page >= totalPages - 1,
      empty: content.length === 0,
    });
  }),

  // Step 1 of the presigned flow.
  http.post(`${GATEWAY_URL}/presigned`, async ({ request }) => {
    const body = (await request.json()) as {
      fileName?: string;
      mimeType?: string;
      sizeBytes?: number;
    };
    if (!body?.fileName || !body?.mimeType) {
      return HttpResponse.json(
        { status: 400, error: 'Bad Request', message: 'fileName and mimeType are required' },
        { status: 400 }
      );
    }

    const mediaId = nextMediaId();
    const extension = body.fileName.includes('.') ? body.fileName.split('.').pop() : 'bin';
    pendingUploads.set(
      mediaId,
      buildMedia(mediaId, body.fileName, body.mimeType, body.sizeBytes ?? 0)
    );

    return HttpResponse.json({
      mediaId,
      uploadUrl: `${MINIO_UPLOAD_URL}/snapgram-media/${mediaId}.${extension}`,
      fileUrl: minioUrl(mediaId, extension),
      expiresInSeconds: 900,
    });
  }),

  // Step 3 of the presigned flow. Registered before the direct-upload literal is
  // irrelevant (different segment count), but keep the pair together for clarity.
  http.post(`${GATEWAY_URL}/:id/confirm`, ({ params }) => {
    const id = String(params.id);
    const pending = pendingUploads.get(id);
    if (!pending) return notFound(id);

    pendingUploads.delete(id);
    media = [pending, ...media];

    return HttpResponse.json({ ...pending });
  }),

  // Direct multipart upload (avatar / small image).
  http.post(`${GATEWAY_URL}/upload`, async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return HttpResponse.json(
        { status: 400, error: 'Bad Request', message: 'file is required' },
        { status: 400 }
      );
    }

    const created = buildMedia(nextMediaId(), file.name, file.type, file.size);
    media = [created, ...media];

    return HttpResponse.json({ ...created });
  }),

  http.get(`${GATEWAY_URL}/:id`, ({ params }) => {
    const item = byId(String(params.id));
    if (!item) return notFound(String(params.id));

    return HttpResponse.json({ ...item });
  }),

  http.delete(`${GATEWAY_URL}/:id`, ({ params }) => {
    const id = String(params.id);
    if (!byId(id)) return notFound(id);

    media = media.filter((item) => item.id !== id);

    return new HttpResponse(null, { status: 200 });
  }),

  /**
   * Mock MinIO storage. `PUT {uploadUrl}` is a direct browser XHR, not an axios
   * call. `failNextPresignedPut()` makes the next attempt answer 403 so the
   * retry-once path can be tested.
   */
  http.put(`${MINIO_UPLOAD_URL}/*`, () => {
    if (failPutRemaining > 0) {
      failPutRemaining -= 1;
      return new HttpResponse(null, { status: 403 });
    }
    return new HttpResponse(null, { status: 200 });
  }),
];
