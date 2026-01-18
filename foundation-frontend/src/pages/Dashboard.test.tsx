import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { API_BASE_URL } from '../api';

const mockAuthFetch = vi.fn();
const mockGetDonatePopupSettings = vi.fn();

vi.mock('../utils/auth', () => ({
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
}));

vi.mock('../api', async () => {
  const actual = await vi.importActual('../api');
  return {
    ...actual,
    getDonatePopupSettings: (...args: unknown[]) => mockGetDonatePopupSettings(...args),
  };
});

describe('Admin Dashboard page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('loads campaigns, donations, and spotlight settings then renders summaries', async () => {
    mockAuthFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 'c1', title: 'Water', targetAmount: 2000, currentAmount: 500, active: true, featured: true },
          ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 'd1', amount: 1000, currency: 'usd', donorName: 'Alice', campaignId: 'c1', campaignTitle: 'Water', status: 'SUCCESS' },
            { id: 'd2', amount: 500, currency: 'usd', donorName: 'Bob', campaignId: 'c1', campaignTitle: 'Water', status: 'PENDING' },
          ]),
      });

    mockGetDonatePopupSettings.mockResolvedValueOnce({
      enabled: true,
      spotlightCampaign: { id: 'c1', title: 'Water' },
    });

    render(<Dashboard />);

    expect(screen.getByText(/Loading dashboard/)).toBeInTheDocument();

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/campaigns`));
    expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/donations`);
    expect(mockGetDonatePopupSettings).toHaveBeenCalled();

    expect(await screen.findByText('Total Donations')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // donation count
    expect(screen.getByText(/Featured Active/)).toBeInTheDocument();
    expect(screen.getAllByText(/Water/).length).toBeGreaterThanOrEqual(1);
  });
});
