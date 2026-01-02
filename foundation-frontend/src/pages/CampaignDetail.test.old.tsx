import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CampaignDetail from './CampaignDetail';
import { api } from '../api';
import type { Campaign } from '../api';

vi.mock('../api', () => ({
  api: {
    getCampaign: vi.fn(),
  }
}));

const mockCampaign: Campaign = {
  id: '1',
  title: 'Save the Children Education',
  slug: 'save-children-education',
  shortDescription: 'Brief description',
  description: 'Help us provide education to underprivileged children in rural areas.',
  targetAmount: 50000,
  currentAmount: 30000,
  currency: 'USD',
  imageUrl: 'https://example.com/campaign.jpg',
  categoryName: 'Education',
  active: true
};

describe('CampaignDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getCampaign).mockResolvedValue(mockCampaign);
  });

  it('loads and displays campaign details', async () => {
    render(
      <MemoryRouter initialEntries={['/campaigns/1']}>
        <Routes>
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Save the Children Education')).toBeInTheDocument();
    });

    expect(screen.getByText(/Help us provide education/)).toBeInTheDocument();
  });
    );

    await waitFor(() => {
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', 'https://example.com/campaign.jpg');
    });
  });

  it('displays progress information', async () => {
    render(
      <MemoryRouter initialEntries={['/campaigns/1']}>
        <Routes>
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/\$30,000/)).toBeInTheDocument();
      expect(screen.getByText(/\$50,000/)).toBeInTheDocument();
      expect(screen.getByText(/60%/)).toBeInTheDocument();
    });
  });

  it('displays category badge', async () => {
    render(
      <MemoryRouter initialEntries={['/campaigns/1']}>
        <Routes>
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Education')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    vi.mocked(api.getCampaignById).mockImplementation(
      () => new Promise(() => {})
    );

    render(
      <MemoryRouter initialEntries={['/campaigns/1']}>
        <Routes>
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    vi.mocked(api.getCampaignById).mockRejectedValue(new Error('Not found'));

    render(
      <MemoryRouter initialEntries={['/campaigns/1']}>
        <Routes>
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/error|not found/i)).toBeInTheDocument();
    });
  });

  it('displays donate button', async () => {
    render(
      <MemoryRouter initialEntries={['/campaigns/1']}>
        <Routes>
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /donate/i })).toBeInTheDocument();
    });
  });

  it('navigates to donation form when donate button clicked', async () => {
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });

    render(
      <MemoryRouter initialEntries={['/campaigns/1']}>
        <Routes>
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const donateButton = screen.getByRole('button', { name: /donate/i });
      fireEvent.click(donateButton);
    });
  });

  it('fetches campaign with correct ID', async () => {
    render(
      <MemoryRouter initialEntries={['/campaigns/123']}>
        <Routes>
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.getCampaignById).toHaveBeenCalledWith(123);
    });
  });

  it('displays active badge when campaign is active', async () => {
    render(
      <MemoryRouter initialEntries={['/campaigns/1']}>
        <Routes>
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/active campaign/i)).toBeInTheDocument();
    });
  });

  it('handles campaign with no image', async () => {
    const noImageCampaign = { ...mockCampaign, imageUrl: '' };
    vi.mocked(api.getCampaignById).mockResolvedValue(noImageCampaign);

    render(
      <MemoryRouter initialEntries={['/campaigns/1']}>
        <Routes>
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Save the Children Education')).toBeInTheDocument();
    });
  });

  it('displays campaign at 100% goal', async () => {
    const fullCampaign = { ...mockCampaign, currentAmount: 50000 };
    vi.mocked(api.getCampaignById).mockResolvedValue(fullCampaign);

    render(
      <MemoryRouter initialEntries={['/campaigns/1']}>
        <Routes>
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });
  });
});
