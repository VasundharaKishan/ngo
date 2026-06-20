import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { RiDownloadLine } from 'react-icons/ri';
import { API_BASE_URL } from '../api';
import { API_ENDPOINTS } from '../config/constants';
import { useSiteName } from '../contexts/ConfigContext';
import { trackEvent } from '../utils/analytics';
import './Success.css';

interface DonationDetails {
  id: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  campaignTitle: string;
  receiptToken?: string;
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
  const { t } = useTranslation();
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
        if (data.status === 'SUCCESS') {
          trackEvent('purchase', 'donation', data.campaignTitle, data.amount);
        }
        setDonation(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    verifyDonation();
  }, [sessionId]);

  // No session_id in URL — this page was opened directly, not from Stripe
  if (!sessionId) {
    return (
      <div className="container">
        <Helmet>
          <title>Invalid page | {siteName}</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="status-page">
          <div className="success-icon" style={{ color: '#d97706' }}>!</div>
          <h1>{t('donation.invalidSession', 'Invalid page')}</h1>
          <p className="message">{t('donation.invalidSessionMessage', 'This page can only be reached after completing a donation.')}</p>
          <div className="actions">
            <Link to="/campaigns" className="btn-primary">{t('donation.viewOtherCampaigns')}</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <Helmet>
          <title>{t('donation.successTitle')} | {siteName}</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="status-page">
          <div className="success-icon" style={{ opacity: 0.5 }}>...</div>
          <h1>{t('donation.verifying')}</h1>
          <p className="message">{t('donation.verifyingMessage')}</p>
        </div>
      </div>
    );
  }

  const handleDownloadReceipt = () => {
    if (!donation) return;
    const receiptPath = API_ENDPOINTS.DONATIONS.RECEIPT(donation.id);
    const url = donation.receiptToken
      ? `${API_BASE_URL}${receiptPath}?token=${encodeURIComponent(donation.receiptToken)}`
      : `${API_BASE_URL}${receiptPath}?email=${encodeURIComponent(donation.donorEmail)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isFailed = donation?.status === 'FAILED';
  const isPending = donation?.status === 'PENDING';
  const canDownloadReceipt = donation?.status === 'SUCCESS' && donation?.donorEmail;

  return (
    <div className="container">
      <Helmet>
        <title>
          {isFailed
            ? t('donation.failedTitle', 'Payment failed')
            : isPending
            ? t('donation.pendingTitle', 'Payment pending')
            : t('donation.successTitle')} | {siteName}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="status-page">
        <div
          className="success-icon"
          style={isFailed ? { color: '#dc2626' } : isPending ? { color: '#d97706' } : undefined}
        >
          {isFailed ? '✗' : isPending ? '⏳' : '✓'}
        </div>
        <h1>
          {isFailed
            ? t('donation.failedTitle', 'Payment failed')
            : isPending
            ? t('donation.pendingTitle', 'Payment pending')
            : t('donation.successTitle')}
        </h1>

        {donation && (
          <div className="donation-details" style={{
            background: isFailed ? '#fef2f2' : isPending ? '#fffbeb' : '#f0fdf4',
            border: `1px solid ${isFailed ? '#fecaca' : isPending ? '#fde68a' : '#bbf7d0'}`,
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
          }}>
            <p style={{ margin: '0.35rem 0', color: '#334155' }}>
              <strong>{t('donation.amountLabel')}</strong> {formatAmount(donation.amount, donation.currency)}
            </p>
            <p style={{ margin: '0.35rem 0', color: '#334155' }}>
              <strong>{t('donation.campaignLabel')}</strong> {donation.campaignTitle}
            </p>
            <p style={{ margin: '0.35rem 0', color: '#334155' }}>
              <strong>{t('donation.donorLabel')}</strong> {donation.donorName || t('donation.anonymous')}
            </p>
            <p style={{ margin: '0.35rem 0', color: '#334155' }}>
              <strong>{t('donation.statusLabel')}</strong>{' '}
              <span style={{
                color: donation.status === 'SUCCESS' ? '#16a34a' :
                       donation.status === 'PENDING' ? '#d97706' : '#dc2626',
                fontWeight: 600,
              }}>
                {donation.status === 'SUCCESS' ? t('donation.statusCompleted') :
                 donation.status === 'PENDING' ? t('donation.statusProcessing') : t('donation.statusFailed')}
              </span>
            </p>
            <p style={{ margin: '0.35rem 0', fontSize: '0.85rem', color: '#475569' }}>
              {t('donation.referenceLabel')} {donation.id}
            </p>
          </div>
        )}

        {error && (
          <p className="message" style={{ color: '#d97706' }}>
            {t('donation.verifyError')}
          </p>
        )}

        {!donation && !error && (
          <p className="message">
            {t('donation.genericSuccess')}
          </p>
        )}

        {canDownloadReceipt && (
          <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <button
              data-testid="download-receipt-btn"
              onClick={handleDownloadReceipt}
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
              }}
            >
              <RiDownloadLine /> Download Receipt (PDF)
            </button>
          </div>
        )}

        <div className="actions">
          <Link to="/campaigns" className="btn-primary">
            {t('donation.viewOtherCampaigns')}
          </Link>
          <Link to="/" className="btn-secondary">
            {t('donation.returnHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
