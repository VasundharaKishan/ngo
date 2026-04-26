import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useSiteName } from '../contexts/ConfigContext';
import './AboutPage.css';

export default function AboutPage() {
  const siteName = useSiteName();
  const { t } = useTranslation();

  return (
    <div className="about-page" data-testid="about-page">
      <Helmet>
        <title>{t('about.title')} | {siteName}</title>
        <meta name="description" content={`${t('about.title')} — ${siteName}`} />
        <meta property="og:title" content={`${t('about.title')} | ${siteName}`} />
      </Helmet>

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
              See our impact
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
