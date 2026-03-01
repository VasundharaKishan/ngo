import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

  it('shows sort icon ⇅ for unsorted column', async () => {
    mockFetchDonationsPaginated.mockResolvedValueOnce({
      items: [
        {
          id: 'd1',
          donorName: 'Bob',
          donorEmail: 'bob@example.com',
          amount: 1000,
          currency: 'usd',
          campaignTitle: 'Test Campaign',
          status: 'SUCCESS',
          createdAt: '2024-01-01T12:00:00Z',
        },
      ],
      totalItems: 1,
      totalPages: 1,
    });

    render(<Donations />);

    await waitFor(() => expect(screen.getByTestId('donations-sort-amount')).toBeInTheDocument());
    // Default sort is createdAt,desc — so amount column shows ⇅
    expect(screen.getByTestId('donations-sort-amount').textContent).toContain('⇅');
  });

  it('clicking amount sort header calls mockSetSort with amount,desc', async () => {
    mockFetchDonationsPaginated.mockResolvedValueOnce({
      items: [
        {
          id: 'd2',
          donorName: 'Carol',
          donorEmail: 'carol@example.com',
          amount: 3000,
          currency: 'usd',
          campaignTitle: 'Build a Bridge',
          status: 'PENDING',
          createdAt: '2024-02-01T12:00:00Z',
        },
      ],
      totalItems: 1,
      totalPages: 1,
    });

    render(<Donations />);

    await waitFor(() => expect(screen.getByTestId('donations-sort-amount')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('donations-sort-amount'));

    expect(mockSetSort).toHaveBeenCalledWith('amount,desc');
  });

  it('clicking Clear Filters button calls mockReset', async () => {
    mockFetchDonationsPaginated.mockResolvedValueOnce({
      items: [
        {
          id: 'd3',
          donorName: 'Dave',
          donorEmail: 'dave@example.com',
          amount: 500,
          currency: 'gbp',
          campaignTitle: 'Water Fund',
          status: 'SUCCESS',
          createdAt: '2024-03-01T12:00:00Z',
        },
      ],
      totalItems: 1,
      totalPages: 1,
    });

    render(<Donations />);

    await waitFor(() => expect(screen.getByText('Clear Filters')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Clear Filters'));

    expect(mockReset).toHaveBeenCalled();
  });

  it('getSortIcon returns ↓ for active desc sort column (createdAt)', async () => {
    mockFetchDonationsPaginated.mockResolvedValueOnce({
      items: [
        {
          id: 'd4',
          donorName: 'Eve',
          donorEmail: 'eve@example.com',
          amount: 750,
          currency: 'inr',
          campaignTitle: 'Plant Trees',
          status: 'SUCCESS',
          createdAt: '2024-04-01T12:00:00Z',
        },
      ],
      totalItems: 1,
      totalPages: 1,
    });

    render(<Donations />);

    await waitFor(() => expect(screen.getByTestId('donations-sort-date')).toBeInTheDocument());
    // Default sort = createdAt,desc, so createdAt column shows ↓
    expect(screen.getByTestId('donations-sort-date').textContent).toContain('↓');
  });

  it('clicking createdAt sort header toggles to asc (handleSortChange same-field toggle)', async () => {
    mockFetchDonationsPaginated.mockResolvedValueOnce({
      items: [
        {
          id: 'd5',
          donorName: 'Frank',
          donorEmail: 'frank@example.com',
          amount: 1200,
          currency: 'usd',
          campaignTitle: 'Food Drive',
          status: 'SUCCESS',
          createdAt: '2024-05-01T12:00:00Z',
        },
      ],
      totalItems: 1,
      totalPages: 1,
    });

    render(<Donations />);

    await waitFor(() => expect(screen.getByTestId('donations-sort-date')).toBeInTheDocument());
    // Default sort is 'createdAt,desc' — clicking again toggles to 'createdAt,asc'
    fireEvent.click(screen.getByTestId('donations-sort-date'));
    expect(mockSetSort).toHaveBeenCalledWith('createdAt,asc');
  });
});
