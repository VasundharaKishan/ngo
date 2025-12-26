import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api';
import { Link } from 'react-router-dom';
import { authFetch } from '../utils/auth';
import { formatCurrency, calculateProgress } from '../utils/currency';

interface Campaign {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount?: number;
  active: boolean;
  category?: {
    id: string;
    name: string;
    icon: string;
  };
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/campaigns`);
      const data = await res.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      await authFetch(`${API_BASE_URL}/admin/campaigns/${id}`, {
        method: 'DELETE'
      });
      loadCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  return (
    <>
      <div className="content-header">
        <h2>📢 Campaigns</h2>
        <p>Manage donation campaigns</p>
      </div>

      <div className="content-body">
        <Link to="/admin/campaigns/new" className="btn-add-new">
          + Add New Campaign
        </Link>
        
        {loading ? (
          <p>Loading campaigns...</p>
        ) : campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <p>No campaigns found. Create your first campaign!</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Target</th>
                <th>Current</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(campaign => {
                const currentCents = campaign.currentAmount || 0;
                const targetCents = campaign.targetAmount || 0;
                const progress = calculateProgress(currentCents, targetCents);
                
                return (
                  <tr key={campaign.id}>
                    <td><strong>{campaign.title}</strong></td>
                    <td>
                      {campaign.category ? (
                        <span>{campaign.category.icon} {campaign.category.name}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>No category</span>
                      )}
                    </td>
                    <td>{formatCurrency(targetCents, 'usd', { decimals: 0 })}</td>
                    <td>{formatCurrency(currentCents, 'usd', { decimals: 0 })}</td>
                    <td>
                      <span style={{ fontWeight: 'bold', color: progress >= 100 ? '#10b981' : '#667eea' }}>
                        {progress.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${campaign.active ? 'active' : 'inactive'}`}>
                        {campaign.active ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/admin/campaigns/${campaign.id}`} className="btn-edit">Edit</Link>
                        <button onClick={() => deleteCampaign(campaign.id)} className="btn-delete">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
