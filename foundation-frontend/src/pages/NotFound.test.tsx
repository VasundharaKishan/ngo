import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from './NotFound';

vi.mock('../contexts/ConfigContext', () => ({
  useSiteName: () => 'Test Foundation',
  useConfig: () => ({ config: {}, loading: false, refetch: vi.fn() }),
}));

describe('NotFound page', () => {
  const renderNotFound = () =>
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

  it('renders 404 heading', () => {
    renderNotFound();
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
  });

  it('renders Page Not Found text', () => {
    renderNotFound();
    expect(screen.getByRole('heading', { name: /Page Not Found/i })).toBeInTheDocument();
  });

  it('"Go Home" link points to /', () => {
    renderNotFound();
    const homeLink = screen.getByRole('link', { name: /Go Home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('"Browse Campaigns" link points to /campaigns', () => {
    renderNotFound();
    const campaignsLink = screen.getByRole('link', { name: /Browse Campaigns/i });
    expect(campaignsLink).toBeInTheDocument();
    expect(campaignsLink).toHaveAttribute('href', '/campaigns');
  });

  it('renders descriptive message about page not existing', () => {
    renderNotFound();
    expect(screen.getByText(/does not exist or has been moved/i)).toBeInTheDocument();
  });
});
