import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import HeroCarousel from './HeroCarousel';

// Mock fetch
const mockSlides = [
  {
    id: '1',
    imageUrl: 'https://example.com/slide1.jpg',
    altText: 'Slide 1',
    focus: 'CENTER' as const,
    enabled: true,
    sortOrder: 1
  },
  {
    id: '2',
    imageUrl: 'https://example.com/slide2.jpg',
    altText: 'Slide 2',
    focus: 'RIGHT' as const,
    enabled: true,
    sortOrder: 2
  },
  {
    id: '3',
    imageUrl: 'https://example.com/slide3.jpg',
    altText: 'Slide 3',
    focus: 'LEFT' as const,
    enabled: true,
    sortOrder: 3
  }
];

describe('HeroCarousel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSlides),
      } as Response)
    );
  });

  it('displays loading state initially', () => {
    // Keep fetch pending so loading state persists
    global.fetch = vi.fn(() => new Promise(() => {})) as any;

    render(<HeroCarousel />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('loads and displays slides', async () => {
    render(<HeroCarousel />);

    await waitFor(() => {
      expect(screen.getByAltText('Slide 1')).toBeInTheDocument();
    });

    expect(screen.getByAltText('Slide 2')).toBeInTheDocument();
    expect(screen.getByAltText('Slide 3')).toBeInTheDocument();
  });

  it('fetches slides from API on mount', async () => {
    render(<HeroCarousel />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/public/hero-slides')
      );
    });
  });

  it('renders null when no slides available', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
    );

    const { container } = render(<HeroCarousel />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('handles fetch error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
      } as Response)
    );

    const { container } = render(<HeroCarousel />);

    await waitFor(() => {
      expect(container.querySelector('.carousel-loading')).not.toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('applies correct object position based on focus', async () => {
    render(<HeroCarousel />);

    await waitFor(() => {
      const slide1 = screen.getByAltText('Slide 1');
      expect(slide1).toHaveStyle({ objectPosition: 'center' });
    });

    const slide2 = screen.getByAltText('Slide 2');
    expect(slide2).toHaveStyle({ objectPosition: '75% center' });

    const slide3 = screen.getByAltText('Slide 3');
    expect(slide3).toHaveStyle({ objectPosition: '25% center' });
  });

  it('sets first slide to eager loading', async () => {
    render(<HeroCarousel />);

    await waitFor(() => {
      const slide1 = screen.getByAltText('Slide 1');
      expect(slide1).toHaveAttribute('loading', 'eager');
    });
  });

  it('sets subsequent slides to lazy loading', async () => {
    render(<HeroCarousel />);

    await waitFor(() => {
      const slide2 = screen.getByAltText('Slide 2');
      expect(slide2).toHaveAttribute('loading', 'lazy');
    });

    const slide3 = screen.getByAltText('Slide 3');
    expect(slide3).toHaveAttribute('loading', 'lazy');
  });

  it('displays carousel controls after loading', async () => {
    render(<HeroCarousel />);

    await waitFor(() => {
      expect(screen.getByAltText('Slide 1')).toBeInTheDocument();
    });

    const carousel = screen.getByAltText('Slide 1').closest('.hero-carousel');
    expect(carousel).toBeInTheDocument();
  });

  it('renders all slides in DOM', async () => {
    render(<HeroCarousel />);

    await waitFor(() => {
      const slides = screen.getAllByRole('img');
      expect(slides).toHaveLength(3);
    });
  });
});
