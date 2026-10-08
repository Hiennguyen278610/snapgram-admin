'use client';

import { MoreHorizontal, Pencil, ShieldCheck, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Locale } from '@/i18n/routing';
import type { ApiError } from '@/lib/api/types';
import { formatNumber } from '@/lib/i18n/format';
import type { RoleDetail } from '../schemas/role.schema';
import { RbacEmpty } from './rbac-empty';
import { RbacError } from './rbac-error';
import { RoleTableSkeleton } from './role-table-skeleton';

interface RoleActionMenuProps {
  role: RoleDetail;
  onEdit: (role: RoleDetail) => void;
  onDelete: (role: RoleDetail) => void;
  onViewPermissions: (role: RoleDetail) => void;
}

function RoleActionMenu({ role, onEdit, onDelete, onViewPermissions }: RoleActionMenuProps) {
  const t = useTranslations('rbac');
  // System roles are read-only: their Edit/Delete items are disabled.
  const isSystem = role.system === true;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('action.openMenu', { name: role.name })}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {role.name}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onViewPermissions(role)}>
          <ShieldCheck className="size-4" aria-hidden />
          {t('action.viewPermissions')}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isSystem} onSelect={() => onEdit(role)}>
          <Pencil className="size-4" aria-hidden />
          {t('action.edit')}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" disabled={isSystem} onSelect={() => onDelete(role)}>
          <Trash2 className="size-4" aria-hidden />
          {t('action.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ReadyProps {
  status: 'ready';
  roles: RoleDetail[];
  onSelectRole: (roleId: string) => void;
  onEdit: (role: RoleDetail) => void;
  onDelete: (role: RoleDetail) => void;
  onViewPermissions: (role: RoleDetail) => void;
}

interface LoadingProps {
  status: 'loading';
}

interface EmptyProps {
  status: 'empty';
}

interface ErrorProps {
  status: 'error';
  error: ApiError | null;
  onRetry: () => void;
}

export type RoleDataTableProps = ReadyProps | LoadingProps | EmptyProps | ErrorProps;

/**
 * Explicit status variants instead of a pile of `isLoading`/`isError`/`isEmpty`
 * booleans (vercel-composition-patterns › avoid boolean prop proliferation).
 */
export function RoleDataTable(props: RoleDataTableProps) {
  const t = useTranslations('rbac');
  const locale = useLocale() as Locale;

  if (props.status === 'empty') return <RbacEmpty />;
  if (props.status === 'error') return <RbacError error={props.error} onRetry={props.onRetry} />;

  const isLoading = props.status === 'loading';
  const roles = props.status === 'ready' ? props.roles : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>{t('table.column.name')}</TableHead>
            <TableHead>{t('table.column.description')}</TableHead>
            <TableHead>{t('table.column.userCount')}</TableHead>
            <TableHead>{t('table.column.system')}</TableHead>
            <TableHead className="text-right">{t('table.column.actions')}</TableHead>
          </TableRow>
        </TableHeader>

        {isLoading ? (
          <RoleTableSkeleton />
        ) : (
          <TableBody>
            {roles.map((role) => (
              <TableRow
                key={role.id}
                tabIndex={0}
                className="cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                onClick={() => props.onSelectRole(role.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    props.onSelectRole(role.id);
                  }
                }}
              >
                <TableCell className="font-medium text-card-foreground">{role.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {role.description ? role.description : t('table.noDescription')}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatNumber(role.userCount, locale)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {role.system === true ? t('role.system') : t('role.custom')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                  <RoleActionMenu
                    role={role}
                    onEdit={props.onEdit}
                    onDelete={props.onDelete}
                    onViewPermissions={props.onViewPermissions}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>
    </div>
  );
}
