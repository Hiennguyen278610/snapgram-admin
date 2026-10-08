'use client';

import { useTranslations } from 'next-intl';
import { UserCheck, UserPlus, Users, UserX } from 'lucide-react';
import type { ApiError } from '@/lib/api/types';
import { useDashboardStats } from '../hooks/use-dashboard-stats';
import { StatMetricCard } from './stat-metric-card';
import { ActivityFeedCard } from './activity-feed-card';
import { ModerationQuickBar } from './moderation-quick-bar';
import { DashboardSkeleton } from './dashboard-skeleton';
import { DashboardError } from './dashboard-error';
import { DashboardEmpty } from './dashboard-empty';

export function DashboardPageContent() {
  const t = useTranslations('dashboard');
  const { data, isLoading, isError, error, refetch } = useDashboardStats();

  const isEmpty = !data || (data.totalUsers === 0 && data.recentUsers.length === 0);

  return (
    <section className="py-6">
      {/* Rendered on every branch so the shell never loses its page heading. */}
      <h1 className="font-display text-2xl text-card-foreground">{t('title')}</h1>

      <div className="mt-6">
        {isLoading ? (
          <DashboardSkeleton />
        ) : isError ? (
          <DashboardError
            error={error as unknown as ApiError}
            onRetry={() => {
              void refetch();
            }}
          />
        ) : isEmpty ? (
          <DashboardEmpty />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <StatMetricCard label={t('stats.totalUsers')} value={data.totalUsers} icon={Users} />
            <StatMetricCard
              label={t('stats.activeUsers')}
              value={data.activeUsers}
              icon={UserCheck}
            />
            <StatMetricCard label={t('stats.bannedUsers')} value={data.bannedUsers} icon={UserX} />
            <StatMetricCard
              label={t('stats.newUsersToday')}
              value={data.newUsersToday}
              icon={UserPlus}
            />
            <ActivityFeedCard users={data.recentUsers} />
            <ModerationQuickBar stats={data} />
          </div>
        )}
      </div>
    </section>
  );
}
