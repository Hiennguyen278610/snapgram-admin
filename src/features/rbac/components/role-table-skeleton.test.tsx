import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@/test-utils/render';
import { RoleTableSkeleton } from './role-table-skeleton';

describe('RoleTableSkeleton', () => {
  it('renders five placeholder rows by default with a status announcement', () => {
    const { getAllByRole, getByRole } = renderWithProviders(
      <table>
        <RoleTableSkeleton />
      </table>
    );

    expect(getAllByRole('row')).toHaveLength(5);
    expect(getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('honours a custom row count', () => {
    const { getAllByRole } = renderWithProviders(
      <table>
        <RoleTableSkeleton rows={2} />
      </table>
    );

    expect(getAllByRole('row')).toHaveLength(2);
  });
});
