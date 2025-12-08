import { Link } from 'react-router-dom';
import './Success.css';

export default function Cancel() {
  return (
    <div className="container">
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
