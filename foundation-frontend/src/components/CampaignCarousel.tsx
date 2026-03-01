import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, type Campaign } from '../api';
import { TIMING, IMAGES } from '../config/constants';
import './CampaignCarousel.css';

interface CampaignCarouselProps {
  limit?: number;
  title?: string;
  featured?: boolean;
}

export default function CampaignCarousel({
  limit = 18,
  title = 'Our Campaigns',
  featured = false,
}: CampaignCarouselProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const data = await api.getCampaigns({
          featured: featured || undefined,
          limit,
        });
        setCampaigns(data);
      } catch (error) {
        console.error('Error loading campaign carousel:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCampaigns();
  }, [limit, featured]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % campaigns.length);
  }, [campaigns.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + campaigns.length) % campaigns.length);
  }, [campaigns.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (!isPaused && campaigns.length > 1) {
      const interval = setInterval(nextSlide, TIMING.CAROUSEL_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isPaused, nextSlide, campaigns.length]);

  if (loading) {
    return (
      <section className="campaign-carousel-section">
        <div
          className="campaign-carousel-loading"
          role="status"
          aria-label="Loading campaigns"
        >
          <div className="campaign-carousel-skeleton" />
        </div>
      </section>
    );
  }

  if (campaigns.length === 0) return null;

  return (
    <section className="campaign-carousel-section" aria-label={title}>
      {title && <h2 className="campaign-carousel-title">{title}</h2>}
      <div
        className="campaign-carousel"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${title} — ${campaigns.length} slides`}
      >
        <div className="campaign-carousel-slides">
          {campaigns.map((campaign, index) => (
            <div
              key={campaign.id}
              className={`campaign-carousel-slide ${index === currentSlide ? 'active' : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${campaigns.length}: ${campaign.title}`}
              aria-hidden={index !== currentSlide}
            >
              <img
                src={campaign.imageUrl || IMAGES.PLACEHOLDER.CAMPAIGN}
                alt={campaign.title}
                loading={index === 0 ? 'eager' : 'lazy'}
                onError={(e) => {
                  e.currentTarget.src = IMAGES.PLACEHOLDER.CAMPAIGN;
                }}
              />
              <div className="campaign-carousel-overlay" aria-hidden="true" />
              <div className="campaign-carousel-caption">
                <h3 className="campaign-carousel-caption-title">{campaign.title}</h3>
                {campaign.shortDescription && (
                  <p className="campaign-carousel-caption-subtitle">
                    {campaign.shortDescription}
                  </p>
                )}
                <div className="campaign-carousel-caption-actions">
                  {campaign.active && (
                    <Link
                      to={`/donate/${campaign.id}`}
                      className="campaign-carousel-btn-donate"
                      tabIndex={index === currentSlide ? 0 : -1}
                    >
                      Donate Now
                    </Link>
                  )}
                  <Link
                    to={`/campaigns/${campaign.id}`}
                    className="campaign-carousel-btn-details"
                    tabIndex={index === currentSlide ? 0 : -1}
                  >
                    View Campaign
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className="campaign-carousel-arrow campaign-carousel-arrow-left"
          onClick={prevSlide}
          aria-label="Previous campaign"
        >
          ‹
        </button>

        <button
          className="campaign-carousel-arrow campaign-carousel-arrow-right"
          onClick={nextSlide}
          aria-label="Next campaign"
        >
          ›
        </button>

        <div
          className="campaign-carousel-progress"
          role="tablist"
          aria-label="Campaign slides"
        >
          {campaigns.map((campaign, index) => (
            <button
              key={index}
              role="tab"
              aria-selected={index === currentSlide}
              className={`campaign-carousel-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}: ${campaign.title}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
