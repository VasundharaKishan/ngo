import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { api, type Campaign } from '../api';
import { formatCurrency, formatCurrencyCode } from '../utils/currency';
import { useSiteName } from '../contexts/ConfigContext';
import { getDetailUrl } from '../utils/imageUtils';
import './CampaignDetail.css';

function ShareButtons({ title, url }: { title: string; url: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the URL from input
    }
  };

  return (
    <div className="share-section">
      <p className="share-label">{t('campaign.shareLabel')}</p>
      <div className="share-buttons">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="share-btn share-facebook"
          aria-label="Share on Facebook"
        >
          <span aria-hidden="true">𝗳</span> {t('campaign.facebook')}
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="share-btn share-twitter"
          aria-label="Share on X (Twitter)"
        >
          <span aria-hidden="true">𝕏</span> {t('campaign.twitter')}
        </a>
        <a
          href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="share-btn share-whatsapp"
          aria-label="Share on WhatsApp"
        >
          <span aria-hidden="true">💬</span> {t('campaign.whatsapp')}
        </a>
        <button
          className={`share-btn share-copy ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          aria-label="Copy link"
        >
          {copied ? `✅ ${t('campaign.copied')}` : `🔗 ${t('campaign.copyLink')}`}
        </button>
      </div>
    </div>
  );
}

export default function CampaignDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const siteName = useSiteName();

  useEffect(() => {
    if (id) {
      api.getCampaign(id)
        .then(data => {
          setCampaign(data);
          setLoading(false);
        })
        .catch(() => {
          setError(t('campaign.loadError'));
          setLoading(false);
        });
    }
  }, [id]);

  return (
    <div data-testid="campaign-details">
      {loading && (
        <div className="container">
          <p className="loading">{t('common.loading')}</p>
        </div>
      )}
      {!loading && (error || !campaign) && (
        <div className="container">
          <p className="error">{error || t('campaign.notFound')}</p>
        </div>
      )}
      {!loading && campaign && (
        <div className="container">
          <Helmet>
            <title>{campaign.title} | {siteName}</title>
            <meta name="description" content={campaign.shortDescription || `Support ${campaign.title} — make a difference today.`} />
            <meta property="og:title" content={campaign.title} />
            <meta property="og:description" content={campaign.shortDescription || ''} />
            {campaign.imageUrl && <meta property="og:image" content={campaign.imageUrl} />}
          </Helmet>
          <div className="campaign-detail">
            <div className="detail-header">
              <h1>{campaign.title}</h1>
              {campaign.active && <span className="badge-active">{t('campaign.activeCampaign')}</span>}
            </div>

            {campaign.imageUrl && (
              <div className="detail-image-container">
                <img
                  src={getDetailUrl(campaign.imageUrl)}
                  alt={campaign.title}
                  className="detail-image"
                  loading="eager"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="detail-content">
              <div className="main-content">
                <h2>{t('campaign.aboutCampaign')}</h2>
                <p className="full-description">{campaign.description}</p>
              </div>

              <div className="sidebar">
                <div className="donation-box">
                  <h3>{t('donation.title')}</h3>
                  <div className="goal-info">
                    <div className="goal-amount">
                      <span className="amount">
                        {campaign.targetAmount != null 
                          ? formatCurrency(campaign.targetAmount, campaign.currency || 'eur', { includeSymbol: false })
                          : 'N/A'}
                      </span>
                      <span className="currency">{formatCurrencyCode(campaign.currency || 'eur')}</span>
                    </div>
                    <p className="goal-label">{t('campaign.fundingGoal')}</p>
                  </div>
                  
                  {campaign.active ? (
                    <>
                      <Link data-testid="donate-cta" to={`/donate/${campaign.id}`} className="btn-donate-large">
                        <span className="heart-icon" aria-hidden="true">❤️</span>
                        {t('campaign.donate')}
                      </Link>
                      <p className="secure-note">{t('campaign.securePayment')}</p>
                    </>
                  ) : (
                    <div className="inactive-notice">
                      <p className="inactive-message">{t('campaign.notAcceptingNotice')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <ShareButtons
              title={campaign.title}
              url={window.location.href}
            />

            <div className="back-link">
              <Link to="/campaigns">{t('campaign.backToAll')}</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
