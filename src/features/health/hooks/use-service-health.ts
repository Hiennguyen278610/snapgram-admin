'use client';

import { useQuery } from '@tanstack/react-query';
import { healthKeys } from '@/lib/api/query-keys';
import type { ServiceId } from '@/lib/constants/services';
import { healthStatusSchema, type HealthStatus } from '../schemas/health.schema';

/**
 * Calls the Gateway health check endpoint (/api/admin/health/{id}).
 * Gateway-First architecture (Model B) forwards check to internal services.
 *
 * The endpoint answers `503 {status:'DOWN'}` when the upstream is unreachable, so
 * a "down" service is DATA, not a thrown error. The query only rejects when the
 * origin itself cannot be reached (or the payload is unrecognizable).
 */
export async function fetchServiceHealth(
  id: ServiceId,
  signal?: AbortSignal
): Promise<HealthStatus> {
  const res = await fetch(`/api/admin/health/${id}`, { signal, cache: 'no-store' });
  const payload: unknown = await res.json().catch(() => null);
  const parsed = healthStatusSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(`Invalid health response for ${id}`);
  }

  return parsed.data;
}

/**
 * Polls a single service health endpoint.
 *
 * `retry: false` keeps the status card honest: a failed check should surface
 * immediately rather than after three delayed attempts.
 */
export function useServiceHealth(id: ServiceId, refetchInterval?: number) {
  return useQuery({
    queryKey: healthKeys.service(id),
    queryFn: ({ signal }) => fetchServiceHealth(id, signal),
    staleTime: 15_000,
    refetchInterval,
    retry: false,
  });
}
