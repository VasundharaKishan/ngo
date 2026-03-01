import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { API_BASE_URL } from '../api';
import { useSiteName, useSiteLogo } from '../contexts/ConfigContext';
import HeroCarousel from '../components/HeroCarousel';
import CampaignCarousel from '../components/CampaignCarousel';
import FeaturedCampaignsSection from '../components/sections/FeaturedCampaignsSection';
import StatsSection from '../components/sections/StatsSection';
import HeroSection from '../components/sections/HeroSection';
import WhyDonateSection from '../components/sections/WhyDonateSection';
import SkeletonLoader from '../components/SkeletonLoader';
import './Home.css';

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

  useEffect(() => {
    const loadSections = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/public/home`);

        if (!response.ok) {
          throw new Error(`Failed to load home sections (${response.status})`);
        }
        const data: HomeSection[] = await response.json();
        setSections(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    loadSections();
  }, []);

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
        <meta name="description" content="Join us in making a difference through transparent donations to education, healthcare, and community development campaigns in India." />
        <meta property="og:title" content={siteName} />
        <meta property="og:description" content="Support meaningful causes through transparent donations." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={logoUrl} />
      </Helmet>
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}

/**
 * SectionRenderer - Maps section type to component
 */
function SectionRenderer({ section }: { section: HomeSection }) {
  const { t } = useTranslation();
  // Parse config JSON
  const config = section.configJson ? JSON.parse(section.configJson) : {};
  
  switch (section.type) {
    case 'hero_carousel':
      return <HeroCarousel />;
    
    case 'hero_content':
      return <HeroSection config={config} />;
    
    case 'featured_campaigns':
      return <FeaturedCampaignsSection config={config} />;
    
    case 'stats':
      return <StatsSection config={config} />;
    
    case 'why_donate':
      return <WhyDonateSection config={config} />;

    case 'campaign_carousel':
      return (
        <CampaignCarousel
          title={config.title || t('home.defaultCarouselTitle')}
          limit={config.limit || 18}
          featured={config.featured || false}
        />
      );

    default:
      return null;
  }
}

