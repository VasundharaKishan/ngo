import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useSiteName } from '../contexts/ConfigContext';
import './NotFound.css';

export default function NotFound() {
  const siteName = useSiteName();
  return (
    <div className="container">
      <Helmet>
        <title>404 Page Not Found | {siteName}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="not-found-page">
        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">Page Not Found</h2>
        <p className="not-found-message">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="not-found-actions">
          <Link to="/" className="btn-primary">
            Go Home
          </Link>
          <Link to="/campaigns" className="btn-secondary">
            Browse Campaigns
          </Link>
        </div>
      </div>
    </div>
  );
}
