import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useSiteName } from '../contexts/ConfigContext';
import TrustBadges from '../components/TrustBadges';
import './ImpactPage.css';

export default function ImpactPage() {
  const siteName = useSiteName();
  const { t } = useTranslation();

  return (
    <div className="impact-page" data-testid="impact-page">
      <Helmet>
        <title>Our Impact | {siteName}</title>
        <meta name="description" content={`See how ${siteName} is making a difference — our reach, our process, and the trust we've built.`} />
        <meta property="og:title" content={`Our Impact | ${siteName}`} />
      </Helmet>

      {/* Hero */}
      <section className="impact-hero">
        <div className="impact-hero-inner">
          <h1>Our Impact</h1>
          <p>
            Every rupee you give creates real, measurable change.
            Here is how we turn your generosity into action.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="impact-section impact-how-it-works">
        <div className="impact-container">
          <h2 className="section-title">{t('about.howTitle')}</h2>
          <p className="section-subtitle">
            {t('about.howSubtitle')}
          </p>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon" aria-hidden="true">&hearts;</div>
              <h3>{t('about.step1Title')}</h3>
              <p>{t('about.step1Desc')}</p>
            </div>
            <div className="step-connector" aria-hidden="true">&rarr;</div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon" aria-hidden="true">&#128203;</div>
              <h3>{t('about.step2Title')}</h3>
              <p>{t('about.step2Desc')}</p>
            </div>
            <div className="step-connector" aria-hidden="true">&rarr;</div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon" aria-hidden="true">&#127775;</div>
              <h3>{t('about.step3Title')}</h3>
              <p>{t('about.step3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Where we work */}
      <section className="impact-section impact-where">
        <div className="impact-container">
          <h2 className="section-title">{t('about.whereTitle')}</h2>
          <p className="section-subtitle">
            {t('about.whereSubtitle')}
          </p>
          <div className="where-grid">
            <div className="where-card">
              <span className="where-flag" aria-hidden="true">&#127470;&#127475;</span>
              <h3>{t('about.india')}</h3>
              <p>{t('about.indiaDesc')}</p>
            </div>
            <div className="where-card">
              <span className="where-flag" aria-hidden="true">&#127470;&#127466;</span>
              <h3>{t('about.ireland')}</h3>
              <p>{t('about.irelandDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Transparency */}
      <section className="impact-section impact-trust">
        <div className="impact-container">
          <h2 className="section-title">{t('about.trustTitle')}</h2>
          <TrustBadges variant="grid" />
        </div>
      </section>

      {/* CTA */}
      <section className="impact-cta">
        <div className="impact-container">
          <h2>Be part of our next chapter</h2>
          <p>Your donation directly funds education, healthcare, and livelihoods in rural India.</p>
          <div className="impact-cta-buttons">
            <Link to="/campaigns" className="btn-impact-primary">
              Browse campaigns
            </Link>
            <Link to="/about" className="btn-impact-secondary">
              Learn about us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
