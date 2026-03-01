import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ImageCarousel from './ImageCarousel';

describe('ImageCarousel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when images array is empty', () => {
    const { container } = render(<ImageCarousel images={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when images is undefined-ish (empty)', () => {
    const { container } = render(<ImageCarousel images={[]} />);
    expect(container.querySelector('.carousel-container')).toBeNull();
  });

  it('renders a single image without navigation buttons', () => {
    render(<ImageCarousel images={['https://example.com/img1.jpg']} />);
    expect(screen.getByAltText('Impact photo 1')).toBeInTheDocument();
    expect(screen.queryByLabelText('Previous image')).toBeNull();
    expect(screen.queryByLabelText('Next image')).toBeNull();
  });

  it('renders multiple images with navigation buttons', () => {
    render(<ImageCarousel images={['img1.jpg', 'img2.jpg', 'img3.jpg']} />);
    expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
    expect(screen.getByLabelText('Next image')).toBeInTheDocument();
  });

  it('renders indicator buttons for multiple images', () => {
    render(<ImageCarousel images={['img1.jpg', 'img2.jpg', 'img3.jpg']} />);
    expect(screen.getByLabelText('Go to image 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to image 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to image 3')).toBeInTheDocument();
  });

  it('navigates to next image on next button click', () => {
    const { container } = render(<ImageCarousel images={['img1.jpg', 'img2.jpg', 'img3.jpg']} />);
    const slides = container.querySelector('.carousel-slides') as HTMLElement;
    expect(slides.style.transform).toBe('translateX(-0%)');
    fireEvent.click(screen.getByLabelText('Next image'));
    act(() => { vi.advanceTimersByTime(500); });
    expect(slides.style.transform).toBe('translateX(-100%)');
  });

  it('navigates to previous image on prev button click', () => {
    const { container } = render(<ImageCarousel images={['img1.jpg', 'img2.jpg', 'img3.jpg']} />);
    const slides = container.querySelector('.carousel-slides') as HTMLElement;
    // Go to next first
    fireEvent.click(screen.getByLabelText('Next image'));
    act(() => { vi.advanceTimersByTime(500); });
    expect(slides.style.transform).toBe('translateX(-100%)');
    fireEvent.click(screen.getByLabelText('Previous image'));
    act(() => { vi.advanceTimersByTime(500); });
    expect(slides.style.transform).toBe('translateX(-0%)');
  });

  it('navigates to specific slide via indicator', () => {
    const { container } = render(<ImageCarousel images={['img1.jpg', 'img2.jpg', 'img3.jpg']} />);
    const slides = container.querySelector('.carousel-slides') as HTMLElement;
    fireEvent.click(screen.getByLabelText('Go to image 3'));
    act(() => { vi.advanceTimersByTime(500); });
    expect(slides.style.transform).toBe('translateX(-200%)');
  });

  it('auto-plays when autoPlay is true', () => {
    const { container } = render(
      <ImageCarousel images={['img1.jpg', 'img2.jpg', 'img3.jpg']} autoPlay={true} interval={3000} />
    );
    const slides = container.querySelector('.carousel-slides') as HTMLElement;
    expect(slides.style.transform).toBe('translateX(-0%)');
    act(() => { vi.advanceTimersByTime(3000); });
    expect(slides.style.transform).toBe('translateX(-100%)');
  });

  it('does not auto-play when autoPlay is false', () => {
    const { container } = render(
      <ImageCarousel images={['img1.jpg', 'img2.jpg', 'img3.jpg']} autoPlay={false} interval={1000} />
    );
    const slides = container.querySelector('.carousel-slides') as HTMLElement;
    act(() => { vi.advanceTimersByTime(5000); });
    expect(slides.style.transform).toBe('translateX(-0%)');
  });
});
