import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    // MinIO object storage (conventions §11.2). This is the ONLY allowed edit to
    // next.config.ts besides the next-intl plugin + devIndicators (Rule 4).
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
