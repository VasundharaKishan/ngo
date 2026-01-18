import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConfigLoader from './ConfigLoader';

let mockState = { loading: false, error: null as any };

vi.mock('../contexts/ConfigContext', () => ({
  useConfig: () => mockState,
}));

describe('ConfigLoader', () => {
  it('shows loading state', () => {
    mockState = { loading: true, error: null };
    render(<ConfigLoader><div>Loaded</div></ConfigLoader>);

    expect(screen.getByText(/Loading site configuration/i)).toBeInTheDocument();
  });

  it('renders children when loaded', () => {
    mockState = { loading: false, error: null };
    render(<ConfigLoader><div>Loaded</div></ConfigLoader>);

    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
