/**
 * Infrastructure service registry for the System Health module.
 *
 * The four service base URLs are consumed ONLY by the server-side proxy route
 * (`src/app/api/health/[service]/route.ts`) via `envKey`. They intentionally use
 * non-public env names so internal ports never leak into the client bundle.
 *
 * `EXTERNAL_LINKS` uses `NEXT_PUBLIC_*` because those URLs are rendered as
 * user-facing `<a href>` targets; `process.env.NEXT_PUBLIC_*` is inlined at
 * build time, so reading it at module scope here is safe.
 */
export type ServiceId = 'gateway' | 'auth' | 'content' | 'media';

export interface ServiceConfig {
  id: ServiceId;
  labelKey: string;
  envKey: string;
}

export const SERVICES: ServiceConfig[] = [
  { id: 'gateway', labelKey: 'health.services.gateway', envKey: 'GATEWAY_URL' },
  { id: 'auth', labelKey: 'health.services.auth', envKey: 'AUTH_SERVICE_URL' },
  { id: 'content', labelKey: 'health.services.content', envKey: 'CONTENT_SERVICE_URL' },
  { id: 'media', labelKey: 'health.services.media', envKey: 'MEDIA_SERVICE_URL' },
];

/**
 * Public dashboard links. `process.env.NEXT_PUBLIC_*` is inlined at build time,
 * but a localhost fallback (matching `.env.example`) keeps the links usable in
 * environments that run without the env file (e.g. unit tests), mirroring the
 * literals already used by the sidebar.
 */
export const EXTERNAL_LINKS = [
  {
    labelKey: 'health.external.kafka',
    url: process.env.NEXT_PUBLIC_KAFKA_UI_URL ?? 'http://localhost:8089',
  },
  {
    labelKey: 'health.external.minio',
    url: process.env.NEXT_PUBLIC_MINIO_CONSOLE_URL ?? 'http://localhost:9001',
  },
  {
    labelKey: 'health.external.mailpit',
    url: process.env.NEXT_PUBLIC_MAILPIT_URL ?? 'http://localhost:8025',
  },
] as const;
