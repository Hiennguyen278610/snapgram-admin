'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ReportStatus } from '@/lib/api/query-keys';
import { useReportFilters } from '../hooks/use-report-filters';

/** `all` is a UI-only tab: it maps to "no `status` param at all". */
export const REPORT_TABS = ['all', 'PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'] as const;

export type ReportTab = (typeof REPORT_TABS)[number];

/**
 * The active tab is derived from the URL (`?status=...`), so the queue is
 * shareable and survives a refresh (route-map.md §7). Selecting a tab always
 * resets the page to 0.
 */
export function ReportQueueTabs() {
  const t = useTranslations('reports');
  const { status, setStatus } = useReportFilters();
  const activeTab: ReportTab = status ?? 'all';

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setStatus(value === 'all' ? undefined : (value as ReportStatus))}
    >
      <TabsList className="max-w-full overflow-x-auto">
        {REPORT_TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab} data-tab={tab}>
            {t(`tabs.${tab.toLowerCase()}`)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
