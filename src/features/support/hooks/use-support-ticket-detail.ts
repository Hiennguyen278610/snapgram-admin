'use client';

import { useQuery } from '@tanstack/react-query';
import { supportKeys } from '@/lib/api/query-keys';
import { fetchSupportTicketDetail } from '../services/support.service';

export function useSupportTicketDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: supportKeys.detail(id ?? ''),
    queryFn: () => fetchSupportTicketDetail(id!),
    enabled: Boolean(id),
  });
}
