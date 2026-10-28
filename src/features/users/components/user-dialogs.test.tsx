import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test-utils/render';
import type { AdminUser } from '../schemas/user.schema';
import { CreateUserDialog } from './create-user-dialog';
import { EditUserDialog } from './edit-user-dialog';
import { DeleteUserDialog } from './delete-user-dialog';

const sampleUser: AdminUser = {
  id: 'u-123',
  username: 'test_user',
  email: 'test@snapgram.dev',
  displayName: 'Test User',
  emailVerified: true,
  banned: false,
  roles: ['USER'],
};

describe('User Dialogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CreateUserDialog', () => {
    it('renders form fields when open', () => {
      renderWithProviders(<CreateUserDialog open onOpenChange={vi.fn()} />);

      expect(screen.getByRole('heading', { name: 'Create User' })).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    });

    it('shows validation errors for short username or password', async () => {
      renderWithProviders(<CreateUserDialog open onOpenChange={vi.fn()} />);

      await userEvent.type(screen.getByLabelText('Username'), 'ab');
      await userEvent.type(screen.getByLabelText('Email Address'), 'invalid-email');
      await userEvent.type(screen.getByLabelText('Password'), '123');
      await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

      await waitFor(() => {
        expect(
          screen.getByText('Username must be between 3 and 50 characters')
        ).toBeInTheDocument();
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
        expect(
          screen.getByText('Password must be between 8 and 128 characters')
        ).toBeInTheDocument();
      });
    });

    it('renders role options and toggles additional roles', async () => {
      renderWithProviders(<CreateUserDialog open onOpenChange={vi.fn()} />);

      expect(screen.getByText('Roles')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'User' })).toBeDisabled();
      const adminBtn = screen.getByRole('button', { name: 'Admin' });
      expect(adminBtn).toBeEnabled();

      await userEvent.click(adminBtn);
      // Admin should now be toggled
    });
  });

  describe('EditUserDialog', () => {
    it('prefills fields with existing user data', () => {
      renderWithProviders(<EditUserDialog user={sampleUser} open onOpenChange={vi.fn()} />);

      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@snapgram.dev')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
    });

    it('returns null when user is null', () => {
      const { container } = renderWithProviders(
        <EditUserDialog user={null} open onOpenChange={vi.fn()} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('DeleteUserDialog', () => {
    it('renders delete confirmation with username', () => {
      renderWithProviders(<DeleteUserDialog user={sampleUser} open onOpenChange={vi.fn()} />);

      expect(screen.getByRole('heading', { name: 'Delete @test_user?' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete Account' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('returns null when user is null', () => {
      const { container } = renderWithProviders(
        <DeleteUserDialog user={null} open onOpenChange={vi.fn()} />
      );

      expect(container.firstChild).toBeNull();
    });
  });
});
