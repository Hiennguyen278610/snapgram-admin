import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const minioUrlStr =
  process.env.MINIO_URL || process.env.NEXT_PUBLIC_MINIO_URL || 'http://localhost:9000';

function getMinioPattern(urlStr: string) {
  try {
    const parsed = new URL(urlStr);
    return {
      protocol: (parsed.protocol.replace(':', '') || 'http') as 'http' | 'https',
      hostname: parsed.hostname || 'localhost',
      port: parsed.port || undefined,
      pathname: '/**',
    };
  } catch {
    return {
      protocol: 'http' as const,
      hostname: 'localhost',
      port: '9000',
      pathname: '/**',
    };
  }
}

const minioPattern = getMinioPattern(minioUrlStr);

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    // MinIO object storage (A1: dynamic remotePatterns via env).
    remotePatterns: [
      minioPattern,
      ...(minioPattern.hostname !== 'localhost'
        ? [
            {
              protocol: 'http' as const,
              hostname: 'localhost',
              port: '9000',
              pathname: '/**',
            },
          ]
        : []),
    ],
  },
  // Same-origin rewrites for API Gateway (D1)
  async rewrites() {
    const gatewayUrl =
      process.env.GATEWAY_URL ||
      process.env.NEXT_PUBLIC_GATEWAY_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:8080';

    return [
      {
        source: '/api/:path*',
        destination: `${gatewayUrl}/api/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
