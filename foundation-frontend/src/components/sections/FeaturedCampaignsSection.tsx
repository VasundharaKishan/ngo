import { useEffect, useState } from 'react';
import { api, type Campaign } from '../../api';
import CampaignCard from '../CampaignCard';
import '../../pages/Home.css';
import '../../pages/CampaignList.css';

interface FeaturedCampaignsSectionProps {
  config: {
    limit?: number;
    showProgress?: boolean;
    title?: string;
  };
}

export default function FeaturedCampaignsSection({ config }: FeaturedCampaignsSectionProps) {
  const {
    limit = 3,
    title = 'Featured Campaigns'
  } = config;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const data = await api.getCampaigns({ featured: true, limit });
        setCampaigns(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading featured campaigns:', error);
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [limit]);

  if (loading) {
    return (
      <section className="campaigns featured">
        <div className="container">
          <h2 className="section-title">{title}</h2>
          <p>Loading campaigns...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="campaigns featured">
      <div className="container">
        <h2 className="section-title">{title}</h2>
        {campaigns.length === 0 ? (
          <p className="no-campaigns">No featured campaigns at the moment.</p>
        ) : (
          <div className="campaign-grid">
            {campaigns.map(campaign => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
