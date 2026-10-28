'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { ApiError } from '@/lib/api/types';
import { useRolesList } from '../hooks/use-roles-list';
import type { RoleDetail } from '../schemas/role.schema';
import { usePermission } from '@/features/auth/hooks/use-permission';
import { AccessDeniedCard } from '@/components/layout/access-denied-card';
import { CreateRoleDialog } from './create-role-dialog';
import { DeleteRoleDialog } from './delete-role-dialog';
import { EditRoleDialog } from './edit-role-dialog';
import { RoleDataTable } from './role-data-table';
import { RoleDetailDialog } from './role-detail-dialog';

export function RbacPageContent() {
  const t = useTranslations('rbac');
  const { isAdmin, isLoading: isAuthLoading } = usePermission();

  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<RoleDetail | undefined>(undefined);
  const [deleteRole, setDeleteRole] = useState<RoleDetail | undefined>(undefined);

  const { data, isLoading, isError, error, refetch } = useRolesList();
  const roles = data ?? [];

  if (!isAuthLoading && !isAdmin) {
    return <AccessDeniedCard />;
  }

  return (
    <section className="py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {/* Rendered on every branch so the shell never loses its page heading. */}
          <h1 className="font-display text-2xl text-card-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden />
          {t('action.create')}
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <RoleDataTable status="loading" />
        ) : isError ? (
          <RoleDataTable
            status="error"
            error={error as unknown as ApiError}
            onRetry={() => {
              void refetch();
            }}
          />
        ) : roles.length === 0 ? (
          <RoleDataTable status="empty" />
        ) : (
          <RoleDataTable
            status="ready"
            roles={roles}
            onSelectRole={setSelectedRoleId}
            onEdit={setEditRole}
            onDelete={setDeleteRole}
            onViewPermissions={(role) => setSelectedRoleId(role.id)}
          />
        )}
      </div>

      {selectedRoleId ? (
        <RoleDetailDialog
          roleId={selectedRoleId}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedRoleId(undefined);
          }}
        />
      ) : null}

      {createOpen ? (
        <CreateRoleDialog
          open
          onOpenChange={(open) => {
            if (!open) setCreateOpen(false);
          }}
        />
      ) : null}

      {editRole ? (
        <EditRoleDialog
          role={editRole}
          open
          onOpenChange={(open) => {
            if (!open) setEditRole(undefined);
          }}
        />
      ) : null}

      {deleteRole ? (
        <DeleteRoleDialog
          role={deleteRole}
          open
          onOpenChange={(open) => {
            if (!open) setDeleteRole(undefined);
          }}
        />
      ) : null}
    </section>
  );
}
