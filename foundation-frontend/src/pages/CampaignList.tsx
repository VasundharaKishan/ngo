import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Campaign } from '../api';
import { formatCurrency, formatCurrencyCode } from '../utils/currency';
import './CampaignList.css';

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [displayedCampaigns, setDisplayedCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch site config for items per page
        const config = await api.getPublicConfig();
        setItemsPerPage(config.itemsPerPage || 12);
        
        // Fetch all campaigns
        const data = await api.getCampaigns();
        setCampaigns(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load campaigns. Please try again.');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Update displayed campaigns when page or campaigns change
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedCampaigns(campaigns.slice(startIndex, endIndex));
  }, [campaigns, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(campaigns.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="container">
        <p className="loading">Loading campaigns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>All Campaigns</h1>
      <p className="subtitle">Choose a campaign to support our mission</p>
      
      {campaigns.length === 0 ? (
        <p className="no-campaigns">No active campaigns at the moment. Check back soon!</p>
      ) : (
        <>
          <div className="campaign-grid">
            {displayedCampaigns.map(campaign => (
          <div key={campaign.id} className="campaign-card">
            {/* {campaign.imageUrl && (
              <div className="card-image-container">
                <img 
                  src={campaign.imageUrl} 
                  alt={campaign.title}
                  className="card-image"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )} */}
            <div className="card-header">
              <h2>{campaign.title}</h2>
              {campaign.active && <span className="badge-active">Active</span>}
            </div>
            <p className="description">{campaign.shortDescription}</p>
            <div className="campaign-meta">
              <div className="meta-item">
                <span className="label">Goal:</span>
                <span className="value">
                  {formatCurrency(campaign.targetAmount, campaign.currency)} {formatCurrencyCode(campaign.currency)}
                </span>
              </div>
            </div>
            <div className="card-actions">
              <Link to={`/campaigns/${campaign.id}`} className="btn-secondary">
                View Details
              </Link>
              {campaign.active && (
                <Link to={`/donate/${campaign.id}`} className="btn-primary">
                  Donate Now
                </Link>
              )}
              {!campaign.active && (
                <span className="inactive-label">Not Accepting Donations</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ← Previous
          </button>
          
          <div className="pagination-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`pagination-number ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      )}
    </>
      )}
    </div>
  );
}
