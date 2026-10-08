import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { act, renderWithProviders, waitFor } from '@/test-utils/render';
import type { PageAdminUser } from '../schemas/user.schema';
import { useUsersList } from '../hooks/use-users-list';
import { useUserDetail } from '../hooks/use-user-detail';
import { useBanUser } from '../hooks/use-ban-user';
import { useUnbanUser } from '../hooks/use-unban-user';
import { UsersPageContent } from './users-page-content';

vi.mock('../hooks/use-users-list');
vi.mock('../hooks/use-user-detail');
vi.mock('../hooks/use-ban-user');
vi.mock('../hooks/use-unban-user');

const mockedUseUsersList = vi.mocked(useUsersList);
const mockedUseUserDetail = vi.mocked(useUserDetail);
const mockedUseBanUser = vi.mocked(useBanUser);
const mockedUseUnbanUser = vi.mocked(useUnbanUser);

const page: PageAdminUser = {
  content: [
    {
      id: 'u-1',
      username: 'alice',
      email: 'alice@snapgram.dev',
      displayName: 'Alice Nguyen',
      avatarUrl: null,
      emailVerified: true,
      banned: false,
      createdAt: '2026-10-01T09:15:00Z',
      role: 'ADMIN',
      roles: ['USER', 'ADMIN'],
    },
  ],
  totalElements: 25,
  totalPages: 2,
  number: 0,
  size: 20,
  numberOfElements: 1,
  first: true,
  last: false,
  empty: false,
};

function mockList(overrides: Record<string, unknown>) {
  mockedUseUsersList.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useUsersList>);
}

