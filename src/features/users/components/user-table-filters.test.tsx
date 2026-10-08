import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils/render';
import { UserTableFilters } from './user-table-filters';

describe('UserTableFilters', () => {
  it('renders the search input with an accessible label', () => {
    const { getByRole } = renderWithProviders(<UserTableFilters value="" onChange={vi.fn()} />);

    const input = getByRole('searchbox', { name: 'Search users' });
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('propagates every keystroke through onChange', async () => {
    function Harness() {
      const [value, setValue] = useState('');
      return <UserTableFilters value={value} onChange={setValue} />;
    }

    const { getByRole } = renderWithProviders(<Harness />);
    const input = getByRole('searchbox');

    await userEvent.type(input, 'ali');

    expect(input).toHaveValue('ali');
  });

  it('shows the minimum-characters hint for a one-character keyword', () => {
    const { getByText } = renderWithProviders(<UserTableFilters value="a" onChange={vi.fn()} />);

    expect(getByText('Type at least 2 characters to search')).toBeInTheDocument();
  });

  it('hides the hint once the keyword reaches two characters', () => {
    const { queryByText } = renderWithProviders(<UserTableFilters value="al" onChange={vi.fn()} />);

    expect(queryByText('Type at least 2 characters to search')).not.toBeInTheDocument();
  });

  it('shows a spinner instead of the clear button while fetching', () => {
    const { queryByRole, container } = renderWithProviders(
      <UserTableFilters value="alice" onChange={vi.fn()} isFetching />
    );

    expect(queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).not.toBeNull();
  });

  it('clears the keyword through the clear button', async () => {
    const onChange = vi.fn();
    const { getByRole } = renderWithProviders(
      <UserTableFilters value="alice" onChange={onChange} />
    );

    await userEvent.click(getByRole('button', { name: 'Clear search' }));

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('renders no clear button for an empty keyword', () => {
    const { queryByRole } = renderWithProviders(<UserTableFilters value="" onChange={vi.fn()} />);

    expect(queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });
});
