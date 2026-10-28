'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supportKeys } from '@/lib/api/query-keys';
import type { ReplySupportTicketInput, SupportTicket } from '../schemas/support.schema';
import { replySupportTicket } from '../services/support.service';

export interface ReplyTicketVariables {
  id: string;
  payload: ReplySupportTicketInput;
}

export function useReplySupportTicket() {
  const queryClient = useQueryClient();

  return useMutation<SupportTicket, Error, ReplyTicketVariables>({
    mutationFn: ({ id, payload }) => replySupportTicket(id, payload),
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(supportKeys.detail(id), data);
      void queryClient.invalidateQueries({ queryKey: supportKeys.lists() });
    },
  });
}
