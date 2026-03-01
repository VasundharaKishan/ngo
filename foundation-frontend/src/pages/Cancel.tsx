import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useSiteName } from '../contexts/ConfigContext';
import './Success.css';

export default function Cancel() {
  const siteName = useSiteName();
  return (
    <div className="container">
      <Helmet>
        <title>Payment Cancelled | {siteName}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="status-page">
        <div className="cancel-icon">✕</div>
        <h1>Payment Cancelled</h1>
        <p className="message">
          Your payment was cancelled. No charges have been made.
          You can try again whenever you're ready.
        </p>
        <div className="actions">
          <Link to="/campaigns" className="btn-primary">
            Back to Campaigns
          </Link>
          <Link to="/" className="btn-secondary">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
