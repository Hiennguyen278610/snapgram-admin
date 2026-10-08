import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import { useDirectUpload } from '../hooks/use-direct-upload';
import type { Media } from '../schemas/media.schema';
import { MediaDirectUploader } from './media-direct-uploader';

vi.mock('../hooks/use-direct-upload');

const mockedUseDirectUpload = vi.mocked(useDirectUpload);

const media: Media = {
  id: 'm-1',
  ownerId: 'u-1',
  url: 'http://localhost:9000/snapgram-media/a.png',
  thumbnailUrl: null,
  mimeType: 'image/png',
  sizeBytes: 3,
  status: 'READY',
  width: null,
  height: null,
  durationSec: null,
  createdAt: '2026-10-08T06:00:00Z',
};

const onUploaded = vi.fn();

function mockMutation(overrides: { isPending?: boolean; isError?: boolean } = {}) {
  const mutate = vi.fn();
  mockedUseDirectUpload.mockReturnValue({
    mutate,
    isPending: overrides.isPending ?? false,
    isError: overrides.isError ?? false,
  } as unknown as ReturnType<typeof useDirectUpload>);
  return { mutate };
}

function fileInput() {
  return screen.getByLabelText('Choose a file');
}

describe('MediaDirectUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the small-image uploader copy', () => {
    mockMutation();
    renderWithProviders(<MediaDirectUploader onUploaded={onUploaded} />);

    expect(screen.getByText('Upload a small image')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload image' })).toBeInTheDocument();
  });

  it('direct-uploads a valid small image and reports success', async () => {
    const { mutate } = mockMutation();
    mutate.mockImplementation((_file, options) => {
      options?.onSuccess?.(media);
    });
    renderWithProviders(<MediaDirectUploader onUploaded={onUploaded} />);

    const file = new File([new Uint8Array([1, 2, 3])], 'a.png', { type: 'image/png' });
    await userEvent.upload(fileInput(), file);

    expect(mutate).toHaveBeenCalledWith(file, expect.anything());
    expect(onUploaded).toHaveBeenCalledWith(media);
  });

  it('rejects files of 5MB or more before calling the API', async () => {
    const { mutate } = mockMutation();
    renderWithProviders(<MediaDirectUploader onUploaded={onUploaded} />);

    const big = new File([new Uint8Array(1)], 'big.png', { type: 'image/png' });
    Object.defineProperty(big, 'size', { value: 5 * 1024 * 1024 });
    await userEvent.upload(fileInput(), big);

    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/5MB or more/i);
  });

  it('sends videos to the large-file uploader instead', async () => {
    const { mutate } = mockMutation();
    // `applyAccept: false` — the input only accepts images, but a user can still
    // force any file through, and the component must validate it.
    const user = userEvent.setup({ applyAccept: false });
    renderWithProviders(<MediaDirectUploader onUploaded={onUploaded} />);

    await user.upload(
      fileInput(),
      new File([new Uint8Array([1])], 'clip.mp4', { type: 'video/mp4' })
    );

    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/Videos always use/i);
  });

  it('disables the button and spins while uploading', () => {
    mockMutation({ isPending: true });
    renderWithProviders(<MediaDirectUploader onUploaded={onUploaded} />);

    const button = screen.getByRole('button', { name: /Uploading image/ });
    expect(button).toBeDisabled();
    expect(button.querySelector('.animate-spin')).not.toBeNull();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows an error message when the upload fails', () => {
    mockMutation({ isError: true });
    renderWithProviders(<MediaDirectUploader onUploaded={onUploaded} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Upload failed. Try again.');
  });
});
