import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Campaign } from '../api';
import './Home.css';

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCampaigns()
      .then(data => {
        setCampaigns(data.slice(0, 3)); // Show only 3 featured campaigns
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching campaigns:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <h1>Building Schools, Changing Lives</h1>
          <p className="hero-text">
            Help us construct and run schools for underprivileged children.
            Every donation makes a real difference in a child's future.
          </p>
          <Link to="/campaigns" className="btn-hero">
            View All Campaigns →
          </Link>
        </div>
      </section>

      <section className="featured">
        <div className="container">
          <h2>Featured Campaigns</h2>
          
          {loading ? (
            <p>Loading campaigns...</p>
          ) : (
            <div className="campaign-grid">
              {campaigns.map(campaign => (
                <div key={campaign.id} className="campaign-card">
                  <h3>{campaign.title}</h3>
                  <p>{campaign.shortDescription}</p>
                  <div className="campaign-meta">
                    <span className="target">
                      Goal: ${(campaign.targetAmount / 100).toLocaleString()} {campaign.currency.toUpperCase()}
                    </span>
                  </div>
                  <Link to={`/campaigns/${campaign.id}`} className="btn-donate">
                    Donate Now
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
