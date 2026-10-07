import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';

import { useAdminLogin } from './use-admin-login';
import { makeQueryClient } from '@/test-utils/render';
import enMessages from '../../../../messages/en.json';

function wrapper({ children }: { children: ReactNode }) {
  const qc = makeQueryClient();
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </NextIntlClientProvider>
  );
}

describe('useAdminLogin', () => {
  it('returns a mutation in idle state', () => {
    const { result } = renderHook(() => useAdminLogin(), { wrapper });
    expect(result.current.mutateAsync).toBeDefined();
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });
});
