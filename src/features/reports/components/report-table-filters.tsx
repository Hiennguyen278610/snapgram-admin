'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ReportTargetType } from '@/lib/api/query-keys';
import { useReportFilters } from '../hooks/use-report-filters';
import { REPORT_TARGET_TYPES } from '../schemas/report.schema';

/** Sentinel for "no targetType filter" — the backend has no such enum value. */
export const ALL_TARGET_TYPES = 'all';

/**
 * Target-type filter, kept in the URL like the rest of the queue state. The
 * backend filters `targetType` independently of `status` (verified live
 * 2026-10-16), so the "All" tab is filtered too.
 */
export function ReportTableFilters() {
  const t = useTranslations('reports');
  const { targetType, setTargetType } = useReportFilters();
  const value = targetType ?? ALL_TARGET_TYPES;

  return (
    <div className="flex flex-col gap-2 sm:max-w-56">
      <Label htmlFor="reports-target-filter">{t('filters.targetType')}</Label>
      <Select
        value={value}
        onValueChange={(next) =>
          setTargetType(next === ALL_TARGET_TYPES ? undefined : (next as ReportTargetType))
        }
      >
        <SelectTrigger id="reports-target-filter" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_TARGET_TYPES}>{t('filters.all')}</SelectItem>
          {REPORT_TARGET_TYPES.map((option) => (
            <SelectItem key={option} value={option}>
              {t(`target.${option.toLowerCase()}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
