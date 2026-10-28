'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { UserFilters } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import { usePermission } from '@/features/auth/hooks/use-permission';
import { useDebounce } from '@/hooks/useDebounce';
import { useBanUser } from '../hooks/use-ban-user';
import { useUnbanUser } from '../hooks/use-unban-user';
import { useUsersList } from '../hooks/use-users-list';
import type { AdminUser } from '../schemas/user.schema';
import { BanUserDialog } from './ban-user-dialog';
import { CreateUserDialog } from './create-user-dialog';
import { DeleteUserDialog } from './delete-user-dialog';
import { EditUserDialog } from './edit-user-dialog';
import { RoleAssignMenu } from './role-assign-menu';
import { UnbanConfirmDialog } from './unban-confirm-dialog';
import { UserActionMenu, type UserAction } from './user-action-menu';
import { UserDataTable } from './user-data-table';
import { UserDetailDialog } from './user-detail-dialog';
import { UserTableFilters } from './user-table-filters';
import { UsersEmpty } from './users-empty';
import { UsersError } from './users-error';

const MIN_SEARCH_CHARS = 2;
const PAGE_SIZE = 20;

export function UsersPageContent() {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const { isAdmin } = usePermission();

  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [banTarget, setBanTarget] = useState<AdminUser | undefined>(undefined);
  const [unbanTarget, setUnbanTarget] = useState<AdminUser | undefined>(undefined);
  const [roleTarget, setRoleTarget] = useState<AdminUser | undefined>(undefined);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const debouncedQ = useDebounce(q.trim(), 300);
  const isSearchReady = debouncedQ.length === 0 || debouncedQ.length >= MIN_SEARCH_CHARS;

  // Reset to the first page whenever the debounced keyword actually changes.
  const previousQueryRef = useRef(debouncedQ);
  useEffect(() => {
    if (previousQueryRef.current !== debouncedQ) {
      previousQueryRef.current = debouncedQ;
      setPage(0);
    }
  }, [debouncedQ]);

  const filters = useMemo<UserFilters>(
    () => ({
      page,
      size: PAGE_SIZE,
      ...(debouncedQ.length >= MIN_SEARCH_CHARS ? { q: debouncedQ } : {}),
    }),
    [page, debouncedQ]
  );

  const { data, isLoading, isError, isFetching, error, refetch } = useUsersList(filters);
  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();

  const users = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const showEmpty = !isLoading && !isError && isSearchReady && users.length === 0;

  const handleRowAction = (action: UserAction, user: AdminUser) => {
    if (action === 'view') {
      setSelectedUserId(user.id);
      return;
    }
    if (action === 'edit') {
      setEditTarget(user);
      return;
    }
    if (action === 'delete') {
      setDeleteTarget(user);
      return;
    }
    if (action === 'ban') {
      setBanTarget(user);
      return;
    }
    if (action === 'unban') {
      setUnbanTarget(user);
      return;
    }
    setRoleTarget(user);
  };

  const handleBanConfirm = (reason: string) => {
    if (!banTarget) return;
    banMutation.mutate(
      { id: banTarget.id, reason },
      {
        onSuccess: () => {
          toast.success(t('toast.banSuccess'));
          setBanTarget(undefined);
        },
      }
    );
  };

  const handleUnbanConfirm = () => {
    if (!unbanTarget) return;
    unbanMutation.mutate(unbanTarget.id, {
      onSuccess: () => {
        toast.success(t('toast.unbanSuccess'));
        setUnbanTarget(undefined);
      },
    });
  };

  return (
    <section className="py-6 space-y-6">
      {/* Page Heading & Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-card-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        {isAdmin ? (
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 shrink-0 self-start sm:self-auto"
          >
            <UserPlus className="size-4" aria-hidden />
            <span>{t('action.createUser')}</span>
          </Button>
        ) : null}
      </div>

      <div className="space-y-4">
        <UserTableFilters value={q} onChange={setQ} isFetching={isFetching} />

        {isLoading ? (
          <UserDataTable
            users={[]}
            isLoading
            onSelectUser={setSelectedUserId}
            renderActions={() => null}
          />
        ) : isError ? (
          <UsersError
            error={error as unknown as ApiError}
            onRetry={() => {
              void refetch();
            }}
          />
        ) : showEmpty ? (
          <UsersEmpty />
        ) : (
          <UserDataTable
            users={users}
            onSelectUser={setSelectedUserId}
            renderActions={(user) => <UserActionMenu user={user} onAction={handleRowAction} />}
          />
        )}

        {!isLoading && !isError && totalPages > 1 ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {t('pagination.pageLabel', { page: page + 1, total: totalPages })}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              >
                {t('pagination.previous')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((current) => current + 1)}
              >
                {t('pagination.next')}
              </Button>
            </div>
          </div>
        ) : null}

        {isFetching && !isLoading ? (
          <p role="status" className="sr-only">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {tCommon('status.loading')}
          </p>
        ) : null}
      </div>

      <UserDetailDialog
        userId={selectedUserId}
        open={Boolean(selectedUserId)}
        onOpenChange={(open) => {
          if (!open) setSelectedUserId(undefined);
        }}
      />

      {banTarget ? (
        <BanUserDialog
          user={banTarget}
          open
          onOpenChange={(open) => {
            if (!open) setBanTarget(undefined);
          }}
          onConfirm={handleBanConfirm}
          isPending={banMutation.isPending}
        />
      ) : null}

      {unbanTarget ? (
        <UnbanConfirmDialog
          user={unbanTarget}
          open
          onOpenChange={(open) => {
            if (!open) setUnbanTarget(undefined);
          }}
          onConfirm={handleUnbanConfirm}
          isPending={unbanMutation.isPending}
        />
      ) : null}

      {roleTarget ? (
        <RoleAssignMenu
          user={roleTarget}
          onOpenChange={(open) => {
            if (!open) setRoleTarget(undefined);
          }}
        />
      ) : null}

      <CreateUserDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <EditUserDialog
        user={editTarget}
        open={Boolean(editTarget)}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      />

      <DeleteUserDialog
        user={deleteTarget}
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </section>
  );
}
