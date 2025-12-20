import { Link } from 'react-router-dom';
import './Success.css';

export default function Success() {
  return (
    <div className="container">
      <div className="status-page">
        <div className="success-icon">✓</div>
        <h1>Thank You for Your Donation!</h1>
        <p className="message">
          Your generous contribution will help us build schools and change lives.
          A confirmation email has been sent to you.
        </p>
        <div className="actions">
          <Link to="/campaigns" className="btn-primary">
            View Other Campaigns
          </Link>
          <Link to="/" className="btn-secondary">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
