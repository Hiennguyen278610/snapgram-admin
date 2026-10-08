'use client';

import { useMutation } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/types';
import type { PresignedUrlRequest, PresignedUrlResponse } from '../schemas/media.schema';
import { requestPresignedUrl } from '../services/media.service';

/** Step 1 of the presigned flow — no cached data to invalidate yet. */
export function useRequestPresignedUrl() {
  return useMutation<PresignedUrlResponse, ApiError, PresignedUrlRequest>({
    mutationFn: (payload) => requestPresignedUrl(payload),
  });
}
