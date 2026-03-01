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
              <span className="mission-icon" aria-hidden="true">🎯</span>
              <h2>{t('about.mission')}</h2>
              <p>{t('about.missionDesc')}</p>
            </div>
            <div className="mission-card">
              <span className="mission-icon" aria-hidden="true">🌍</span>
              <h2>{t('about.vision')}</h2>
              <p>{t('about.visionDesc')}</p>
            </div>
            <div className="mission-card">
              <span className="mission-icon" aria-hidden="true">💎</span>
              <h2>{t('about.values')}</h2>
              <p>{t('about.valuesDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="about-section about-how-it-works">
        <div className="about-container">
          <h2 className="section-title">{t('about.howTitle')}</h2>
          <p className="section-subtitle">
            {t('about.howSubtitle')}
          </p>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon" aria-hidden="true">❤️</div>
              <h3>{t('about.step1Title')}</h3>
              <p>{t('about.step1Desc')}</p>
            </div>
            <div className="step-connector" aria-hidden="true">→</div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon" aria-hidden="true">📋</div>
              <h3>{t('about.step2Title')}</h3>
              <p>{t('about.step2Desc')}</p>
            </div>
            <div className="step-connector" aria-hidden="true">→</div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon" aria-hidden="true">🌟</div>
              <h3>{t('about.step3Title')}</h3>
              <p>{t('about.step3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Where we work */}
      <section className="about-section about-where">
        <div className="about-container">
          <h2 className="section-title">{t('about.whereTitle')}</h2>
          <p className="section-subtitle">
            {t('about.whereSubtitle')}
          </p>
          <div className="where-grid">
            <div className="where-card">
              <span className="where-flag" aria-hidden="true">🇮🇳</span>
              <h3>{t('about.india')}</h3>
              <p>{t('about.indiaDesc')}</p>
            </div>
            <div className="where-card">
              <span className="where-flag" aria-hidden="true">🇮🇪</span>
              <h3>{t('about.ireland')}</h3>
              <p>{t('about.irelandDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Transparency */}
      <section className="about-section about-trust">
        <div className="about-container">
          <h2 className="section-title">{t('about.trustTitle')}</h2>
          <div className="trust-grid">
            <div className="trust-item-card">
              <span className="trust-icon" aria-hidden="true">🔒</span>
              <h3>{t('about.trustSecure')}</h3>
              <p>{t('about.trustSecureDesc')}</p>
            </div>
            <div className="trust-item-card">
              <span className="trust-icon" aria-hidden="true">🏛️</span>
              <h3>{t('about.trustNgo')}</h3>
              <p>{t('about.trustNgoDesc')}</p>
            </div>
            <div className="trust-item-card">
              <span className="trust-icon" aria-hidden="true">💯</span>
              <h3>{t('about.trustFees')}</h3>
              <p>{t('about.trustFeesDesc')}</p>
            </div>
            <div className="trust-item-card">
              <span className="trust-icon" aria-hidden="true">📋</span>
              <h3>{t('about.trustReports')}</h3>
              <p>{t('about.trustReportsDesc')}</p>
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
            <Link to="/contact" className="btn-about-secondary">
              {t('about.ctaContact')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
