import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDonatePopupSettings from './AdminDonatePopupSettings';
import { api, getDonatePopupSettings, updateDonatePopupSettings } from '../api';

const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock('../components/ToastProvider', () => ({
  useToast: () => mockToast,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api');
  return {
    ...actual,
    api: {
      ...actual.api,
      getCampaigns: vi.fn(),
    },
    getDonatePopupSettings: vi.fn(),
    updateDonatePopupSettings: vi.fn(),
  };
});

describe('AdminDonatePopupSettings', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockNavigate.mockReset();
    mockToast.mockReset?.();
    localStorage.clear();
  });

  it('redirects to login when token missing', async () => {
    render(
      <MemoryRouter>
        <AdminDonatePopupSettings />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/login'));
  });

  it('loads campaigns/settings and saves selection', async () => {
    localStorage.setItem('adminToken', 'token');

    (api.getCampaigns as any).mockResolvedValue([
      { id: 'c1', title: 'Water', active: true, featured: false, urgent: false },
      { id: 'c2', title: 'Food', active: true, featured: true, urgent: false },
    ]);
    (getDonatePopupSettings as any).mockResolvedValue({
      spotlightCampaignId: 'c1',
      spotlightCampaign: { id: 'c1', title: 'Water', active: true, featured: false, urgent: false },
    });
    (updateDonatePopupSettings as any).mockResolvedValue({});

    render(
      <MemoryRouter>
        <AdminDonatePopupSettings />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Donate Popup Settings/i)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'c2' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => expect(updateDonatePopupSettings).toHaveBeenCalledWith({ campaignId: 'c2' }));
    expect(mockToast).toHaveBeenCalled();
  });
});
