'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaKeys } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import type { Media } from '../schemas/media.schema';
import { confirmPresignedUpload } from '../services/media.service';

/**
 * Step 3 of the presigned flow. Mutation variable is the media id
 * (conventions §6: confirm reloads the library, and the new detail entry).
 */
export function useConfirmUpload() {
  const queryClient = useQueryClient();

  return useMutation<Media, ApiError, string>({
    mutationFn: (mediaId) => confirmPresignedUpload(mediaId),
    onSuccess: (_data, mediaId) => {
      void queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: mediaKeys.detail(mediaId) });
    },
  });
}
