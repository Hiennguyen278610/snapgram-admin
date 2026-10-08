// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { MEDIA_FIXTURE, resetMedia } from '@/mocks/handlers/media.handlers';
import type { ApiError } from '@/lib/api/types';
import {
  MEDIA_ENDPOINT,
  confirmPresignedUpload,
  deleteMedia,
  directUpload,
  fetchMediaDetail,
  fetchMyMedia,
  requestPresignedUrl,
} from './media.service';

const MEDIA_URL = 'http://localhost:8080/api/media';
const FIRST_ID = MEDIA_FIXTURE[0].id;
const VIDEO_ID = MEDIA_FIXTURE[4].id;

describe('media.service', () => {
  afterEach(() => {
    resetMedia();
    vi.restoreAllMocks();
  });

  it('exposes the media endpoint constant', () => {
    expect(MEDIA_ENDPOINT).toBe('/api/media');
  });

  it('returns the seeded library on the default page', async () => {
    const page = await fetchMyMedia();

    expect(page.content).toHaveLength(MEDIA_FIXTURE.length);
    expect(page.totalElements).toBe(MEDIA_FIXTURE.length);
    expect(page.number).toBe(0);
    expect(page.size).toBe(20);
    expect(page.first).toBe(true);
    expect(page.last).toBe(true);
    expect(page.empty).toBe(false);
  });

  it('paginates with page/size', async () => {
    const page = await fetchMyMedia({ page: 1, size: 2 });

    expect(page.content).toHaveLength(2);
    expect(page.number).toBe(1);
    expect(page.size).toBe(2);
    expect(page.totalPages).toBe(3);
    expect(page.first).toBe(false);
  });

  it('returns an empty page past the last one', async () => {
    const page = await fetchMyMedia({ page: 9, size: 20 });

    expect(page.content).toEqual([]);
    expect(page.empty).toBe(true);
  });

  it('throws a normalized server ApiError when the list shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.get(`${MEDIA_URL}/me`, () => HttpResponse.json({ content: 'nope' })));

    await expect(fetchMyMedia()).rejects.toMatchObject({
      httpStatus: 0,
      kind: 'server',
      message: 'Invalid response shape',
    } satisfies Partial<ApiError>);

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('propagates the normalized 500 ApiError from the interceptor', async () => {
    server.use(
      http.get(`${MEDIA_URL}/me`, () =>
        HttpResponse.json(
          { status: 500, error: 'Internal Server Error', message: 'An unexpected error occurred' },
          { status: 500 }
        )
      )
    );

    await expect(fetchMyMedia()).rejects.toMatchObject({
      httpStatus: 500,
      kind: 'server',
    } satisfies Partial<ApiError>);
  });

  it('fetches a single media item by id', async () => {
    const media = await fetchMediaDetail(FIRST_ID);

    expect(media.id).toBe(FIRST_ID);
    expect(media.mimeType).toBe('image/jpeg');
    expect(media.status).toBe('READY');
  });

  it('surfaces a 404 ApiError for an unknown media id', async () => {
    await expect(fetchMediaDetail('does-not-exist')).rejects.toMatchObject({
      httpStatus: 404,
      kind: 'notFound',
    } satisfies Partial<ApiError>);
  });

  it('throws a normalized ApiError when the detail shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.get(`${MEDIA_URL}/:id`, () => HttpResponse.json({ nope: true })));

    await expect(fetchMediaDetail(FIRST_ID)).rejects.toMatchObject({
      httpStatus: 0,
      kind: 'server',
      message: 'Invalid response shape',
    } satisfies Partial<ApiError>);

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('escape-encodes the path id so a hostile id cannot change the route', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    let receivedUrl = '';
    server.use(
      http.get(`${MEDIA_URL}/:id`, ({ request }) => {
        receivedUrl = request.url;
        return HttpResponse.json({ nope: true });
      })
    );

    await expect(fetchMediaDetail('a/b c')).rejects.toBeTruthy();

    expect(receivedUrl).toContain('a%2Fb%20c');
  });

  it('requests a presigned URL with the exact request body', async () => {
    const response = await requestPresignedUrl({
      fileName: 'clip.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 8_000_000,
    });

    expect(response.mediaId).toBeTruthy();
    expect(response.uploadUrl).toContain('http://localhost:9000/snapgram-media/');
    expect(response.fileUrl).toContain('http://localhost:9000/snapgram-media/');
    expect(response.expiresInSeconds).toBe(900);
  });

  it('answers 400 when fileName/mimeType are missing', async () => {
    server.use(
      http.post(`${MEDIA_URL}/presigned`, () =>
        HttpResponse.json({ status: 400, error: 'Bad Request' }, { status: 400 })
      )
    );

    await expect(
      requestPresignedUrl({ fileName: '', mimeType: '', sizeBytes: 0 })
    ).rejects.toMatchObject({ httpStatus: 400 } satisfies Partial<ApiError>);
  });

  it('throws a normalized ApiError when the presigned response shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.post(`${MEDIA_URL}/presigned`, () => HttpResponse.json({ nope: true })));

    await expect(
      requestPresignedUrl({ fileName: 'a.jpg', mimeType: 'image/jpeg', sizeBytes: 10 })
    ).rejects.toMatchObject({ message: 'Invalid response shape' } satisfies Partial<ApiError>);

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('confirms a presigned upload and exposes it in the library', async () => {
    const presigned = await requestPresignedUrl({
      fileName: 'clip.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 8_000_000,
    });

    const confirmed = await confirmPresignedUpload(presigned.mediaId);

    expect(confirmed.id).toBe(presigned.mediaId);
    expect(confirmed.mimeType).toBe('video/mp4');
    expect(confirmed.status).toBe('READY');

    const page = await fetchMyMedia();
    expect(page.totalElements).toBe(MEDIA_FIXTURE.length + 1);
    expect(page.content[0].id).toBe(presigned.mediaId);
  });

  it('returns 404 when confirming an unknown media id', async () => {
    await expect(confirmPresignedUpload('nope')).rejects.toMatchObject({
      httpStatus: 404,
      kind: 'notFound',
    } satisfies Partial<ApiError>);
  });

  it('throws a normalized ApiError when the confirm shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const presigned = await requestPresignedUrl({
      fileName: 'a.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 10,
    });
    server.use(http.post(`${MEDIA_URL}/:id/confirm`, () => HttpResponse.json({ nope: true })));

    await expect(confirmPresignedUpload(presigned.mediaId)).rejects.toMatchObject({
      message: 'Invalid response shape',
    } satisfies Partial<ApiError>);

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('direct-uploads a small file and exposes it in the library', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'avatar.png', { type: 'image/png' });

    const uploaded = await directUpload(file);

    expect(uploaded.mimeType).toBe('image/png');
    expect(uploaded.sizeBytes).toBe(3);
    expect((await fetchMyMedia()).totalElements).toBe(MEDIA_FIXTURE.length + 1);
  });

  it('throws a normalized ApiError when the direct upload shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.post(`${MEDIA_URL}/upload`, () => HttpResponse.json({ nope: true })));

    await expect(
      directUpload(new File([new Uint8Array([1])], 'a.png', { type: 'image/png' }))
    ).rejects.toMatchObject({ message: 'Invalid response shape' } satisfies Partial<ApiError>);

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('deletes media with an empty 200 body', async () => {
    await expect(deleteMedia(FIRST_ID)).resolves.toBeUndefined();

    expect((await fetchMyMedia()).totalElements).toBe(MEDIA_FIXTURE.length - 1);
    await expect(fetchMediaDetail(FIRST_ID)).rejects.toMatchObject({ httpStatus: 404 });
  });

  it('returns a 404 for deleting an unknown media id', async () => {
    await expect(deleteMedia('does-not-exist')).rejects.toMatchObject({
      httpStatus: 404,
      kind: 'notFound',
    } satisfies Partial<ApiError>);
  });

  it('exposes a video item with its duration metadata', async () => {
    const video = await fetchMediaDetail(VIDEO_ID);

    expect(video.mimeType).toBe('video/mp4');
    expect(video.durationSec).toBe(42);
  });

  it('resetMedia restores the default fixture set', async () => {
    await deleteMedia(FIRST_ID);
    resetMedia();

    expect((await fetchMediaDetail(FIRST_ID)).id).toBe(FIRST_ID);
    expect((await fetchMyMedia()).totalElements).toBe(MEDIA_FIXTURE.length);
  });
});
