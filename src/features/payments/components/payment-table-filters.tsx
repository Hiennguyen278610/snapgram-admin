'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PaymentStatus } from '@/lib/api/query-keys';
import { usePaymentFilters } from '../hooks/use-payment-filters';

export const PAYMENT_TABS = ['all', 'PENDING', 'SUCCESS', 'EXPIRED', 'FAILED'] as const;

export type PaymentTab = (typeof PAYMENT_TABS)[number];

export function PaymentTableFilters() {
  const t = useTranslations('payments.tabs');
  const { status, setStatus } = usePaymentFilters();
  const activeTab: PaymentTab = (status as PaymentTab) ?? 'all';

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setStatus(value === 'all' ? undefined : (value as PaymentStatus))}
    >
      <TabsList className="max-w-full overflow-x-auto">
        {PAYMENT_TABS.map((tab) => {
          const tabKey = tab.toLowerCase() as 'all' | 'pending' | 'success' | 'expired' | 'failed';
          return (
            <TabsTrigger key={tab} value={tab} data-tab={tab}>
              {t(tabKey)}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
