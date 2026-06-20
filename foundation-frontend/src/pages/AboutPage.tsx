import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useSiteName, useSiteLogo } from '../contexts/ConfigContext';
import { useCMSContent } from '../hooks/useCMSContent';
import { sanitizeHtml } from '../utils/sanitize';
import './AboutPage.css';

export default function AboutPage() {
  const siteName = useSiteName();
  const logoUrl = useSiteLogo();
  const { t } = useTranslation();
  const { content, hasCMSContent } = useCMSContent('about');

  return (
    <div className="about-page" data-testid="about-page">
      <Helmet>
        <title>{t('about.title')} | {siteName}</title>
        <meta name="description" content={`Learn about ${siteName}'s mission, values, and the communities we serve.`} />
        <meta property="og:title" content={`${t('about.title')} | ${siteName}`} />
        <meta property="og:description" content={`Learn about ${siteName}'s mission, values, and the communities we serve.`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={logoUrl} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${t('about.title')} | ${siteName}`} />
        <meta name="twitter:description" content={`Learn about ${siteName}'s mission, values, and the communities we serve.`} />
        <meta name="twitter:image" content={logoUrl} />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      </Helmet>

      {hasCMSContent && content.body ? (
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.body) }} />
      ) : (
        <>
          {/* Hero */}
          <section className="about-hero">
            <div className="about-hero-inner">
              <h1>{t('about.heroTitle')}</h1>
              <p>
                {t('about.heroDescription', { siteName })}
              </p>
            </div>
          </section>

          {/* Mission & Vision */}
          <section className="about-section about-mission">
            <div className="about-container">
              <div className="mission-grid">
                <div className="mission-card">
                  <span className="mission-icon" aria-hidden="true">&#127919;</span>
                  <h2>{t('about.mission')}</h2>
                  <p>{t('about.missionDesc')}</p>
                </div>
                <div className="mission-card">
                  <span className="mission-icon" aria-hidden="true">&#127758;</span>
                  <h2>{t('about.vision')}</h2>
                  <p>{t('about.visionDesc')}</p>
                </div>
                <div className="mission-card">
                  <span className="mission-icon" aria-hidden="true">&#128142;</span>
                  <h2>{t('about.values')}</h2>
                  <p>{t('about.valuesDesc')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="about-cta">
            <div className="about-container">
              <h2>{t('about.ctaTitle')}</h2>
              <p>{t('about.ctaSubtitle')}</p>
              <div className="about-cta-buttons">
                <Link to="/campaigns" className="btn-about-primary">
                  {t('about.ctaBrowse')}
                </Link>
                <Link to="/impact" className="btn-about-secondary">
                  {t('about.ctaImpact')}
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
