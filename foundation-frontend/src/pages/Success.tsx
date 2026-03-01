import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { API_BASE_URL } from '../api';
import { useSiteName } from '../contexts/ConfigContext';
import './Success.css';

interface DonationDetails {
  id: string;
  donorName: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  campaignTitle: string;
}

function formatAmount(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    usd: '$', eur: '€', gbp: '£', inr: '₹',
  };
  const value = (amount / 100).toFixed(2);
  const symbol = symbols[currency?.toLowerCase()] || currency?.toUpperCase() + ' ';
  return `${symbol}${value}`;
}

export default function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [donation, setDonation] = useState<DonationDetails | null>(null);
  const [loading, setLoading] = useState(!!sessionId);
  const [error, setError] = useState(false);
  const siteName = useSiteName();

  useEffect(() => {
    if (!sessionId) return;

    const verifyDonation = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/donations/stripe/verify?sessionId=${encodeURIComponent(sessionId)}`
        );
        if (!res.ok) {
          setError(true);
          setLoading(false);
          return;
        }
        const data: DonationDetails = await res.json();
        setDonation(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    verifyDonation();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="container">
        <Helmet>
          <title>Thank You for Your Donation | {siteName}</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="status-page">
          <div className="success-icon" style={{ opacity: 0.5 }}>...</div>
          <h1>Verifying Your Donation...</h1>
          <p className="message">Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Helmet>
        <title>Thank You for Your Donation | {siteName}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="status-page">
        <div className="success-icon">✓</div>
        <h1>Thank You for Your Donation!</h1>

        {donation && (
          <div className="donation-details" style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
          }}>
            <p style={{ margin: '0.35rem 0', color: '#334155' }}>
              <strong>Amount:</strong> {formatAmount(donation.amount, donation.currency)}
            </p>
            <p style={{ margin: '0.35rem 0', color: '#334155' }}>
              <strong>Campaign:</strong> {donation.campaignTitle}
            </p>
            <p style={{ margin: '0.35rem 0', color: '#334155' }}>
              <strong>Donor:</strong> {donation.donorName || 'Anonymous'}
            </p>
            <p style={{ margin: '0.35rem 0', color: '#334155' }}>
              <strong>Status:</strong>{' '}
              <span style={{
                color: donation.status === 'SUCCESS' ? '#16a34a' :
                       donation.status === 'PENDING' ? '#d97706' : '#dc2626',
                fontWeight: 600,
              }}>
                {donation.status === 'SUCCESS' ? 'Completed' :
                 donation.status === 'PENDING' ? 'Processing' : 'Failed'}
              </span>
            </p>
            <p style={{ margin: '0.35rem 0', fontSize: '0.85rem', color: '#64748b' }}>
              Reference: {donation.id}
            </p>
          </div>
        )}

        {error && (
          <p className="message" style={{ color: '#d97706' }}>
            We could not verify your donation details, but if you completed the payment it has been received.
            A confirmation email will be sent to you shortly.
          </p>
        )}

        {!donation && !error && (
          <p className="message">
            Your generous contribution will help us build schools and change lives.
            A confirmation email has been sent to you.
          </p>
        )}

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
