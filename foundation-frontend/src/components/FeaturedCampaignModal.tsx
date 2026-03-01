import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiMegaphoneLine, RiStarLine } from 'react-icons/ri';
import { api, type CampaignPopupDto, type DonatePopupResponse } from '../api';
import { formatCurrency } from '../utils/currency';
import { useSiteName } from '../contexts/ConfigContext';
import './FeaturedCampaignModal.css';

interface FeaturedCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeaturedCampaignModal({ isOpen, onClose }: FeaturedCampaignModalProps) {
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
        setError('No active campaigns available at the moment. Please check back soon!');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching donate popup:', error);
      setError('Failed to load campaign. Please try again later.');
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
        <button className="modal-close" onClick={onClose} aria-label="Close modal">×</button>
        
        {loading ? (
          <div className="modal-loading">Loading campaign...</div>
        ) : error ? (
          <div className="modal-error">
            <div className="modal-error-icon"><RiMegaphoneLine size={48} style={{color: '#2a3da8'}} /></div>
            <p className="modal-error-text">{error}</p>
            <button className="modal-btn-primary" onClick={() => { navigate('/campaigns'); onClose(); }}>
              Browse All Campaigns
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
                    <span className="modal-support-text">in support of</span>
                    <div className="modal-org-logo">{siteName}</div>
                  </div>
                </div>

              <h2 className="modal-title" id="modal-title">{campaign.title}</h2>
              
              <div className="modal-active-notice">
                <div className="modal-notice-icon"><RiStarLine size={24} style={{color: '#f59e0b'}} /></div>
                <p className="modal-notice-text">
                  <strong>We are actively working on this campaign!</strong><br/>
                  Your contribution will directly support our ongoing efforts and make an immediate impact in the lives of those we serve.
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
                    <span className="modal-stat-label">raised</span>
                  </div>
                  <div className="modal-stat">
                    <span className="modal-stat-value">{formatCurrency(campaign.targetAmount, campaign.currency.toLowerCase() as any, { decimals: 0 })}</span>
                    <span className="modal-stat-label">goal</span>
                  </div>
                  <div className="modal-stat">
                    <span className="modal-stat-value">{campaign.progressPercent}%</span>
                    <span className="modal-stat-label">funded</span>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="modal-btn-primary" onClick={handleDonate}>
                  <span className="heart-icon" aria-hidden="true">❤️</span>
                  Donate
                </button>
                <button className="modal-btn-secondary" onClick={handleLearnMore}>
                  Learn more
                </button>
              </div>

              <div className="modal-campaigns-selector">
                <span className="modal-selector-label">Want to explore other campaigns?</span>
                <p className="modal-explore-text">
                  Browse our <button className="modal-link-btn" onClick={() => { navigate('/campaigns'); onClose(); }}>campaign page</button> to discover all the ways you can make a difference.
                </p>
              </div>

              <div className="modal-footer-note">
                <span className="modal-secure-icon">🔒</span>
                <p>Secure donation powered by Stripe</p>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
