import { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import enMessages from '../../messages/en.json';

interface WrapperProps {
  children: ReactNode;
}

function AllProviders({ children }: WrapperProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Default seed for authKeys.me() so components checking permissions default to ADMIN in tests
  queryClient.setQueryData(['auth', 'me'], {
    id: 'admin-id',
    username: 'admin',
    displayName: 'Snapgram Admin',
    email: 'admin@snapgram.com',
    role: 'ADMIN',
    roles: ['ADMIN'],
    permissions: [
      'USER:READ',
      'USER:BAN',
      'USER:UNBAN',
      'USER:ROLE_ASSIGN',
      'CONTENT:MODERATE',
      'POST:DELETE',
      'COMMENT:DELETE',
      'STORY:DELETE',
      'REPORT:VIEW',
      'REPORT:RESOLVE',
      'REPORT:DISMISS',
      'SUPPORT:TICKET_READ',
      'SUPPORT:TICKET_MANAGE',
      'SUPPORT:USER_ASSIST',
      'SYSTEM:SETTINGS_READ',
      'SYSTEM:SETTINGS_WRITE',
      'AUDIT:VIEW',
      'PAYMENT:READ',
      'PAYMENT:RECONCILE',
    ],
    emailVerified: true,
  });

  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </NextIntlClientProvider>
  );
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}
