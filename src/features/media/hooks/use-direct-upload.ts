'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaKeys } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import type { Media } from '../schemas/media.schema';
import { directUpload } from '../services/media.service';

/** Direct multipart upload for small images — reload the library on success. */
export function useDirectUpload() {
  const queryClient = useQueryClient();

  return useMutation<Media, ApiError, File | Blob>({
    mutationFn: (file) => directUpload(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
  });
}
