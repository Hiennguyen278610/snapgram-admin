import { NextResponse } from 'next/server';
import { SERVICES, type ServiceId } from '@/lib/constants/services';

/**
 * Server-side health proxy.
 *
 * Only the gateway (:8080) sends CORS headers, so the browser cannot call the
 * auth/content/media actuator endpoints directly. Routing those checks through
 * this Next.js handler removes CORS from the picture entirely (and keeps the
 * internal service URLs off the client).
 *
 * `/api/**` bypasses the auth middleware matcher, so no cookie is required.
 * The response shape stays compatible with the actuator `{ status }` payload;
 * the internal URL is never echoed back.
 */
export const dynamic = 'force-dynamic';

const ENV_MAP: Record<ServiceId, string | undefined> = {
  gateway: process.env.GATEWAY_URL,
  auth: process.env.AUTH_SERVICE_URL,
  content: process.env.CONTENT_SERVICE_URL,
  media: process.env.MEDIA_SERVICE_URL,
};

const TIMEOUT_MS = 3000;

export async function GET(_req: Request, { params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  const id = service as ServiceId;

  // Allow-list the path segment: never interpolate arbitrary user input into a
  // server-side fetch.
  if (!SERVICES.some((s) => s.id === id)) {
    return NextResponse.json({ error: 'Unknown service' }, { status: 400 });
  }

  const baseUrl = ENV_MAP[id];
  if (!baseUrl) {
    return NextResponse.json(
      { status: 'UNKNOWN', error: 'Service URL not configured' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${baseUrl}/actuator/health`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, {
      status: 200,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err) {
    return NextResponse.json(
      { status: 'DOWN', error: err instanceof Error ? err.message : 'Unknown' },
      { status: 503 }
    );
  }
}
