import { useEffect, useState } from 'react';
import { api, type Campaign } from '../api';
import CampaignCard from '../components/CampaignCard';
import { useCampaignsPerPage } from '../contexts/ConfigContext';
import { refreshScrollAnimations } from '../utils/scrollAnimations';
import SkeletonLoader from '../components/SkeletonLoader';
import './CampaignList.css';

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [displayedCampaigns, setDisplayedCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Get items per page from config context
  const itemsPerPage = useCampaignsPerPage();

  useEffect(() => {
    const loadData = async () => {
      try {
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
    
    // Refresh scroll animations for new content
    setTimeout(() => refreshScrollAnimations(), 100);
  }, [campaigns, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(campaigns.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ marginBottom: '2rem' }}>
          <SkeletonLoader variant="text" lines={1} width="300px" height="48px" />
          <div style={{ marginTop: '1rem' }}>
            <SkeletonLoader variant="text" lines={1} width="400px" height="20px" />
          </div>
        </div>
        <div className="campaign-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonLoader key={index} variant="card" />
          ))}
        </div>
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
            {displayedCampaigns.map((campaign) => (
              <div key={campaign.id} className="scroll-animate-stagger">
                <CampaignCard campaign={campaign} />
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
