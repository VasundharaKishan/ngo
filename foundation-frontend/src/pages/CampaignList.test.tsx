import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CampaignList from './CampaignList';
import { api } from '../api';
import type { Campaign, Category } from '../api';
import { ConfigProvider } from '../contexts/ConfigContext';

vi.mock('../api', () => ({
  api: {
    getCampaigns: vi.fn(),
    getCategories: vi.fn(),
    getPublicConfig: vi.fn()
  }
}));

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    title: 'Campaign 1',
    slug: 'campaign-1',
    shortDescription: 'Description 1',
    description: 'Full Description 1',
    targetAmount: 1000000, // $10,000 in cents
    currentAmount: 500000, // $5,000 in cents
    currency: 'USD',
    imageUrl: 'https://example.com/img1.jpg',
    categoryName: 'Education',
    active: true
  },
  {
    id: '2',
    title: 'Campaign 2',
    slug: 'campaign-2',
    shortDescription: 'Description 2',
    description: 'Full Description 2',
    targetAmount: 2000000, // $20,000 in cents
    currentAmount: 1000000, // $10,000 in cents
    currency: 'USD',
    imageUrl: 'https://example.com/img2.jpg',
    categoryName: 'Healthcare',
    active: true
  },
  {
    id: '3',
    title: 'Campaign 3',
    slug: 'campaign-3',
    shortDescription: 'Description 3',
    description: 'Full Description 3',
    targetAmount: 1500000, // $15,000 in cents
    currentAmount: 750000, // $7,500 in cents
    currency: 'USD',
    imageUrl: 'https://example.com/img3.jpg',
    categoryName: 'Environment',
    active: true
  }
];

const mockCategories: Category[] = [
  { id: '1', name: 'Education', slug: 'education', description: 'Education programs', icon: 'book', color: '#blue', active: true, displayOrder: 1 },
  { id: '2', name: 'Healthcare', slug: 'healthcare', description: 'Healthcare initiatives', icon: 'heart', color: '#red', active: true, displayOrder: 2 },
  { id: '3', name: 'Environment', slug: 'environment', description: 'Environmental projects', icon: 'leaf', color: '#green', active: true, displayOrder: 3 }
];

describe('CampaignList', () => {
  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <ConfigProvider>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </ConfigProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getCampaigns).mockResolvedValue(mockCampaigns);
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(api.getPublicConfig).mockResolvedValue({ featuredCampaignsCount: 3, itemsPerPage: 12 });
  });

  it('loads and displays all campaigns', async () => {
    renderWithProviders(<CampaignList />);

    await waitFor(() => {
      expect(screen.getByText('Campaign 1')).toBeInTheDocument();
      expect(screen.getByText('Campaign 2')).toBeInTheDocument();
      expect(screen.getByText('Campaign 3')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    vi.mocked(api.getCampaigns).mockImplementation(
      () => new Promise(() => {})
    );

    renderWithProviders(<CampaignList />);

    // CampaignList shows skeleton loaders, not "loading" text
    expect(document.querySelector('.skeleton-card')).toBeInTheDocument();
  });

  it('fetches campaigns on mount', async () => {
    renderWithProviders(<CampaignList />);

    await waitFor(() => {
      expect(api.getCampaigns).toHaveBeenCalled();
    });
  });

  it('displays campaigns correctly', async () => {
    renderWithProviders(<CampaignList />);

    await waitFor(() => {
      expect(screen.getByText('Campaign 1')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    vi.mocked(api.getCampaigns).mockRejectedValue(new Error('API Error'));

    renderWithProviders(<CampaignList />);

    await waitFor(() => {
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
    });
  });

  it('displays empty state when no campaigns', async () => {
    vi.mocked(api.getCampaigns).mockResolvedValue([]);

    renderWithProviders(<CampaignList />);

    await waitFor(() => {
      expect(screen.getByText(/no active campaigns/i)).toBeInTheDocument();
    });
  });

  it('displays subtitle', async () => {
    renderWithProviders(<CampaignList />);

    await waitFor(() => {
      expect(screen.getByText(/choose a campaign/i)).toBeInTheDocument();
    });
  });

  it('renders campaign cards in grid layout', async () => {
    renderWithProviders(<CampaignList />);

    await waitFor(() => {
      // Check for campaign titles (each card has h2 with campaign title)
      const campaignTitles = screen.getAllByRole('heading', { level: 2 });
      expect(campaignTitles).toHaveLength(3);
    });
  });

  it('displays page title', async () => {
    renderWithProviders(<CampaignList />);

    await waitFor(() => {
      expect(screen.getByText(/all campaigns/i)).toBeInTheDocument();
    });
  });

  it('calls getCampaigns on mount', () => {
    renderWithProviders(<CampaignList />);

    expect(api.getCampaigns).toHaveBeenCalled();
  });
});
