'use client';

import { useTranslations } from 'next-intl';
import type { AdminDashboardResponse } from '../schemas/stats.schema';
import { StatMetricCard } from './stat-metric-card';
import { ActivityFeedCard } from './activity-feed-card';
import { ModerationQuickBar } from './moderation-quick-bar';

const METRIC_SKELETONS = 4;

const ZERO_STATS: AdminDashboardResponse = {
  totalUsers: 0,
  activeUsers: 0,
  bannedUsers: 0,
  newUsersToday: 0,
  newUsersThisWeek: 0,
  emailVerifiedUsers: 0,
  twoFaEnabledUsers: 0,
  recentUsers: [],
};

/**
 * Reuses the real components in their `isLoading` mode so the skeleton keeps
 * the exact size of the loaded content (no layout shift).
 */
export function DashboardSkeleton() {
  const t = useTranslations('common');

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={t('status.loading')}
      className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: METRIC_SKELETONS }, (_, index) => (
        <StatMetricCard key={index} label="" value={0} isLoading />
      ))}
      <ActivityFeedCard users={[]} isLoading />
      <ModerationQuickBar stats={ZERO_STATS} isLoading />
    </div>
  );
}
