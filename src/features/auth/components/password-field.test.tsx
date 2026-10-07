import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, fireEvent, screen } from '@/test-utils/render';
import { PasswordField } from './password-field';

describe('PasswordField', () => {
  it('renders input type=password by default', () => {
    const { container } = renderWithProviders(<PasswordField value="" onChange={vi.fn()} />);
    expect(container.querySelector('input')?.type).toBe('password');
  });

  it('toggles visibility on button click', () => {
    const { container } = renderWithProviders(<PasswordField value="" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    expect(container.querySelector('input')?.type).toBe('text');
    fireEvent.click(screen.getByRole('button'));
    expect(container.querySelector('input')?.type).toBe('password');
  });

  it('calls onChange when typing', () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(<PasswordField value="" onChange={onChange} />);
    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalledWith('hello');
  });
});
