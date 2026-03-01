import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CampaignList from './CampaignList';
import { api } from '../api';
import type { Campaign, Category } from '../api';
import { ConfigProvider } from '../contexts/ConfigContext';

vi.mock('../api', () => ({
  API_BASE_URL: 'http://localhost:8080/api',
  api: {
    getCampaigns: vi.fn(),
    getCampaignsPaginated: vi.fn(),
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
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          primaryColor: '#2563eb',
          secondaryColor: '#7c3aed',
          headerHeight: 76
        })
      } as Response)
    );
    vi.mocked(api.getCampaigns).mockResolvedValue(mockCampaigns);
    vi.mocked(api.getCampaignsPaginated).mockResolvedValue({ items: mockCampaigns, totalPages: 1, totalItems: 3, currentPage: 0 });
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

  it('displays loading state initially', async () => {
    vi.mocked(api.getCampaignsPaginated).mockImplementation(
      () => new Promise(() => {})
    );

    renderWithProviders(<CampaignList />);

    await waitFor(() => {
      // CampaignList shows skeleton loaders, not "loading" text
      expect(document.querySelector('.skeleton-card')).toBeInTheDocument();
    });
  });

  it('fetches campaigns on mount', async () => {
    renderWithProviders(<CampaignList />);

    await waitFor(() => {
      expect(api.getCampaignsPaginated).toHaveBeenCalled();
    });
  });

  it('displays campaigns correctly', async () => {
    renderWithProviders(<CampaignList />);

    await waitFor(() => {
      expect(screen.getByText('Campaign 1')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    vi.mocked(api.getCampaignsPaginated).mockRejectedValue(new Error('API Error'));

    renderWithProviders(<CampaignList />);

    await waitFor(() => {
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
    });
  });

  it('displays empty state when no campaigns', async () => {
    vi.mocked(api.getCampaignsPaginated).mockResolvedValue({ items: [], totalPages: 0, totalItems: 0, currentPage: 0 });

    renderWithProviders(<CampaignList />);

    await waitFor(() => {
      expect(screen.getByText(/no active campaigns/i)).toBeInTheDocument();
    });
  });

  it('displays subtitle', async () => {
    renderWithProviders(<CampaignList />);

    await waitFor(() => {
      expect(screen.getByText(/active campaigns/i)).toBeInTheDocument();
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
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  it('calls getCampaignsPaginated on mount', async () => {
    renderWithProviders(<CampaignList />);

    await waitFor(() => {
      expect(api.getCampaignsPaginated).toHaveBeenCalled();
    });
  });

  // Helper: override fetch to set itemsPerPage=1 so 3 campaigns => 3 client-side pages
  const fetchWithItemsPerPage1 = () =>
    Promise.resolve({
      ok: true,
      json: async () => ({
        'campaigns_page.items_per_page': '1',
        'homepage.featured_campaigns_count': '3',
        'site.name': 'Test Site',
      }),
    } as Response);

  it('shows pagination controls when totalPages > 1', async () => {
    global.fetch = vi.fn().mockImplementation(fetchWithItemsPerPage1);
    vi.mocked(api.getCampaignsPaginated).mockResolvedValue({
      items: mockCampaigns,
      totalPages: 1,
      totalItems: 3,
      currentPage: 0,
    });

    renderWithProviders(<CampaignList />);

    await waitFor(() => {
      expect(screen.getByTestId('campaigns-next')).toBeInTheDocument();
    });
    expect(screen.getByTestId('campaigns-prev')).toBeInTheDocument();
    expect(screen.getByTestId('campaigns-page-1')).toBeInTheDocument();
    expect(screen.getByTestId('campaigns-page-2')).toBeInTheDocument();
    expect(screen.getByTestId('campaigns-page-3')).toBeInTheDocument();
  });

  it('calls handlePageChange and scrolls to top when Next is clicked', async () => {
    const scrollToMock = vi.fn();
    vi.spyOn(window, 'scrollTo').mockImplementation(scrollToMock);

    global.fetch = vi.fn().mockImplementation(fetchWithItemsPerPage1);
    vi.mocked(api.getCampaignsPaginated).mockResolvedValue({
      items: mockCampaigns,
      totalPages: 1,
      totalItems: 3,
      currentPage: 0,
    });

    renderWithProviders(<CampaignList />);

    const nextBtn = await screen.findByTestId('campaigns-next');
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });

  it('previous button is disabled on first page', async () => {
    global.fetch = vi.fn().mockImplementation(fetchWithItemsPerPage1);
    vi.mocked(api.getCampaignsPaginated).mockResolvedValue({
      items: mockCampaigns,
      totalPages: 1,
      totalItems: 3,
      currentPage: 0,
    });

    renderWithProviders(<CampaignList />);

    const prevBtn = await screen.findByTestId('campaigns-prev');
    expect(prevBtn).toBeDisabled();
  });

  it('clicking a page number button calls handlePageChange', async () => {
    const scrollToMock = vi.fn();
    vi.spyOn(window, 'scrollTo').mockImplementation(scrollToMock);

    global.fetch = vi.fn().mockImplementation(fetchWithItemsPerPage1);
    vi.mocked(api.getCampaignsPaginated).mockResolvedValue({
      items: mockCampaigns,
      totalPages: 1,
      totalItems: 3,
      currentPage: 0,
    });

    renderWithProviders(<CampaignList />);

    const page2Btn = await screen.findByTestId('campaigns-page-2');
    fireEvent.click(page2Btn);

    await waitFor(() => {
      expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });
});
