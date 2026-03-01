import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RiMegaphoneLine, RiStarLine } from 'react-icons/ri';
import { api, type CampaignPopupDto, type DonatePopupResponse } from '../api';
import { formatCurrency } from '../utils/currency';
import { useSiteName } from '../contexts/ConfigContext';
import logger from '../utils/logger';
import './FeaturedCampaignModal.css';

interface FeaturedCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeaturedCampaignModal({ isOpen, onClose }: FeaturedCampaignModalProps) {
  const { t } = useTranslation();
  const [campaign, setCampaign] = useState<CampaignPopupDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const siteName = useSiteName();

  // Focus trap: move focus into modal when opened, restore when closed
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Defer so the modal is rendered before we focus
      setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }, 0);
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Trap Tab / Shift+Tab inside the modal
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.hasAttribute('disabled'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      fetchDonatePopup();
    }
  }, [isOpen]);

  const fetchDonatePopup = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: DonatePopupResponse = await api.getDonatePopup();
      setCampaign(data.campaign);

      if (!data.campaign) {
        setError('noCampaigns');
      }

      setLoading(false);
    } catch (error) {
      logger.error('FeaturedCampaignModal', 'Error fetching donate popup:', error);
      setError('loadError');
      setLoading(false);
    }
  };

  const handleDonate = () => {
    if (campaign) {
      navigate(`/donate/${campaign.id}`);
      onClose();
    }
  };

  const handleLearnMore = () => {
    if (campaign) {
      navigate(`/campaigns/${campaign.id}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div
        className="featured-modal"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        onKeyDown={handleKeyDown}
      >
        <button className="modal-close" onClick={onClose} aria-label={t('common.close')}>×</button>

        {loading ? (
          <div className="modal-loading">{t('popup.loading')}</div>
        ) : error ? (
          <div className="modal-error">
            <div className="modal-error-icon"><RiMegaphoneLine size={48} style={{color: '#2a3da8'}} /></div>
            <p className="modal-error-text">{t(`popup.${error}`)}</p>
            <button className="modal-btn-primary" onClick={() => { navigate('/campaigns'); onClose(); }}>
              {t('popup.browseAll')}
            </button>
          </div>
        ) : campaign ? (
          <>
            <div className="modal-image-section">
              <img
                src={campaign.imageUrl || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&auto=format&fit=crop&q=80'}
                alt={campaign.title}
                className="modal-image"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/800x600/667eea/ffffff?text=Campaign+Image';
                }}
              />
              <div className="modal-badge">{campaign.badgeText}</div>
            </div>

            <div className="modal-content-section">
              <div className="modal-header">
                  <div className="modal-logos">
                    <div className="modal-logo">🤝</div>
                    <span className="modal-support-text">{t('popup.inSupportOf')}</span>
                    <div className="modal-org-logo">{siteName}</div>
                  </div>
                </div>

              <h2 className="modal-title" id="modal-title">{campaign.title}</h2>

              <div className="modal-active-notice">
                <div className="modal-notice-icon"><RiStarLine size={24} style={{color: '#f59e0b'}} /></div>
                <p className="modal-notice-text">
                  <strong>{t('popup.activeNotice')}</strong><br/>
                  {t('popup.activeNoticeDesc')}
                </p>
              </div>

              <p className="modal-description">{campaign.shortDescription}</p>

              <div className="modal-progress">
                <div className="modal-progress-bar">
                  <div
                    className="modal-progress-fill"
                    style={{ width: `${campaign.progressPercent}%` }}
                  />
                </div>
                <div className="modal-progress-stats">
                  <div className="modal-stat">
                    <span className="modal-stat-value">{formatCurrency(campaign.currentAmount, campaign.currency.toLowerCase() as any, { decimals: 0 })}</span>
                    <span className="modal-stat-label">{t('campaign.raised')}</span>
                  </div>
                  <div className="modal-stat">
                    <span className="modal-stat-value">{formatCurrency(campaign.targetAmount, campaign.currency.toLowerCase() as any, { decimals: 0 })}</span>
                    <span className="modal-stat-label">{t('campaign.goal')}</span>
                  </div>
                  <div className="modal-stat">
                    <span className="modal-stat-value">{campaign.progressPercent}%</span>
                    <span className="modal-stat-label">{t('campaign.funded')}</span>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="modal-btn-primary" onClick={handleDonate}>
                  <span className="heart-icon" aria-hidden="true">❤️</span>
                  {t('campaign.donate')}
                </button>
                <button className="modal-btn-secondary" onClick={handleLearnMore}>
                  {t('common.learnMore')}
                </button>
              </div>

              <div className="modal-campaigns-selector">
                <span className="modal-selector-label">{t('popup.exploreQuestion')}</span>
                <p className="modal-explore-text">
                  {t('popup.explorePre')} <button className="modal-link-btn" onClick={() => { navigate('/campaigns'); onClose(); }}>{t('popup.exploreLinkText')}</button> {t('popup.explorePost')}
                </p>
              </div>

              <div className="modal-footer-note">
                <span className="modal-secure-icon">🔒</span>
                <p>{t('popup.secureNote')}</p>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
