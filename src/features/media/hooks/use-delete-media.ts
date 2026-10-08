'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaKeys } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import { deleteMedia } from '../services/media.service';

/** conventions §6: deleting media invalidates the lists and the detail entry. */
export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (mediaId) => deleteMedia(mediaId),
    onSuccess: (_data, mediaId) => {
      void queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: mediaKeys.detail(mediaId) });
    },
  });
}
