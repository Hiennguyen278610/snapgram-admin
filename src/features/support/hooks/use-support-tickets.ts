'use client';

import { useQuery } from '@tanstack/react-query';
import { supportKeys, type SupportTicketFilters } from '@/lib/api/query-keys';
import { fetchSupportTickets } from '../services/support.service';

export function useSupportTickets(filters: SupportTicketFilters = {}) {
  return useQuery({
    queryKey: supportKeys.list(filters),
    queryFn: () => fetchSupportTickets(filters),
  });
}
