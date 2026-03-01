import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useSiteName } from '../contexts/ConfigContext';
import './Success.css';

export default function Cancel() {
  const { t } = useTranslation();
  const siteName = useSiteName();
  return (
    <div className="container">
      <Helmet>
        <title>{t('donation.cancelTitle')} | {siteName}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="status-page">
        <div className="cancel-icon">✕</div>
        <h1>{t('donation.cancelTitle')}</h1>
        <p className="message">
          {t('donation.cancelMessage')}
        </p>
        <div className="actions">
          <Link to="/campaigns" className="btn-primary">
            {t('campaign.backToCampaigns')}
          </Link>
          <Link to="/" className="btn-secondary">
            {t('donation.returnHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
