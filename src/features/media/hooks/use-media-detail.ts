'use client';

import { useQuery } from '@tanstack/react-query';
import { mediaKeys } from '@/lib/api/query-keys';
import { fetchMediaDetail } from '../services/media.service';

export function useMediaDetail(mediaId: string) {
  return useQuery({
    queryKey: mediaKeys.detail(mediaId),
    queryFn: () => fetchMediaDetail(mediaId),
    enabled: !!mediaId,
    staleTime: 30_000,
  });
}
