import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Campaign } from '../api';
import './FeaturedCampaignModal.css';

interface FeaturedCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeaturedCampaignModal({ isOpen, onClose }: FeaturedCampaignModalProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchCampaigns();
    }
  }, [isOpen]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await api.getCampaigns({ featured: true });
      setCampaigns(data);
      // Set first campaign as featured/selected by default
      if (data.length > 0) {
        setSelectedCampaign(data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setLoading(false);
    }
  };

  const handleDonate = () => {
    if (selectedCampaign) {
      navigate(`/donate/${selectedCampaign.id}`);
      onClose();
    }
  };

  const handleLearnMore = () => {
    if (selectedCampaign) {
      navigate(`/campaigns/${selectedCampaign.id}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="featured-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        {loading ? (
          <div className="modal-loading">Loading campaigns...</div>
        ) : selectedCampaign ? (
          <>
            <div className="modal-image-section">
              <img 
                src={selectedCampaign.imageUrl || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&auto=format&fit=crop&q=80'} 
                alt={selectedCampaign.title}
                className="modal-image"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/800x600/667eea/ffffff?text=Campaign+Image';
                }}
              />
              <div className="modal-badge">Featured Campaign</div>
            </div>

            <div className="modal-content-section">
              <div className="modal-header">
                <div className="modal-logos">
                  <div className="modal-logo">🤝</div>
                  <span className="modal-support-text">in support of</span>
                  <div className="modal-org-logo">Hope Foundation</div>
                </div>
              </div>

              <h2 className="modal-title">{selectedCampaign.title}</h2>
              
              <div className="modal-active-notice">
                <div className="modal-notice-icon">🌟</div>
                <p className="modal-notice-text">
                  <strong>We are actively working on this campaign!</strong><br/>
                  Your contribution will directly support our ongoing efforts and make an immediate impact in the lives of those we serve.
                </p>
              </div>
              
              <p className="modal-description">{selectedCampaign.description}</p>

              <div className="modal-progress">
                <div className="modal-progress-bar">
                  <div 
                    className="modal-progress-fill" 
                    style={{ width: `${Math.min(((selectedCampaign.currentAmount || 0) / selectedCampaign.targetAmount) * 100, 100)}%` }}
                  />
                </div>
                <div className="modal-progress-stats">
                  <div className="modal-stat">
                    <span className="modal-stat-value">€{(selectedCampaign.currentAmount || 0).toLocaleString()}</span>
                    <span className="modal-stat-label">raised</span>
                  </div>
                  <div className="modal-stat">
                    <span className="modal-stat-value">€{selectedCampaign.targetAmount.toLocaleString()}</span>
                    <span className="modal-stat-label">goal</span>
                  </div>
                  <div className="modal-stat">
                    <span className="modal-stat-value">{Math.round(((selectedCampaign.currentAmount || 0) / selectedCampaign.targetAmount) * 100)}%</span>
                    <span className="modal-stat-label">funded</span>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="modal-btn-primary" onClick={handleDonate}>
                  Donate now
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
                <select 
                  className="modal-campaign-select"
                  value={selectedCampaign.id}
                  onChange={(e) => {
                    const campaign = campaigns.find(c => c.id === e.target.value);
                    if (campaign) setSelectedCampaign(campaign);
                  }}
                >
                  {campaigns.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-footer-note">
                <span className="modal-secure-icon">🔒</span>
                <p>Secure donation powered by Stripe</p>
              </div>
            </div>
          </>
        ) : (
          <div className="modal-no-campaigns">
            <p>No campaigns available at the moment.</p>
            <button className="modal-btn-secondary" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
