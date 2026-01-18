import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HeroSection from './HeroSection';
import StatsSection from './StatsSection';
import FeaturedCampaignsSection from './FeaturedCampaignsSection';
import WhyDonateSection from './WhyDonateSection';

const mockGetCampaigns = vi.fn();
const mockGetContent = vi.fn();
const mockGetStats = vi.fn();

vi.mock('../../api', async () => {
  const actual = await vi.importActual('../../api');
  return { ...actual, api: { ...actual.api, getCampaigns: (...args: unknown[]) => mockGetCampaigns(...args) } };
});

vi.mock('../../cmsApi', () => ({
  cmsApi: { 
    getContent: (...args: unknown[]) => mockGetContent(...args),
    getStats: (...args: unknown[]) => mockGetStats(...args),
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('Section components render', () => {
  it('renders HeroSection', () => {
    const { asFragment } = render(
      <MemoryRouter>
        <HeroSection
          config={{
            title: 'Welcome',
            subtitle: 'Help us',
            ctaText: 'Donate',
            ctaLink: '/donate'
          }}
        />
      </MemoryRouter>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders StatsSection', async () => {
    mockGetStats.mockResolvedValueOnce([
      { id: '1', statLabel: 'Impact', statValue: '100+' },
    ]);

    render(<StatsSection config={{ title: 'Stats', animated: false }} />);

    await waitFor(() => expect(mockGetStats).toHaveBeenCalled());
    expect(screen.getByText('Impact')).toBeInTheDocument();
  });

  it('renders FeaturedCampaignsSection with fetched data', async () => {
    mockGetCampaigns.mockResolvedValueOnce([
      { id: '1', title: 'Water', targetAmount: 1000, currentAmount: 100, active: true, shortDescription: 'desc', currency: 'usd', slug: 'water' },
    ]);
    render(
      <MemoryRouter>
        <FeaturedCampaignsSection config={{ title: 'Featured' }} />
      </MemoryRouter>
    );
    await waitFor(() => expect(mockGetCampaigns).toHaveBeenCalled());
    expect(screen.getByText(/Featured/)).toBeInTheDocument();
  });

  it('renders WhyDonateSection with cms content', async () => {
    mockGetContent.mockResolvedValueOnce({ title: 'Why' });
    render(<WhyDonateSection config={{}} />);
    await waitFor(() => expect(mockGetContent).toHaveBeenCalled());
    expect(screen.getByText(/Why/)).toBeInTheDocument();
  });
});
