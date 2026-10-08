import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import type { Media } from '../schemas/media.schema';
import { MediaDeleteDialog } from './media-delete-dialog';

const media: Media = {
  id: 'aaaaaaaa-1111-4111-8111-111111111101',
  ownerId: 'u-1',
  url: 'http://localhost:9000/snapgram-media/a.jpg',
  thumbnailUrl: null,
  mimeType: 'image/jpeg',
  sizeBytes: 1024,
  status: 'READY',
  width: null,
  height: null,
  durationSec: null,
  createdAt: '2026-10-08T06:00:00Z',
};

const onOpenChange = vi.fn();
const onConfirm = vi.fn();

function renderDialog(
  overrides: { isPending?: boolean; error?: Parameters<typeof MediaDeleteDialog>[0]['error'] } = {}
) {
  return renderWithProviders(
    <MediaDeleteDialog
      media={media}
      open
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      isPending={overrides.isPending ?? false}
      error={overrides.error ?? null}
    />
  );
}

describe('MediaDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the destructive confirmation with the file id', () => {
    renderDialog();

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Delete this file?')).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    expect(screen.getByTitle(media.id)).toBeInTheDocument();
  });

  it('uses a flat rose destructive button (no gradient)', () => {
    renderDialog();

    const confirm = screen.getByRole('button', { name: 'Delete file' });
    expect(confirm.className).toContain('bg-rose-600');
    expect(confirm.className).not.toContain('gradient');
  });

  it('confirms the delete action', async () => {
    renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Delete file' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables both actions and spins while deleting', () => {
    renderDialog({ isPending: true });

    const confirm = screen.getByRole('button', { name: /Delete file/ });
    expect(confirm).toBeDisabled();
    expect(confirm.querySelector('.animate-spin')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('surfaces the delete error inside the dialog', () => {
    renderDialog({ error: { httpStatus: 500, kind: 'server', message: 'boom' } });

    expect(screen.getByText('Internal server error.')).toBeInTheDocument();
  });

  it('closes through the cancel button', async () => {
    renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
