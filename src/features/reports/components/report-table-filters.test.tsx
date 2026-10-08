import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import { ReportTableFilters } from './report-table-filters';

const spy = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: { value: new URLSearchParams() },
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => spy.searchParams.value,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: spy.replace, push: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => '/admin/moderation/reports',
}));

// Radix Select needs browser APIs jsdom does not implement.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub);
Element.prototype.hasPointerCapture = () => false;
Element.prototype.scrollIntoView = () => {};

function lastParams(): URLSearchParams {
  const calls = spy.replace.mock.calls;
  const url = String(calls[calls.length - 1]?.[0] ?? '');
  return new URLSearchParams(url.includes('?') ? url.slice(url.indexOf('?') + 1) : '');
}

describe('ReportTableFilters', () => {
  beforeEach(() => {
    spy.replace.mockReset();
    spy.searchParams.value = new URLSearchParams();
  });

  it('renders the target-type label with All preselected', () => {
    renderWithProviders(<ReportTableFilters />);

    expect(screen.getByText('Target type')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveTextContent('All target types');
  });

  it('reflects the targetType from the URL', () => {
    spy.searchParams.value = new URLSearchParams({ targetType: 'COMMENT' });
    renderWithProviders(<ReportTableFilters />);

    expect(screen.getByRole('combobox')).toHaveTextContent('Comment');
  });

  it('writes the UPPERCASE targetType to the URL and resets the page', async () => {
    spy.searchParams.value = new URLSearchParams({ page: '2', size: '20' });
    renderWithProviders(<ReportTableFilters />);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'Account' }));

    expect(lastParams().get('targetType')).toBe('USER');
    expect(lastParams().get('page')).toBe('0');
    expect(lastParams().get('size')).toBe('20');
  });

  it('clears the targetType param when All is selected', async () => {
    spy.searchParams.value = new URLSearchParams({ targetType: 'POST', page: '1', size: '20' });
    renderWithProviders(<ReportTableFilters />);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'All target types' }));

    expect(lastParams().has('targetType')).toBe(false);
    expect(lastParams().get('page')).toBe('0');
  });

  it('offers exactly All + the 3 backend target types', async () => {
    renderWithProviders(<ReportTableFilters />);

    await userEvent.click(screen.getByRole('combobox'));

    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'All target types',
      'Post',
      'Comment',
      'Account',
    ]);
  });
});
