import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@/test-utils/render';
import { RbacEmpty } from './rbac-empty';

describe('RbacEmpty', () => {
  it('renders the localized empty title and hint', () => {
    const { getByText } = renderWithProviders(<RbacEmpty />);

    expect(getByText('No roles found')).toBeInTheDocument();
    expect(getByText('Create a custom role to get started.')).toBeInTheDocument();
  });
});
