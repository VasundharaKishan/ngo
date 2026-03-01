import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import Success from './Success';
import Cancel from './Cancel';

vi.mock('../contexts/ConfigContext', () => ({
  useSiteName: () => 'Test Foundation',
  useConfig: () => ({ config: {}, loading: false, refetch: vi.fn() }),
}));

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

  it('Success with no session_id shows generic contribution message', () => {
    render(
      <MemoryRouter initialEntries={['/donate/success']}>
        <Success />
      </MemoryRouter>
    );

    expect(screen.getByText(/Thank You for Your Donation/i)).toBeInTheDocument();
    expect(screen.getByText(/Your generous contribution/i)).toBeInTheDocument();
  });
});

describe('Success page with session_id', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state while verifying donation', () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;

    render(
      <MemoryRouter initialEntries={['/donate/success?session_id=cs_test_abc123']}>
        <Success />
      </MemoryRouter>
    );

    expect(screen.getByText(/Verifying Your Donation/i)).toBeInTheDocument();
    expect(screen.getByText(/Please wait/i)).toBeInTheDocument();
  });

  it('shows donation details after successful verification', async () => {
    const donationData = {
      id: 'don_123',
      donorName: 'John Doe',
      amount: 2500,
      currency: 'usd',
      status: 'SUCCESS',
      campaignTitle: 'Build a School',
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(donationData),
      } as Response)
    );

    render(
      <MemoryRouter initialEntries={['/donate/success?session_id=cs_test_abc123']}>
        <Success />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Build a School/i)).toBeInTheDocument()
    );

    // formatAmount: 2500 cents = $25.00
    expect(screen.getByText(/\$25\.00/)).toBeInTheDocument();
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/Completed/i)).toBeInTheDocument();
    expect(screen.getByText(/don_123/)).toBeInTheDocument();
  });

  it('shows could-not-verify message when fetch fails', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      } as Response)
    );

    render(
      <MemoryRouter initialEntries={['/donate/success?session_id=cs_test_fail']}>
        <Success />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/could not verify your donation details/i)).toBeInTheDocument()
    );
  });

  it('shows error message when fetch throws', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    render(
      <MemoryRouter initialEntries={['/donate/success?session_id=cs_test_throw']}>
        <Success />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/could not verify your donation details/i)).toBeInTheDocument()
    );
  });

  it('formatAmount renders EUR currency correctly', async () => {
    const donationData = {
      id: 'don_456',
      donorName: 'Anonymous',
      amount: 5000,
      currency: 'eur',
      status: 'PENDING',
      campaignTitle: 'Medical Aid',
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(donationData),
      } as Response)
    );

    render(
      <MemoryRouter initialEntries={['/donate/success?session_id=cs_eur_test']}>
        <Success />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Medical Aid/i)).toBeInTheDocument()
    );

    // formatAmount: 5000 cents = €50.00
    expect(screen.getByText(/€50\.00/)).toBeInTheDocument();
    // PENDING status shows as "Processing"
    expect(screen.getByText(/Processing/i)).toBeInTheDocument();
  });
});
