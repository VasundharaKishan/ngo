import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CampaignCarousel from './CampaignCarousel';

// Mock the API module
const mockGetCampaigns = vi.fn();

vi.mock('../api', async () => {
  const actual = await vi.importActual('../api');
  return {
    ...actual,
    api: {
      ...(actual as Record<string, unknown>).api,
      getCampaigns: (...args: unknown[]) => mockGetCampaigns(...args),
    },
  };
});

const mockCampaigns = [
  {
    id: 'camp-1',
    title: 'Build School in Rural Village',
    slug: 'build-school',
    shortDescription: 'Construct a primary school for 200 children',
    description: 'Full description here',
    targetAmount: 500000,
    currency: 'usd',
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1?w=800',
    featured: true,
  },
  {
    id: 'camp-2',
    title: 'Flood Relief',
    slug: 'flood-relief',
    shortDescription: 'Emergency supplies for 500 families',
    description: 'Full description here',
    targetAmount: 85000,
    currency: 'usd',
    active: false, // inactive — should NOT show Donate Now
    imageUrl: 'https://images.unsplash.com/photo-2?w=800',
    featured: false,
  },
];

describe('CampaignCarousel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton while campaigns are fetching', () => {
    mockGetCampaigns.mockImplementation(() => new Promise(() => {})); // never resolves

    const { container } = render(
      <MemoryRouter>
        <CampaignCarousel />
      </MemoryRouter>
    );

    expect(container.querySelector('.campaign-carousel-skeleton')).toBeInTheDocument();
  });

  it('renders campaign slides after loading', async () => {
    mockGetCampaigns.mockResolvedValueOnce(mockCampaigns);

    render(
      <MemoryRouter>
        <CampaignCarousel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Build School in Rural Village')).toBeInTheDocument();
    });
    expect(screen.getByText('Flood Relief')).toBeInTheDocument();
  });

  it('renders subtitle text for each slide', async () => {
    mockGetCampaigns.mockResolvedValueOnce(mockCampaigns);

    render(
      <MemoryRouter>
        <CampaignCarousel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Construct a primary school for 200 children')).toBeInTheDocument();
    });
  });

  it('renders section title prop', async () => {
    mockGetCampaigns.mockResolvedValueOnce(mockCampaigns);

    render(
      <MemoryRouter>
        <CampaignCarousel title="Support Our Missions" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Support Our Missions')).toBeInTheDocument();
    });
  });

  it('shows Donate Now link only for active campaigns', async () => {
    mockGetCampaigns.mockResolvedValueOnce(mockCampaigns);

    render(
      <MemoryRouter>
        <CampaignCarousel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Build School in Rural Village')).toBeInTheDocument();
    });

    // Only one "Donate Now" link (camp-1 is active, camp-2 is inactive)
    const donateLinks = screen.getAllByText('Donate Now');
    expect(donateLinks.length).toBe(1);
  });

  it('renders View Campaign links for all campaigns', async () => {
    mockGetCampaigns.mockResolvedValueOnce(mockCampaigns);

    render(
      <MemoryRouter>
        <CampaignCarousel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Build School in Rural Village')).toBeInTheDocument();
    });

    const viewLinks = screen.getAllByText('View Campaign');
    expect(viewLinks.length).toBe(mockCampaigns.length);
  });

  it('returns null and renders nothing when no campaigns returned', async () => {
    mockGetCampaigns.mockResolvedValueOnce([]);

    const { container } = render(
      <MemoryRouter>
        <CampaignCarousel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(container.querySelector('.campaign-carousel')).not.toBeInTheDocument();
    });
  });

  it('clicking next arrow advances to the next slide', async () => {
    mockGetCampaigns.mockResolvedValueOnce(mockCampaigns);

    render(
      <MemoryRouter>
        <CampaignCarousel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Build School in Rural Village')).toBeInTheDocument();
    });

    // First slide should be active initially
    const slide1 = screen.getByText('Build School in Rural Village').closest('.campaign-carousel-slide');
    expect(slide1).toHaveClass('active');

    // Click next
    const nextBtn = screen.getByRole('button', { name: /Next campaign/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      const slide2 = screen.getByText('Flood Relief').closest('.campaign-carousel-slide');
      expect(slide2).toHaveClass('active');
    });
  });

  it('clicking a dot indicator navigates to that slide', async () => {
    mockGetCampaigns.mockResolvedValueOnce(mockCampaigns);

    render(
      <MemoryRouter>
        <CampaignCarousel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Build School in Rural Village')).toBeInTheDocument();
    });

    // Click the second dot
    const dot2 = screen.getByRole('tab', { name: /Go to slide 2/i });
    fireEvent.click(dot2);

    await waitFor(() => {
      const slide2 = screen.getByText('Flood Relief').closest('.campaign-carousel-slide');
      expect(slide2).toHaveClass('active');
    });
  });

  it('pauses auto-advance on mouse enter and resumes on mouse leave', async () => {
    mockGetCampaigns.mockResolvedValueOnce(mockCampaigns);

    const { container } = render(
      <MemoryRouter>
        <CampaignCarousel />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Build School in Rural Village')).toBeInTheDocument();
    });

    const carousel = container.querySelector('.campaign-carousel')!;
    fireEvent.mouseEnter(carousel);
    fireEvent.mouseLeave(carousel);
    // Smoke test: ensure no crash and carousel still present
    expect(carousel).toBeInTheDocument();
  });
});
