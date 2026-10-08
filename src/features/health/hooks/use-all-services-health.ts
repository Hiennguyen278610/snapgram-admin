'use client';

import { useQueries } from '@tanstack/react-query';
import { healthKeys } from '@/lib/api/query-keys';
import { SERVICES, type ServiceId } from '@/lib/constants/services';
import { normalizeHealthStatus, type NormalizedStatus } from '../schemas/health.schema';
import { fetchServiceHealth } from './use-service-health';

export interface ServiceHealthEntry {
  id: ServiceId;
  labelKey: string;
  status: NormalizedStatus;
  /** ISO timestamp of the last successful check, or null while pending. */
  lastChecked: string | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface AllServicesHealth {
  services: ServiceHealthEntry[];
  isLoading: boolean;
  isError: boolean;
  lastChecked: string | null;
  refetch: () => void;
}

/** Fans out one health query per service and merges them into one view model. */
export function useAllServicesHealth(): AllServicesHealth {
  const results = useQueries({
    queries: SERVICES.map((service) => ({
      queryKey: healthKeys.service(service.id),
      queryFn: ({ signal }) => fetchServiceHealth(service.id, signal),
      staleTime: 15_000,
      retry: false,
    })),
  });

  const services: ServiceHealthEntry[] = SERVICES.map((service, index) => {
    const result = results[index];
    const raw = result.data?.status;

    return {
      id: service.id,
      labelKey: service.labelKey,
      status: raw ? normalizeHealthStatus(raw) : 'UNKNOWN',
      lastChecked: result.dataUpdatedAt > 0 ? new Date(result.dataUpdatedAt).toISOString() : null,
      isLoading: result.isLoading,
      isError: result.isError,
      error: result.error ?? null,
      refetch: () => {
        void result.refetch();
      },
    };
  });

  const checkedAt = results.reduce((latest, result) => Math.max(latest, result.dataUpdatedAt), 0);

  return {
    services,
    // Only the very first paint (no query has settled) counts as page loading.
    isLoading: results.every((result) => result.isLoading),
    // The page-level error state is reserved for a total outage; partial
    // failures still render their own card.
    isError: results.every((result) => result.isError),
    lastChecked: checkedAt > 0 ? new Date(checkedAt).toISOString() : null,
    refetch: () => {
      for (const result of results) {
        void result.refetch();
      }
    },
  };
}
