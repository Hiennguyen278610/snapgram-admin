'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from 'cn';
import { getUserStatus, type AdminUser, type UserStatus } from '../schemas/user.schema';

interface Props {
  user: Pick<AdminUser, 'banned' | 'emailVerified'>;
}

/**
 * Absolute-rules Rule 5 exception: the `emerald` / `rose` / `amber` pairs below
 * are the three semantic status palettes sanctioned by the design system. Every
 * other colour on this component comes from semantic tokens.
 */
const STATUS_CLASSES: Record<UserStatus, string> = {
  active:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50',
  banned:
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50',
  pending:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50',
  locked: 'bg-muted text-muted-foreground border-border',
};

export function UserStatusBadge({ user }: Props) {
  const t = useTranslations('users');
  const status = getUserStatus(user);

  return (
    <Badge variant="outline" className={cn(STATUS_CLASSES[status])} data-status={status}>
      {t(`status.${status}`)}
    </Badge>
  );
}
