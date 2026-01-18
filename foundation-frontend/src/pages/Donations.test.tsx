import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Donations from './Donations';

const mockFetchDonationsPaginated = vi.fn();

vi.mock('../api', () => ({
  fetchDonationsPaginated: (...args: unknown[]) => mockFetchDonationsPaginated(...args),
}));

// Flatten debounce and pagination hook behavior for predictability
vi.mock('../hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

const mockSetPage = vi.fn();
const mockSetSize = vi.fn();
const mockSetSort = vi.fn();
const mockSetQuery = vi.fn();
const mockSetStatus = vi.fn();
const mockReset = vi.fn();

vi.mock('../hooks/usePaginationParams', () => ({
  usePaginationParams: () => ({
    page: 0,
    size: 10,
    sort: 'createdAt,desc',
    q: '',
    status: 'ALL',
    setPage: mockSetPage,
    setSize: mockSetSize,
    setSort: mockSetSort,
    setQuery: mockSetQuery,
    setStatus: mockSetStatus,
    reset: mockReset,
  }),
}));

describe('Donations page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders donation rows after loading', async () => {
    mockFetchDonationsPaginated.mockResolvedValueOnce({
      items: [
        {
          id: 'd1',
          donorName: 'Alice',
          donorEmail: 'alice@example.com',
          amount: 2500,
          currency: 'usd',
          campaignTitle: 'School Build',
          status: 'SUCCESS',
          createdAt: '2024-01-01T12:00:00Z',
        },
      ],
      totalItems: 1,
      totalPages: 1,
    });

    render(<Donations />);

    expect(screen.getByText(/Loading donations/)).toBeInTheDocument();

    await waitFor(() => expect(mockFetchDonationsPaginated).toHaveBeenCalled());
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText(/School Build/)).toBeInTheDocument();
    expect(screen.getByText(/SUCCESS/)).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument();
  });

  it('shows error banner when fetch fails', async () => {
    mockFetchDonationsPaginated.mockRejectedValueOnce(new Error('network'));

    render(<Donations />);

    await waitFor(() =>
      expect(screen.getByText(/Failed to load donations/)).toBeInTheDocument()
    );
  });
});
