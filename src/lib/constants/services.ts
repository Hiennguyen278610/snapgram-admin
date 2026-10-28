/**
 * Infrastructure service registry for the System Health module.
 *
 * All service health checks go through API Gateway (`/api/admin/health/{id}`),
 * following Gateway-First architecture (Model B).
 *
 * `EXTERNAL_LINKS` uses `NEXT_PUBLIC_*` because those URLs are rendered as
 * user-facing `<a href>` targets; `process.env.NEXT_PUBLIC_*` is inlined at
 * build time, so reading it at module scope here is safe.
 */
export type ServiceId =
  | 'gateway'
  | 'auth'
  | 'chatbot'
  | 'chat'
  | 'content'
  | 'media'
  | 'notification'
  | 'payment'
  | 'recommender';

export interface ServiceConfig {
  id: ServiceId;
  labelKey: string;
}

export const SERVICES: ServiceConfig[] = [
  { id: 'gateway', labelKey: 'health.services.gateway' },
  { id: 'auth', labelKey: 'health.services.auth' },
  { id: 'chatbot', labelKey: 'health.services.chatbot' },
  { id: 'chat', labelKey: 'health.services.chat' },
  { id: 'content', labelKey: 'health.services.content' },
  { id: 'media', labelKey: 'health.services.media' },
  { id: 'notification', labelKey: 'health.services.notification' },
  { id: 'payment', labelKey: 'health.services.payment' },
  { id: 'recommender', labelKey: 'health.services.recommender' },
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
