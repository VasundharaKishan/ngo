import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RiAdminLine, RiTeamLine, RiSettings3Line, RiLogoutBoxLine } from 'react-icons/ri';
import { formatCurrency, calculateProgress } from '../utils/currency';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import './AdminDashboard.css';

interface Campaign {
  id: string;
  title: string;
  shortDescription: string;
  targetAmount: number;
  currentAmount: number;
  imageUrl: string;
  active: boolean;
  featured: boolean;
  urgent: boolean;
  category: {
    name: string;
    icon: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  active: boolean;
  displayOrder: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'categories'>('campaigns');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const loadData = async () => {
    try {
      const [campaignsRes, categoriesRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/admin/campaigns`),
        authFetch(`${API_BASE_URL}/admin/categories`)
      ]);
      
      const campaignsData = await campaignsRes.json();
      const categoriesData = await categoriesRes.json();
      
      setCampaigns(campaignsData);
      setCategories(categoriesData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      await authFetch(`${API_BASE_URL}/admin/campaigns/${id}`, {
        method: 'DELETE'
      });
      loadData();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await authFetch(`${API_BASE_URL}/admin/categories/${id}`, {
        method: 'DELETE'
      });
      loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const toggleCampaignStatus = async (campaign: Campaign) => {
    try {
      await authFetch(`${API_BASE_URL}/admin/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...campaign,
          categoryId: campaign.category ? (campaign as any).category.id : null,
          active: !campaign.active
        })
      });
      loadData();
    } catch (error) {
      console.error('Error updating campaign:', error);
    }
  };

  if (loading) {
    return <div className="admin-dashboard"><p>Loading...</p></div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1><RiAdminLine style={{verticalAlign: 'middle', marginRight: '0.5rem'}} /> Admin Dashboard</h1>
        <div className="header-actions">
          <Link to="/admin/users" className="btn-users"><RiTeamLine style={{verticalAlign: 'middle', marginRight: '0.35rem'}} /> Users</Link>
          <Link to="/admin/settings" className="btn-settings"><RiSettings3Line style={{verticalAlign: 'middle', marginRight: '0.35rem'}} /> Settings</Link>
          <button onClick={handleLogout} className="btn-logout"><RiLogoutBoxLine style={{verticalAlign: 'middle', marginRight: '0.35rem'}} /> Logout</button>
          <Link to="/" className="back-link">← Back to Website</Link>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'campaigns' ? 'active' : ''}`}
          onClick={() => setActiveTab('campaigns')}
        >
          Campaigns ({campaigns.length})
        </button>
        <button 
          className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categories ({categories.length})
        </button>
      </div>

      {activeTab === 'campaigns' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>Campaigns</h2>
            <Link to="/admin/campaigns/new" className="btn-primary">+ New Campaign</Link>
          </div>
          
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Goal</th>
                  <th>Raised</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No campaigns found. Create your first campaign to get started.
                    </td>
                  </tr>
                ) : (
                campaigns.map(campaign => {
                  // currentAmount is derived from successful donations via backend
                  const progress = calculateProgress(campaign.currentAmount || 0, campaign.targetAmount || 1);
                  
                  return (
                    <tr key={campaign.id}>
                      <td>
                        {campaign.imageUrl ? (
                          <img src={campaign.imageUrl} alt={campaign.title || 'Campaign'} className="table-image" />
                        ) : (
                          <div className="table-image-placeholder">No image</div>
                        )}
                      </td>
                      <td>{campaign.title || 'Untitled Campaign'}</td>
                      <td>
                        {campaign.category ? (
                          <span>{campaign.category.icon} {campaign.category.name}</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>No category</span>
                        )}
                      </td>
                      <td>{formatCurrency(campaign.targetAmount || 0, 'usd', { decimals: 0 })}</td>
                      <td>{formatCurrency(campaign.currentAmount || 0, 'usd', { decimals: 0 })}</td>
                      <td>
                        <span style={{ fontWeight: 'bold', color: progress >= 100 ? '#10b981' : '#667eea' }}>
                          {progress.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <button 
                          className={`status-badge ${campaign.active ? 'active' : 'inactive'}`}
                          onClick={() => toggleCampaignStatus(campaign)}
                        >
                          {campaign.active ? '✓ Active' : '✗ Inactive'}
                        </button>
                      </td>
                      <td>
                        {campaign.featured && <span className="badge-featured">⭐ Featured</span>}
                        {campaign.urgent && <span className="badge-urgent">🚨 Urgent</span>}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link to={`/admin/campaigns/${campaign.id}`} className="btn-edit">Edit</Link>
                          <button onClick={() => deleteCampaign(campaign.id)} className="btn-delete">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>Categories</h2>
            <Link to="/admin/categories/new" className="btn-primary">+ New Category</Link>
          </div>
          
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Icon</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Color</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <tr key={category.id}>
                    <td className="category-icon-cell">{category.icon}</td>
                    <td>{category.name}</td>
                    <td><code>{category.slug}</code></td>
                    <td>
                      <div className="color-preview" style={{ backgroundColor: category.color }}>
                        {category.color}
                      </div>
                    </td>
                    <td>{category.displayOrder}</td>
                    <td>
                      <span className={`status-badge ${category.active ? 'active' : 'inactive'}`}>
                        {category.active ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`/admin/categories/${category.id}`} className="btn-edit">Edit</Link>
                        <button onClick={() => deleteCategory(category.id)} className="btn-delete">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
