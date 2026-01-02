import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HeroCarousel from './HeroCarousel';

const mockSlides = [
  {
    id: 1,
    title: 'Slide 1',
    subtitle: 'Subtitle 1',
    ctaText: 'Learn More',
    ctaLink: '/campaigns',
    imageUrl: 'https://example.com/slide1.jpg',
    altText: 'Slide 1 Image',
    focus: 'center',
    active: true,
    displayOrder: 1
  },
  {
    id: 2,
    title: 'Slide 2',
    subtitle: 'Subtitle 2',
    ctaText: 'Donate Now',
    ctaLink: '/donate',
    imageUrl: 'https://example.com/slide2.jpg',
    altText: 'Slide 2 Image',
    focus: 'top',
    active: true,
    displayOrder: 2
  },
  {
    id: 3,
    title: 'Slide 3',
    subtitle: 'Subtitle 3',
    ctaText: 'Get Involved',
    ctaLink: '/campaigns',
    imageUrl: 'https://example.com/slide3.jpg',
    altText: 'Slide 3 Image',
    focus: 'bottom',
    active: true,
    displayOrder: 3
  }
];

describe('HeroCarousel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders first slide initially', () => {
    render(<HeroCarousel slides={mockSlides} />);
    
    expect(screen.getByText('Slide 1')).toBeInTheDocument();
    expect(screen.getByText('Subtitle 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /learn more/i })).toBeInTheDocument();
  });

  it('auto-advances to next slide after 5 seconds', async () => {
    render(<HeroCarousel slides={mockSlides} />);
    
    expect(screen.getByText('Slide 1')).toBeInTheDocument();
    
    vi.advanceTimersByTime(5000);
    
    await waitFor(() => {
      expect(screen.getByText('Slide 2')).toBeInTheDocument();
    });
  });

  it('navigates to next slide when next button clicked', () => {
    render(<HeroCarousel slides={mockSlides} />);
    
    const nextButton = screen.getByLabelText(/next slide/i);
    fireEvent.click(nextButton);
    
    expect(screen.getByText('Slide 2')).toBeInTheDocument();
  });

  it('navigates to previous slide when previous button clicked', () => {
    render(<HeroCarousel slides={mockSlides} />);
    
    const prevButton = screen.getByLabelText(/previous slide/i);
    fireEvent.click(prevButton);
    
    expect(screen.getByText('Slide 3')).toBeInTheDocument();
  });

  it('loops back to first slide after last slide', () => {
    render(<HeroCarousel slides={mockSlides} />);
    
    const nextButton = screen.getByLabelText(/next slide/i);
    fireEvent.click(nextButton); // Slide 2
    fireEvent.click(nextButton); // Slide 3
    fireEvent.click(nextButton); // Should loop to Slide 1
    
    expect(screen.getByText('Slide 1')).toBeInTheDocument();
  });

  it('displays correct number of indicators', () => {
    render(<HeroCarousel slides={mockSlides} />);
    
    const indicators = screen.getAllByRole('button', { name: /go to slide/i });
    expect(indicators).toHaveLength(3);
  });

  it('navigates to specific slide when indicator clicked', () => {
    render(<HeroCarousel slides={mockSlides} />);
    
    const thirdIndicator = screen.getByRole('button', { name: /go to slide 3/i });
    fireEvent.click(thirdIndicator);
    
    expect(screen.getByText('Slide 3')).toBeInTheDocument();
  });

  it('marks current slide indicator as active', () => {
    render(<HeroCarousel slides={mockSlides} />);
    
    const firstIndicator = screen.getByRole('button', { name: /go to slide 1/i });
    expect(firstIndicator).toHaveClass('active');
  });

  it('renders empty state when no slides provided', () => {
    render(<HeroCarousel slides={[]} />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders single slide without auto-advance', () => {
    const singleSlide = [mockSlides[0]];
    render(<HeroCarousel slides={singleSlide} />);
    
    expect(screen.getByText('Slide 1')).toBeInTheDocument();
    
    vi.advanceTimersByTime(5000);
    
    expect(screen.getByText('Slide 1')).toBeInTheDocument();
  });

  it('displays all slide images with lazy loading', () => {
    render(<HeroCarousel slides={mockSlides} />);
    
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);
    expect(images[0]).toHaveAttribute('loading', 'eager');
    expect(images[1]).toHaveAttribute('loading', 'lazy');
  });

  it('pauses auto-advance on mouse enter', () => {
    render(<HeroCarousel slides={mockSlides} />);
    
    const carousel = screen.getByRole('region');
    fireEvent.mouseEnter(carousel);
    
    vi.advanceTimersByTime(5000);
    
    expect(screen.getByText('Slide 1')).toBeInTheDocument();
  });

  it('resumes auto-advance on mouse leave', async () => {
    render(<HeroCarousel slides={mockSlides} />);
    
    const carousel = screen.getByRole('region');
    fireEvent.mouseEnter(carousel);
    fireEvent.mouseLeave(carousel);
    
    vi.advanceTimersByTime(5000);
    
    await waitFor(() => {
      expect(screen.getByText('Slide 2')).toBeInTheDocument();
    });
  });

  it('applies correct focus positioning to images', () => {
    render(<HeroCarousel slides={mockSlides} />);
    
    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveStyle({ objectPosition: 'center' });
  });
});
