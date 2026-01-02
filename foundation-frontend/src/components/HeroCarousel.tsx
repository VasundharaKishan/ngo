import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../api';
import { TIMING } from '../config/constants';
import './HeroCarousel.css';

type FocusPosition = 'CENTER' | 'RIGHT' | 'LEFT' | 'TOP' | 'BOTTOM';

interface HeroSlide {
  id: string;
  imageUrl: string;
  altText: string;
  focus: FocusPosition;
  enabled: boolean;
  sortOrder: number;
}

const focusMap: Record<FocusPosition, string> = {
  CENTER: 'center',
  RIGHT: '75% center',
  LEFT: '25% center',
  TOP: 'center 20%',
  BOTTOM: 'center 80%'
};

export default function HeroCarousel() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load slides from backend
  useEffect(() => {
    const loadSlides = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/public/hero-slides`);
        if (!response.ok) {
          throw new Error('Failed to load hero slides');
        }
        const data: HeroSlide[] = await response.json();
        setSlides(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading hero slides:', error);
        setLoading(false);
      }
    };

    loadSlides();
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (!isPaused && slides.length > 0) {
      const interval = setInterval(nextSlide, TIMING.CAROUSEL_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isPaused, nextSlide, slides.length]);

  if (loading) {
    return (
      <div className="hero-carousel">
        <div className="carousel-loading">Loading...</div>
      </div>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <div 
      className="hero-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="carousel-slides">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
          >
            <img 
              src={slide.imageUrl} 
              alt={slide.altText} 
              style={{ objectPosition: focusMap[slide.focus] }}
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            <div className="carousel-overlay"></div>
          </div>
        ))}
      </div>

      <button 
        className="carousel-arrow carousel-arrow-left" 
        onClick={prevSlide}
        aria-label="Previous slide"
      >
        ‹
      </button>
      
      <button 
        className="carousel-arrow carousel-arrow-right" 
        onClick={nextSlide}
        aria-label="Next slide"
      >
        ›
      </button>

      <div className="carousel-progress">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`progress-segment ${index === currentSlide ? 'active' : ''} ${index < currentSlide ? 'completed' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          >
            <span className="progress-fill"></span>
          </button>
        ))}
      </div>
    </div>
  );
}
