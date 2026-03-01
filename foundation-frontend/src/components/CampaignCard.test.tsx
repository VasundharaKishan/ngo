import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CampaignCard from './CampaignCard';
import type { Campaign } from '../api';

const mockCampaign: Campaign = {
  id: '1',
  title: 'Test Campaign',
  slug: 'test-campaign',
  shortDescription: 'Test campaign description for children education',
  description: 'Full description',
  targetAmount: 1000000, // $10,000 in cents
  currentAmount: 500000, // $5,000 in cents
  currency: 'USD',
  imageUrl: 'https://example.com/image.jpg',
  categoryName: 'Education',
  active: true
};

describe('CampaignCard', () => {
  it('renders campaign information correctly', () => {
    render(
      <BrowserRouter>
        <CampaignCard campaign={mockCampaign} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    expect(screen.getByText(/Test campaign description/)).toBeInTheDocument();
  });

  it('displays goal amount', () => {
    render(
      <BrowserRouter>
        <CampaignCard campaign={mockCampaign} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Goal:/)).toBeInTheDocument();
    // Amount displayed without decimals: $10,000
    expect(screen.getByText(/\$10,000/)).toBeInTheDocument();
  });

  it('displays currency symbol in goal', () => {
    render(
      <BrowserRouter>
        <CampaignCard campaign={mockCampaign} />
      </BrowserRouter>
    );

    // Currency symbol ($) is included in the formatted amount
    expect(screen.getByText(/\$10,000/)).toBeInTheDocument();
  });

  it('has link to campaign detail', () => {
    render(
      <BrowserRouter>
        <CampaignCard campaign={mockCampaign} />
      </BrowserRouter>
    );

    const detailLink = screen.getByRole('link', { name: /view details/i });
    expect(detailLink).toHaveAttribute('href', '/campaigns/1');
  });

  it('has link to donation form when active', () => {
    render(
      <BrowserRouter>
        <CampaignCard campaign={mockCampaign} />
      </BrowserRouter>
    );

    const donateLink = screen.getByRole('link', { name: /donate/i });
    expect(donateLink).toHaveAttribute('href', '/donate/1');
  });

  it('shows donate link for active campaign', () => {
    render(
      <BrowserRouter>
        <CampaignCard campaign={mockCampaign} />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /donate/i })).toBeInTheDocument();
    expect(screen.queryByText('Not Accepting Donations')).not.toBeInTheDocument();
  });

  it('does not show donate link when inactive', () => {
    const inactiveCampaign = { ...mockCampaign, active: false };
    render(
      <BrowserRouter>
        <CampaignCard campaign={inactiveCampaign} />
      </BrowserRouter>
    );

    expect(screen.queryByRole('link', { name: /donate/i })).not.toBeInTheDocument();
    expect(screen.getByText('Not Accepting Donations')).toBeInTheDocument();
  });

  it('displays target amount correctly', () => {
    render(
      <BrowserRouter>
        <CampaignCard campaign={mockCampaign} />
      </BrowserRouter>
    );

    // Amount now displayed without decimal places: $10,000
    expect(screen.getByText(/\$10,000/)).toBeInTheDocument();
  });

  it('has both View Details and Donate links when active', () => {
    render(
      <BrowserRouter>
        <CampaignCard campaign={mockCampaign} />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /view details/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /donate/i })).toBeInTheDocument();
  });

  it('renders with minimal campaign data', () => {
    const minimalCampaign: Campaign = {
      id: '2',
      title: 'Minimal Campaign',
      slug: 'minimal',
      shortDescription: 'Short desc',
      description: 'Desc',
      targetAmount: 500000, // $5,000 in cents
      currency: 'EUR',
      active: false
    };
    render(
      <BrowserRouter>
        <CampaignCard campaign={minimalCampaign} />
      </BrowserRouter>
    );

    expect(screen.getByText('Minimal Campaign')).toBeInTheDocument();
    expect(screen.getByText('Short desc')).toBeInTheDocument();
  });

  it('shows inactive label and no donate link when inactive', () => {
    const inactiveCampaign = { ...mockCampaign, active: false };
    render(
      <BrowserRouter>
        <CampaignCard campaign={inactiveCampaign} />
      </BrowserRouter>
    );

    expect(screen.getByText('Not Accepting Donations')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /donate/i })).not.toBeInTheDocument();
  });

  it('renders with long description field without error', () => {
    const longDescCampaign = {
      ...mockCampaign,
      description: 'A'.repeat(200)
    };
    render(
      <BrowserRouter>
        <CampaignCard campaign={longDescCampaign} />
      </BrowserRouter>
    );

    // Card always shows shortDescription, not the full description field
    expect(screen.getByText(/Test campaign description/)).toBeInTheDocument();
  });

  it('renders campaign image when imageUrl is provided', () => {
    render(
      <BrowserRouter>
        <CampaignCard campaign={mockCampaign} />
      </BrowserRouter>
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(img).toHaveAttribute('alt', 'Test Campaign');
  });

  it('renders image container without img element when imageUrl is absent', () => {
    const noImage = { ...mockCampaign, imageUrl: undefined };
    const { container } = render(
      <BrowserRouter>
        <CampaignCard campaign={noImage} />
      </BrowserRouter>
    );
    expect(container.querySelector('.card-image-container')).toBeInTheDocument();
    expect(container.querySelector('.card-image')).not.toBeInTheDocument();
  });

  it('sets loading="lazy" on campaign image', () => {
    render(
      <BrowserRouter>
        <CampaignCard campaign={mockCampaign} />
      </BrowserRouter>
    );
    expect(screen.getByRole('img')).toHaveAttribute('loading', 'lazy');
  });
});
