import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FeaturedCampaignModal from './FeaturedCampaignModal';
import * as api from '../api';

// Mock the API
vi.mock('../api', () => ({
  api: {
    getDonatePopup: vi.fn(),
  },
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('FeaturedCampaignModal', () => {
  const mockSpotlightResponse = {
    campaign: {
      id: 'camp-001',
      title: 'Education Campaign',
      shortDescription: 'Help children access quality education',
      imageUrl: 'https://example.com/image.jpg',
      targetAmount: 50000,
      currentAmount: 20000,
      currency: 'usd',
      progressPercent: 40,
      badgeText: 'Active Campaign',
      categoryName: 'Education',
      categoryIcon: '📚',
    },
    mode: 'SPOTLIGHT' as const,
    fallbackReason: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(api.api.getDonatePopup).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <BrowserRouter>
        <FeaturedCampaignModal isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText('Loading campaign...')).toBeInTheDocument();
  });

  it('renders spotlight campaign when loaded', async () => {
    vi.mocked(api.api.getDonatePopup).mockResolvedValue(mockSpotlightResponse);

    render(
      <BrowserRouter>
        <FeaturedCampaignModal isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Education Campaign')).toBeInTheDocument();
    });

    expect(screen.getByText('Help children access quality education')).toBeInTheDocument();
    expect(screen.getByText('Active Campaign')).toBeInTheDocument();
  });

  it('renders fallback campaign', async () => {
    const fallbackResponse = {
      ...mockSpotlightResponse,
      mode: 'FALLBACK' as const,
      fallbackReason: 'NO_SPOTLIGHT_SET' as const,
    };

    vi.mocked(api.api.getDonatePopup).mockResolvedValue(fallbackResponse);

    render(
      <BrowserRouter>
        <FeaturedCampaignModal isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Education Campaign')).toBeInTheDocument();
    });
  });

  it('renders error state when no campaigns available', async () => {
    const errorResponse = {
      campaign: null,
      mode: 'FALLBACK' as const,
      fallbackReason: 'NO_ACTIVE_CAMPAIGNS' as const,
    };

    vi.mocked(api.api.getDonatePopup).mockResolvedValue(errorResponse);

    render(
      <BrowserRouter>
        <FeaturedCampaignModal isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No active campaigns available/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Browse All Campaigns')).toBeInTheDocument();
  });

  it('renders error state when API fails', async () => {
    vi.mocked(api.api.getDonatePopup).mockRejectedValue(new Error('API Error'));

    render(
      <BrowserRouter>
        <FeaturedCampaignModal isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load campaign/i)).toBeInTheDocument();
    });
  });

  it('navigates to donate page when Donate is clicked', async () => {
    vi.mocked(api.api.getDonatePopup).mockResolvedValue(mockSpotlightResponse);

    render(
      <BrowserRouter>
        <FeaturedCampaignModal isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Education Campaign')).toBeInTheDocument();
    });

    const donateButton = screen.getByText('Donate');
    fireEvent.click(donateButton);

    expect(mockNavigate).toHaveBeenCalledWith('/donate/camp-001');
  });

  it('navigates to campaign detail when Learn More is clicked', async () => {
    vi.mocked(api.api.getDonatePopup).mockResolvedValue(mockSpotlightResponse);

    render(
      <BrowserRouter>
        <FeaturedCampaignModal isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Education Campaign')).toBeInTheDocument();
    });

    const learnMoreButton = screen.getByText('Learn more');
    fireEvent.click(learnMoreButton);

    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/camp-001');
  });

  it('closes modal when close button is clicked', async () => {
    const mockClose = vi.fn();
    vi.mocked(api.api.getDonatePopup).mockResolvedValue(mockSpotlightResponse);

    render(
      <BrowserRouter>
        <FeaturedCampaignModal isOpen={true} onClose={mockClose} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Education Campaign')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockClose).toHaveBeenCalled();
  });

  it('does not render when isOpen is false', () => {
    render(
      <BrowserRouter>
        <FeaturedCampaignModal isOpen={false} onClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.queryByText('Education Campaign')).not.toBeInTheDocument();
  });

  it('displays correct badge text for urgent campaign', async () => {
    const urgentResponse = {
      ...mockSpotlightResponse,
      campaign: {
        ...mockSpotlightResponse.campaign,
        badgeText: 'Urgent Need',
      },
    };

    vi.mocked(api.api.getDonatePopup).mockResolvedValue(urgentResponse);

    render(
      <BrowserRouter>
        <FeaturedCampaignModal isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Urgent Need')).toBeInTheDocument();
    });
  });

  it('fetches campaign data when modal opens', async () => {
    vi.mocked(api.api.getDonatePopup).mockResolvedValue(mockSpotlightResponse);

    const { rerender } = render(
      <BrowserRouter>
        <FeaturedCampaignModal isOpen={false} onClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(api.api.getDonatePopup).not.toHaveBeenCalled();

    rerender(
      <BrowserRouter>
        <FeaturedCampaignModal isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(api.api.getDonatePopup).toHaveBeenCalledTimes(1);
    });
  });
});
