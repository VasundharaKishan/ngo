import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { API_BASE_URL } from '../api';

const mockAuthFetch = vi.fn();

vi.mock('../utils/auth', () => ({
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
}));

describe('Admin Dashboard page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('loads dashboard stats and renders summaries', async () => {
    const statsPayload = {
      totalRaised: 15000,
      totalDonations: 2,
      totalDonors: 2,
      averageDonation: 7500,
      activeCampaigns: 1,
      monthlyRaised: 15000,
      monthlyDonations: 2,
      recentDonations: [
        { id: 'd1', donorName: 'Alice', amount: 1000, currency: 'usd', campaignTitle: 'Water', status: 'SUCCESS', createdAt: '2024-01-01' },
        { id: 'd2', donorName: 'Bob', amount: 500, currency: 'usd', campaignTitle: 'Water', status: 'PENDING', createdAt: '2024-01-02' },
      ],
      topCampaigns: [
        { id: 'c1', title: 'Water', raised: 15000, target: 200000, donationCount: 2 },
      ],
    };

    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(statsPayload),
    });

    render(<Dashboard />);

    expect(screen.getByText(/Loading dashboard/)).toBeInTheDocument();

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/dashboard/stats`)
    );

    expect(await screen.findByText('Total Raised')).toBeInTheDocument();
    expect(screen.getByText('Active Campaigns')).toBeInTheDocument();
    expect(screen.getAllByText(/Water/).length).toBeGreaterThanOrEqual(1);
  });
});
