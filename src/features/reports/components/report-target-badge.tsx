'use client';

import { FileText, MessageSquare, User, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { ReportTargetType } from '@/lib/api/query-keys';

interface Props {
  targetType: ReportTargetType;
}

/**
 * The badge stays on the `outline` variant so every colour comes from the
 * semantic tokens (`border-border` / `text-foreground`); only the Lucide icon
 * distinguishes the three target kinds.
 */
const TARGET_ICONS: Record<ReportTargetType, LucideIcon> = {
  POST: FileText,
  COMMENT: MessageSquare,
  USER: User,
};

export function ReportTargetBadge({ targetType }: Props) {
  const t = useTranslations('reports');
  const Icon = TARGET_ICONS[targetType];

  return (
    <Badge variant="outline" data-target-type={targetType}>
      <Icon className="size-3.5" aria-hidden />
      {t(`target.${targetType.toLowerCase()}`)}
    </Badge>
  );
}
