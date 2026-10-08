import { z } from 'zod';

/**
 * The actuator responds with a status-only payload
 * (`{"groups":["liveness","readiness"],"status":"UP"}`) — there is no `db`,
 * `diskSpace` or `ping` component detail, so the schema intentionally models
 * only what the backend actually returns.
 */
export const healthStatusSchema = z.object({
  status: z.string(),
  error: z.string().optional(),
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;

export type NormalizedStatus = 'UP' | 'DOWN' | 'UNKNOWN';

/** Maps any actuator status string onto the three UI states. */
export function normalizeHealthStatus(status: string): NormalizedStatus {
  if (status === 'UP') return 'UP';
  if (status === 'DOWN' || status === 'OUT_OF_SERVICE') return 'DOWN';
  return 'UNKNOWN';
}
