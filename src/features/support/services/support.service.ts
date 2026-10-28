import { apiClient } from '@/lib/api/client';
import type { SupportTicketFilters } from '@/lib/api/query-keys';
import {
  pageSupportTicketSchema,
  supportTicketSchema,
  type PageSupportTicket,
  type ReplySupportTicketInput,
  type SupportTicket,
} from '../schemas/support.schema';

const SUPPORT_ENDPOINT = '/api/admin/support/tickets';

export async function fetchSupportTickets(
  filters: SupportTicketFilters = {}
): Promise<PageSupportTicket> {
  const { data } = await apiClient.get(SUPPORT_ENDPOINT, {
    params: {
      status: filters.status,
      category: filters.category,
      priority: filters.priority,
      page: filters.page ?? 0,
      size: filters.size ?? 20,
    },
  });

  const parsed = pageSupportTicketSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Invalid support tickets response shape');
  }

  return parsed.data;
}

export async function fetchSupportTicketDetail(id: string): Promise<SupportTicket> {
  const { data } = await apiClient.get(`${SUPPORT_ENDPOINT}/${id}`);

  const parsed = supportTicketSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Invalid support ticket response shape');
  }

  return parsed.data;
}

export async function replySupportTicket(
  id: string,
  payload: ReplySupportTicketInput
): Promise<SupportTicket> {
  const { data } = await apiClient.patch(`${SUPPORT_ENDPOINT}/${id}/reply`, payload);

  const parsed = supportTicketSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Invalid support ticket reply response');
  }

  return parsed.data;
}
