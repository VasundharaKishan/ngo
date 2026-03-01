import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useSiteName } from '../contexts/ConfigContext';
import './NotFound.css';

export default function NotFound() {
  const siteName = useSiteName();
  const { t } = useTranslation();
  return (
    <div className="container">
      <Helmet>
        <title>404 {t('notFound.title')} | {siteName}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="not-found-page">
        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">{t('notFound.title')}</h2>
        <p className="not-found-message">
          {t('notFound.message')}
        </p>
        <div className="not-found-actions">
          <Link to="/" className="btn-primary">
            {t('notFound.backHome')}
          </Link>
          <Link to="/campaigns" className="btn-secondary">
            {t('campaign.allCampaigns')}
          </Link>
        </div>
      </div>
    </div>
  );
}
