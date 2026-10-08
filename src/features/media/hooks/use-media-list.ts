'use client';

import { useQuery } from '@tanstack/react-query';
import { mediaKeys, type MediaFilters } from '@/lib/api/query-keys';
import { fetchMyMedia } from '../services/media.service';

export function useMediaList(filters: MediaFilters) {
  return useQuery({
    queryKey: mediaKeys.list(filters),
    queryFn: () => fetchMyMedia(filters),
    staleTime: 30_000,
  });
}