describe('UsersPageContent', () => {
  const banMutate = vi.fn();
  const unbanMutate = vi.fn();

  beforeEach(() => {
    mockedUseUsersList.mockReset();
    mockedUseUserDetail.mockReset();
    mockedUseBanUser.mockReset();
    mockedUseUnbanUser.mockReset();
    banMutate.mockReset();
    unbanMutate.mockReset();

    mockedUseUserDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useUserDetail>);

    mockedUseBanUser.mockReturnValue({
      mutate: banMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useBanUser>);

    mockedUseUnbanUser.mockReturnValue({
      mutate: unbanMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUnbanUser>);
  });

  it('renders the heading and the table skeleton while loading', () => {
    mockList({ isLoading: true });
    const { getByRole, getByText } = renderWithProviders(<UsersPageContent />);

    expect(getByRole('heading', { name: 'Users' })).toBeInTheDocument();
    expect(getByText('Manage Snapgram accounts, roles and access')).toBeInTheDocument();
    expect(getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(getByRole('searchbox', { name: 'Search users' })).toBeInTheDocument();
  });

  it('renders the heading and the error panel on failure, and refetches on retry', async () => {
    const refetch = vi.fn();
    mockList({
      isError: true,
      error: { httpStatus: 500, kind: 'server', message: 'boom' },
      refetch,
    });
    const { getByRole, getByText } = renderWithProviders(<UsersPageContent />);

    expect(getByRole('heading', { name: 'Users' })).toBeInTheDocument();
    expect(getByText('Failed to load users')).toBeInTheDocument();
    expect(getByText('Internal server error.')).toBeInTheDocument();

    await userEvent.click(getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders the heading and the empty state when the page has no rows', () => {
    mockList({ data: { ...page, content: [], totalElements: 0, totalPages: 0 } });
    const { getByRole, getByText } = renderWithProviders(<UsersPageContent />);

    expect(getByRole('heading', { name: 'Users' })).toBeInTheDocument();
    expect(getByText('No users found')).toBeInTheDocument();
    expect(getByText('Try a different search term or check back later.')).toBeInTheDocument();
  });

  it('renders the table with the users and the pagination controls', () => {
    mockList({ data: page });
    const { getByRole, getByText } = renderWithProviders(<UsersPageContent />);

    expect(getByRole('heading', { name: 'Users' })).toBeInTheDocument();
    expect(getByText('Alice Nguyen')).toBeInTheDocument();
    expect(getByText('alice@snapgram.dev')).toBeInTheDocument();
    expect(getByText('Page 1 of 2')).toBeInTheDocument();
    expect(getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('requests the next page when Next is clicked', async () => {
    mockList({ data: page });
    const { getByRole } = renderWithProviders(<UsersPageContent />);

    await userEvent.click(getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      const lastCall = mockedUseUsersList.mock.calls.at(-1)?.[0];
      expect(lastCall).toMatchObject({ page: 1, size: 20 });
    });
  });

  it('sends the debounced keyword once it reaches two characters (conventions §15)', async () => {
    mockList({ data: page });
    const { getByRole } = renderWithProviders(<UsersPageContent />);

    await userEvent.type(getByRole('searchbox'), 'al');

    await waitFor(
      () => {
        const lastCall = mockedUseUsersList.mock.calls.at(-1)?.[0];
        expect(lastCall).toMatchObject({ q: 'al' });
      },
      { timeout: 2000 }
    );
  });

  it('does not send the keyword while it is shorter than two characters', async () => {
    mockList({ data: page });
    const { getByRole, getByText } = renderWithProviders(<UsersPageContent />);

    await userEvent.type(getByRole('searchbox'), 'a');
    expect(getByText('Type at least 2 characters to search')).toBeInTheDocument();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });
    const lastCall = mockedUseUsersList.mock.calls.at(-1)?.[0];
    expect(lastCall).not.toHaveProperty('q');
  });

  it('opens the detail drawer when a row is selected', async () => {
    mockList({ data: page });
    const { getByText, getByRole } = renderWithProviders(<UsersPageContent />);

    await userEvent.click(getByText('Alice Nguyen'));

    await waitFor(() => expect(getByRole('dialog')).toBeInTheDocument());
    expect(getByText('User details')).toBeInTheDocument();
  });

  it('opens the ban dialog from the row action menu', async () => {
    mockList({ data: page });
    const { getByRole, getByText } = renderWithProviders(<UsersPageContent />);

    await userEvent.click(getByRole('button', { name: 'Actions' }));
    await userEvent.click(await getByRole('menuitem', { name: /ban user/i }));

    expect(await getByRole('alertdialog')).toBeInTheDocument();
    expect(getByText('Ban Alice Nguyen?')).toBeInTheDocument();
  });

  it('opens the role dialog from the row action menu', async () => {
    mockList({ data: page });
    const { getByRole, getByText } = renderWithProviders(<UsersPageContent />);

    await userEvent.click(getByRole('button', { name: 'Actions' }));
    await userEvent.click(await getByRole('menuitem', { name: /assign role/i }));

    expect(await getByText('Roles for @alice')).toBeInTheDocument();
  });

  it('requests the previous page once the user advanced', async () => {
    mockList({ data: page });
    const { getByRole } = renderWithProviders(<UsersPageContent />);

    await userEvent.click(getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(getByRole('button', { name: 'Previous' })).toBeEnabled());

    await userEvent.click(getByRole('button', { name: 'Previous' }));

    await waitFor(() => {
      const lastCall = mockedUseUsersList.mock.calls.at(-1)?.[0];
      expect(lastCall).toMatchObject({ page: 0, size: 20 });
    });
  });

  it('shows an sr-only loading indicator for a background refetch', () => {
    mockList({ data: page, isFetching: true });
    const { getByRole } = renderWithProviders(<UsersPageContent />);

    expect(getByRole('status')).toHaveTextContent('Loading...');
  });

  it('closes the detail drawer again', async () => {
    mockList({ data: page });
    const { getByText, getByRole, queryByRole } = renderWithProviders(<UsersPageContent />);

    await userEvent.click(getByText('Alice Nguyen'));
    await waitFor(() => expect(getByRole('dialog')).toBeInTheDocument());

    await userEvent.click(getByRole('button', { name: 'Close details' }));

    await waitFor(() => expect(queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('bans the selected user and closes the dialog on success', async () => {
    banMutate.mockImplementation((_variables, options: { onSuccess: () => void }) => {
      options.onSuccess();
    });
    mockList({ data: page });
    const { getByRole, getByLabelText, getByText, queryByRole } = renderWithProviders(
      <UsersPageContent />
    );

    await userEvent.click(getByRole('button', { name: 'Actions' }));
    await userEvent.click(await getByRole('menuitem', { name: /ban user/i }));
    await userEvent.type(getByLabelText('Ban reason'), 'Repeated spam');
    await userEvent.click(getByRole('button', { name: 'Confirm' }));

    expect(banMutate).toHaveBeenCalledWith(
      { id: 'u-1', reason: 'Repeated spam' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    await waitFor(() => expect(queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(getByText('Alice Nguyen')).toBeInTheDocument();
  });

  it('closes the ban dialog through cancel', async () => {
    mockList({ data: page });
    const { getByRole, queryByRole } = renderWithProviders(<UsersPageContent />);

    await userEvent.click(getByRole('button', { name: 'Actions' }));
    await userEvent.click(await getByRole('menuitem', { name: /ban user/i }));
    await userEvent.click(getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('unbans a banned user through the confirm dialog', async () => {
    unbanMutate.mockImplementation((_id, options: { onSuccess: () => void }) => {
      options.onSuccess();
    });
    mockList({
      data: {
        ...page,
        content: [{ ...page.content[0], id: 'u-2', username: 'bob', banned: true }],
      },
    });
    const { getByRole, getByText, queryByRole } = renderWithProviders(<UsersPageContent />);

    await userEvent.click(getByRole('button', { name: 'Actions' }));
    await userEvent.click(await getByRole('menuitem', { name: /unban user/i }));

    expect(getByText('Unban Alice Nguyen?')).toBeInTheDocument();
    await userEvent.click(getByRole('button', { name: 'Confirm' }));

    expect(unbanMutate).toHaveBeenCalledWith(
      'u-2',
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    await waitFor(() => expect(queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('closes the role dialog again', async () => {
    mockList({ data: page });
    const { getByRole, getByText, queryByRole } = renderWithProviders(<UsersPageContent />);

    await userEvent.click(getByRole('button', { name: 'Actions' }));
    await userEvent.click(await getByRole('menuitem', { name: /assign role/i }));
    expect(getByText('Roles for @alice')).toBeInTheDocument();

    const closeButtons = getByRole('dialog').querySelectorAll('button');
    await userEvent.click(closeButtons[closeButtons.length - 1]);

    await waitFor(() => expect(queryByRole('dialog')).not.toBeInTheDocument());
  });
});
