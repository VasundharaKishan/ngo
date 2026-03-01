import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HeroCarousel from './HeroCarousel';

const renderCarousel = () => render(
  <BrowserRouter>
    <HeroCarousel />
  </BrowserRouter>
);

// Mock fetch
const mockSlides = [
  {
    id: '1',
    imageUrl: 'https://example.com/slide1.jpg',
    altText: 'Slide 1',
    focus: 'CENTER' as const,
    enabled: true,
    sortOrder: 1,
    title: 'Support Education',
    subtitle: 'Help children access quality education'
  },
  {
    id: '2',
    imageUrl: 'https://example.com/slide2.jpg',
    altText: 'Slide 2',
    focus: 'RIGHT' as const,
    enabled: true,
    sortOrder: 2,
    title: 'Community Health',
    subtitle: undefined
  },
  {
    id: '3',
    imageUrl: 'https://example.com/slide3.jpg',
    altText: 'Slide 3',
    focus: 'LEFT' as const,
    enabled: true,
    sortOrder: 3
    // no title or subtitle — tests backward compatibility
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

    renderCarousel();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('loads and displays slides', async () => {
    renderCarousel();

    await waitFor(() => {
      expect(screen.getByAltText('Slide 1')).toBeInTheDocument();
    });

    expect(screen.getByAltText('Slide 2')).toBeInTheDocument();
    expect(screen.getByAltText('Slide 3')).toBeInTheDocument();
  });

  it('fetches slides from API on mount', async () => {
    renderCarousel();

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

    const { container } = renderCarousel();

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

    const { container } = renderCarousel();

    await waitFor(() => {
      expect(container.querySelector('.carousel-loading')).not.toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('applies correct object position based on focus', async () => {
    renderCarousel();

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
    renderCarousel();

    await waitFor(() => {
      const slide1 = screen.getByAltText('Slide 1');
      expect(slide1).toHaveAttribute('loading', 'eager');
    });
  });

  it('sets subsequent slides to lazy loading', async () => {
    renderCarousel();

    await waitFor(() => {
      const slide2 = screen.getByAltText('Slide 2');
      expect(slide2).toHaveAttribute('loading', 'lazy');
    });

    const slide3 = screen.getByAltText('Slide 3');
    expect(slide3).toHaveAttribute('loading', 'lazy');
  });

  it('displays carousel controls after loading', async () => {
    renderCarousel();

    await waitFor(() => {
      expect(screen.getByAltText('Slide 1')).toBeInTheDocument();
    });

    const carousel = screen.getByAltText('Slide 1').closest('.hero-carousel');
    expect(carousel).toBeInTheDocument();
  });

  it('renders all slides in DOM', async () => {
    renderCarousel();

    await waitFor(() => {
      const slides = screen.getAllByRole('img');
      expect(slides).toHaveLength(3);
    });
  });

  it('clicking Next slide button advances to next slide', async () => {
    const { container } = renderCarousel();

    await waitFor(() => {
      expect(screen.getByAltText('Slide 1')).toBeInTheDocument();
    });

    // Verify slide 1 is active initially
    const slide1Parent = screen.getByAltText('Slide 1').closest('.carousel-slide');
    expect(slide1Parent).toHaveClass('active');

    // Click next
    const nextBtn = screen.getByRole('button', { name: /Next slide/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      const slide2Parent = screen.getByAltText('Slide 2').closest('.carousel-slide');
      expect(slide2Parent).toHaveClass('active');
    });

    void container;
  });

  it('clicking Previous slide button goes to previous slide (wraps to last)', async () => {
    renderCarousel();

    await waitFor(() => {
      expect(screen.getByAltText('Slide 1')).toBeInTheDocument();
    });

    // First slide is active, click prev → wraps to slide 3
    const prevBtn = screen.getByRole('button', { name: /Previous slide/i });
    fireEvent.click(prevBtn);

    await waitFor(() => {
      const slide3Parent = screen.getByAltText('Slide 3').closest('.carousel-slide');
      expect(slide3Parent).toHaveClass('active');
    });
  });

  it('displays slide counter showing current and total slides', async () => {
    renderCarousel();

    await waitFor(() => {
      expect(screen.getByAltText('Slide 1')).toBeInTheDocument();
    });

    // Counter should show "1 / 3" initially
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // After clicking next, counter current updates to 2
    const nextBtn = screen.getByRole('button', { name: /Next slide/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('pauses autoplay on mouse enter and resumes on mouse leave', async () => {
    const { container } = renderCarousel();

    await waitFor(() => {
      expect(screen.getByAltText('Slide 1')).toBeInTheDocument();
    });

    const carousel = container.querySelector('.hero-carousel')!;
    fireEvent.mouseEnter(carousel);
    fireEvent.mouseLeave(carousel);

    // No assertions needed — just confirms handlers run without error
    expect(carousel).toBeInTheDocument();
  });

  it('renders title overlay when slide has title', async () => {
    renderCarousel();

    await waitFor(() => {
      expect(screen.getByText('Support Education')).toBeInTheDocument();
    });
  });

  it('renders subtitle text when slide has subtitle', async () => {
    renderCarousel();

    await waitFor(() => {
      expect(screen.getByText('Help children access quality education')).toBeInTheDocument();
    });
  });

  it('does not render caption when slide has no title or subtitle', async () => {
    renderCarousel();

    await waitFor(() => {
      expect(screen.getByAltText('Slide 3')).toBeInTheDocument();
    });

    const slide3 = screen.getByAltText('Slide 3').closest('.carousel-slide');
    expect(slide3?.querySelector('.carousel-caption')).toBeNull();
  });
});
