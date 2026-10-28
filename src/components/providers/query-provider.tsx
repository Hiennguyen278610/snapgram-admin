'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const ReactQueryDevtools = dynamic(
  () =>
    import('@tanstack/react-query-devtools').then((mod) => ({
      default: mod.ReactQueryDevtools,
    })),
  { ssr: false }
);

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: (failureCount, error: unknown) => {
              const e = error as { httpStatus?: number };
              if (e?.httpStatus && [401, 403, 404, 422].includes(e.httpStatus)) {
                return false;
              }
              return failureCount < 3;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {mounted && process.env.NODE_ENV === 'development' ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}
