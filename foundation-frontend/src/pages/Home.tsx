import { useEffect, useState, useCallback, Component } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { API_BASE_URL } from '../api';
import { useSiteName, useSiteLogo, useConfig } from '../contexts/ConfigContext';
import HeroPanel from '../components/HeroPanel';
import DonationPanel from '../components/DonationPanel';
import CampaignCarousel from '../components/CampaignCarousel';
import FeaturedCampaignsSection from '../components/sections/FeaturedCampaignsSection';
import StatsSection from '../components/sections/StatsSection';
import HeroSection from '../components/sections/HeroSection';
import WhyDonateSection from '../components/sections/WhyDonateSection';
import MoneyAllocationSection from '../components/sections/MoneyAllocationSection';
import StoriesSection from '../components/sections/StoriesSection';
import FaqSection from '../components/sections/FaqSection';
import TransparencySection from '../components/sections/TransparencySection';
import SkeletonLoader from '../components/SkeletonLoader';
import './Home.css';

/** Catches render errors in a single home section without crashing the whole page. */
class SectionErrorBoundary extends Component<{ children: ReactNode }, { errored: boolean }> {
  state = { errored: false };
  static getDerivedStateFromError() { return { errored: true }; }
  render() {
    if (this.state.errored) return null; // silently skip broken section
    return this.props.children;
  }
}

interface HomeSection {
  id: string;
  type: string;
  sortOrder: number;
  configJson: string;
}

export default function Home() {
  const { t } = useTranslation();
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const siteName = useSiteName();
  const logoUrl = useSiteLogo();
  const { config } = useConfig();
  const seoDescription = config['seo.home_description'] ||
    `${siteName} — supporting education, healthcare, and community development through transparent donations.`;

  const loadSections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/public/home`);

      if (!response.ok) {
        throw new Error(`Failed to load home sections (${response.status})`);
      }
      const data: HomeSection[] = await response.json();
      setSections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  if (loading) {
    return (
      <div className="home">
        <SkeletonLoader variant="hero" height="600px" />
        <div style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <SkeletonLoader variant="stats" />
          <div style={{ marginTop: '4rem', display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home">
        <div className="error-container" style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          backgroundColor: '#fef2f2',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          margin: '2rem',
          color: '#dc2626'
        }}>
          <h2>{t('home.loadError')}</h2>
          <p>{t('home.errorPrefix', { error })}</p>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
            {t('home.serverDown')}
          </p>
          <button
            onClick={loadSections}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 2rem',
              backgroundColor: '#1e3a5f',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Show debug info if no sections
  if (sections.length === 0) {
    return (
      <div className="home">
        <div style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          backgroundColor: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '8px',
          margin: '2rem'
        }}>
          <h2>{t('home.noSections')}</h2>
          <p>{t('home.noSectionsDesc')}</p>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
            {t('home.adminHint')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      <Helmet>
        <title>{t('home.pageTitle', { siteName })}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={siteName} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={logoUrl} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      </Helmet>
      {sections.map((section) => (
        <SectionErrorBoundary key={section.id}>
          <SectionRenderer section={section} />
        </SectionErrorBoundary>
      ))}
    </div>
  );
}

/**
 * SectionRenderer - Maps section type to component
 */
function SectionRenderer({ section }: { section: HomeSection }) {
  const { t } = useTranslation();
  // Parse config JSON — malformed rows must not crash the entire page
  let config: Record<string, unknown> = {};
  try {
    if (section.configJson) config = JSON.parse(section.configJson);
  } catch {
    // Bad JSON in DB: skip config, let the section render with defaults
  }
  
  switch (section.type) {
    case 'hero_carousel':
    case 'hero_panel':
      // Carousel was retired in favour of a single editorial hero block. Legacy
      // `hero_carousel` rows are rendered as `hero_panel` so existing home_sections
      // don't need a data migration. The DonationPanel follows immediately per mockup.
      return (
        <>
          <HeroPanel />
          <DonationPanel />
        </>
      );
    
    case 'hero_content':
      return <HeroSection config={config} />;
    
    case 'featured_campaigns':
      return <FeaturedCampaignsSection config={config} />;
    
    case 'stats':
      return <StatsSection config={config} />;
    
    case 'why_donate':
      return <WhyDonateSection config={config} />;

    case 'money_allocation':
      return <MoneyAllocationSection config={config} />;

    case 'donation_panel':
      return <DonationPanel />;

    case 'stories':
      return <StoriesSection config={config} />;

    case 'faq':
      return <FaqSection config={config} />;

    case 'transparency':
      return <TransparencySection config={config} />;

    case 'campaign_carousel':
      return (
        <CampaignCarousel
          title={(config.title as string) || t('home.defaultCarouselTitle')}
          limit={(config.limit as number) || 18}
          featured={(config.featured as boolean) || false}
        />
      );

    default:
      return null;
  }
}

