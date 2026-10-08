'use client';

import { createContext, use, useMemo, useState, type ReactNode } from 'react';
import { Loader2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getErrorMessageKey } from '@/lib/api/error-mapper';
import { useSetRolePermissions } from '../hooks/use-set-role-permissions';
import {
  PERMISSION_CATEGORIES,
  type PermissionCategory,
  type PermissionMap,
  type PermissionResponse,
} from '../schemas/permission.schema';

interface PermissionMatrixState {
  selectedIds: ReadonlySet<string>;
  disabled: boolean;
}

interface PermissionMatrixActions {
  toggle: (permissionId: string, checked: boolean) => void;
  setMany: (permissionIds: string[], checked: boolean) => void;
}

interface PermissionMatrixMeta {
  permissions: PermissionMap;
}

interface PermissionMatrixContextValue {
  state: PermissionMatrixState;
  actions: PermissionMatrixActions;
  meta: PermissionMatrixMeta;
}

/**
 * Generic context contract (state / actions / meta) so `Group` and `Item` can be
 * composed by any provider and never read a concrete state implementation.
 */
const PermissionMatrixContext = createContext<PermissionMatrixContextValue | null>(null);

interface GroupProps {
  category: PermissionCategory;
  children: ReactNode;
}

function PermissionMatrixGroup({ category, children }: GroupProps) {
  const t = useTranslations('rbac');
  const context = use(PermissionMatrixContext);

  const permissionIds = (context?.meta.permissions[category] ?? []).map(
    (permission) => permission.id
  );
  const selectedIds = context?.state.selectedIds;
  const selectedCount = permissionIds.filter((id) => selectedIds?.has(id)).length;
  const allSelected = permissionIds.length > 0 && selectedCount === permissionIds.length;
  const someSelected = selectedCount > 0 && !allSelected;
  const disabled = context?.state.disabled ?? false;

  const headingId = `rbac-category-${category}`;
  const selectAllId = `rbac-category-${category}-select-all`;

  return (
    <section aria-labelledby={headingId} className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <h3 id={headingId} className="text-sm font-semibold text-card-foreground">
          {t(`category.${category}`)}
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id={selectAllId}
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              disabled={disabled || permissionIds.length === 0}
              onCheckedChange={(checked) =>
                context?.actions.setMany(permissionIds, checked === true)
              }
            />
            <Label htmlFor={selectAllId} className="text-xs text-muted-foreground">
              {t('action.selectAll')}
            </Label>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={disabled || selectedCount === 0}
            onClick={() => context?.actions.setMany(permissionIds, false)}
          >
            <X className="size-3.5" aria-hidden />
            {t('action.clearAll')}
          </Button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

interface ItemProps {
  permission: PermissionResponse;
  /** Optional controlled override; falls back to the matrix context. */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function PermissionMatrixItem({ permission, checked, onCheckedChange }: ItemProps) {
  const context = use(PermissionMatrixContext);
  const isControlled = checked !== undefined;
  const isChecked = isControlled
    ? checked
    : (context?.state.selectedIds.has(permission.id) ?? false);
  const disabled = context?.state.disabled ?? false;

  const checkboxId = `rbac-permission-${permission.id}`;

  const handleCheckedChange = (next: boolean) => {
    if (onCheckedChange) {
      onCheckedChange(next);
      return;
    }
    context?.actions.toggle(permission.id, next);
  };

  return (
    <div className="flex items-start gap-2.5">
      <Checkbox
        id={checkboxId}
        checked={isChecked}
        disabled={disabled}
        onCheckedChange={(next) => handleCheckedChange(next === true)}
        className="mt-0.5"
      />
      <div className="min-w-0">
        {/* Primary label is the locale-neutral identifier from the backend;
            `description` is a fixed Vietnamese string and is shown verbatim. */}
        <Label htmlFor={checkboxId} className="font-mono text-xs text-card-foreground">
          {permission.name}
        </Label>
        {permission.description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{permission.description}</p>
        ) : null}
      </div>
    </div>
  );
}

interface Props {
  roleId: string;
  permissions: PermissionMap;
  selectedIds: string[];
  disabled?: boolean;
  onSaved?: () => void;
}

function PermissionMatrixRoot({
  roleId,
  permissions,
  selectedIds,
  disabled = false,
  onSaved,
}: Props) {
  const t = useTranslations('rbac');
  const tError = useTranslations();
  const mutation = useSetRolePermissions();
  const [selected, setSelected] = useState<Set<string>>(() => new Set(selectedIds));

  const actions = useMemo<PermissionMatrixActions>(
    () => ({
      toggle: (permissionId, checked) => {
        setSelected((current) => {
          const next = new Set(current);
          if (checked) next.add(permissionId);
          else next.delete(permissionId);
          return next;
        });
      },
      setMany: (permissionIds, checked) => {
        setSelected((current) => {
          const next = new Set(current);
          for (const permissionId of permissionIds) {
            if (checked) next.add(permissionId);
            else next.delete(permissionId);
          }
          return next;
        });
      },
    }),
    []
  );

  const contextValue = useMemo<PermissionMatrixContextValue>(
    () => ({ state: { selectedIds: selected, disabled }, actions, meta: { permissions } }),
    [selected, disabled, actions, permissions]
  );

  const handleSave = () => {
    mutation.mutate(
      { id: roleId, permissionIds: [...selected] },
      {
        onSuccess: () => {
          toast.success(t('toast.permissionsSaved'));
          onSaved?.();
        },
        onError: (error) => {
          toast.error(t('error.permissionsFailed'), {
            description: tError(getErrorMessageKey(error)),
          });
        },
      }
    );
  };

  return (
    <PermissionMatrixContext.Provider value={contextValue}>
      <div className="space-y-4">
        {PERMISSION_CATEGORIES.map((category) => (
          <PermissionMatrixGroup key={category} category={category}>
            {(permissions[category] ?? []).map((permission) => (
              <PermissionMatrixItem key={permission.id} permission={permission} />
            ))}
          </PermissionMatrixGroup>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="button" disabled={disabled || mutation.isPending} onClick={handleSave}>
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {t('action.savePermissions')}
        </Button>
      </div>
    </PermissionMatrixContext.Provider>
  );
}

/**
 * Compound component (vercel-composition-patterns): the root owns the selected
 * state + save mutation, `Group`/`Item` consume the shared context.
 */
export const PermissionMatrix = Object.assign(PermissionMatrixRoot, {
  Group: PermissionMatrixGroup,
  Item: PermissionMatrixItem,
});
