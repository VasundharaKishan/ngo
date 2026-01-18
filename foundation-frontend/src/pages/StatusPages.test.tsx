import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import Success from './Success';
import Cancel from './Cancel';

describe('Status pages', () => {
  it('renders Success page with actions', () => {
    render(
      <MemoryRouter>
        <Success />
      </MemoryRouter>
    );

    expect(screen.getByText(/Thank You for Your Donation/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View Other Campaigns/i })).toHaveAttribute('href', '/campaigns');
    expect(screen.getByRole('link', { name: /Return Home/i })).toHaveAttribute('href', '/');
  });

  it('renders Cancel page with actions', () => {
    render(
      <MemoryRouter>
        <Cancel />
      </MemoryRouter>
    );

    expect(screen.getByText(/Payment Cancelled/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to Campaigns/i })).toHaveAttribute('href', '/campaigns');
    expect(screen.getByRole('link', { name: /Return Home/i })).toHaveAttribute('href', '/');
  });
});
