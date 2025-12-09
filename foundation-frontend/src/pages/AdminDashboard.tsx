import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
        fetch('http://localhost:8080/api/admin/campaigns'),
        fetch('http://localhost:8080/api/admin/categories')
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
      await fetch(`http://localhost:8080/api/admin/campaigns/${id}`, {
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
      await fetch(`http://localhost:8080/api/admin/categories/${id}`, {
        method: 'DELETE'
      });
      loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const toggleCampaignStatus = async (campaign: Campaign) => {
    try {
      await fetch(`http://localhost:8080/api/admin/campaigns/${campaign.id}`, {
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
        <h1>🛠️ Admin Dashboard</h1>
        <div className="header-actions">
          <Link to="/admin/users" className="btn-users">👥 Users</Link>
          <Link to="/admin/settings" className="btn-settings">⚙️ Settings</Link>
          <button onClick={handleLogout} className="btn-logout">🚪 Logout</button>
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
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(campaign => (
                  <tr key={campaign.id}>
                    <td>
                      {campaign.imageUrl && (
                        <img src={campaign.imageUrl} alt={campaign.title} className="table-image" />
                      )}
                    </td>
                    <td>{campaign.title}</td>
                    <td>
                      {campaign.category && (
                        <span>{campaign.category.icon} {campaign.category.name}</span>
                      )}
                    </td>
                    <td>${(campaign.targetAmount / 100).toLocaleString()}</td>
                    <td>${(campaign.currentAmount / 100).toLocaleString()}</td>
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
                ))}
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
