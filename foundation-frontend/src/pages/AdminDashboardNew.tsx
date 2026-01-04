import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  RiAdminLine,
  RiDashboardLine,
  RiMoneyDollarCircleLine,
  RiTeamLine,
  RiSettings3Line,
  RiMegaphoneLine,
  RiFolderLine,
  RiLogoutBoxLine
} from 'react-icons/ri';
import { formatCurrency, calculateProgress } from '../utils/currency';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';
import { TIMING } from '../config/constants';
import './AdminDashboardNew.css';

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

interface Donation {
  id: string;
  donorName: string;
  donorEmail?: string;
  amount: number;
  currency: string;
  status: string;
  campaignId: string;
  campaignTitle: string;
  createdAt: string;
}

type MenuItem = 'dashboard' | 'donations' | 'users' | 'settings' | 'campaigns' | 'categories';

export default function AdminDashboardNew() {
  const navigate = useNavigate();
  const showToast = useToast();
  const currentUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const isAdmin = currentUser.role === 'ADMIN';
  
  // Set default menu based on role
  const [activeMenu, setActiveMenu] = useState<MenuItem>(isAdmin ? 'dashboard' : 'campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Session management
  const SESSION_TIMEOUT = TIMING.SESSION_TIMEOUT_DASHBOARD;
  const SESSION_KEY = 'admin_session_id';
  const LAST_ACTIVITY_KEY = 'admin_last_activity';

  // Generate unique session ID on login
  const generateSessionId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Check session validity
  const isSessionValid = () => {
    const currentSessionId = localStorage.getItem(SESSION_KEY);
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    const storedSessionId = sessionStorage.getItem(SESSION_KEY);
    
    // Check if session IDs match (single session enforcement)
    if (!currentSessionId || !storedSessionId || currentSessionId !== storedSessionId) {
      return false;
    }
    
    // Check timeout
    if (lastActivity) {
      const timeSinceActivity = Date.now() - parseInt(lastActivity);
      if (timeSinceActivity > SESSION_TIMEOUT) {
        return false;
      }
    }
    
    return true;
  };

  // Update last activity timestamp
  const updateActivity = () => {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  };

  // Logout and clear session
  const performLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    navigate('/admin/login');
  };

  // Initialize session on component mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    // Create session if not exists
    let currentSessionId = localStorage.getItem(SESSION_KEY);
    if (!currentSessionId) {
      currentSessionId = generateSessionId();
      localStorage.setItem(SESSION_KEY, currentSessionId);
      sessionStorage.setItem(SESSION_KEY, currentSessionId);
      updateActivity();
    } else {
      // Check if this is a valid session
      if (!isSessionValid()) {
        showToast('Your session has expired or you are logged in elsewhere. Please login again.', 'error');
        performLogout();
        return;
      }
      // Store session ID in sessionStorage for this tab
      sessionStorage.setItem(SESSION_KEY, currentSessionId);
      updateActivity();
    }
  }, []);

  // Activity tracking
  useEffect(() => {
    const handleActivity = () => {
      if (!isSessionValid()) {
        showToast('Your session has expired. Please login again.', 'error');
        performLogout();
        return;
      }
      updateActivity();
    };

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Check session validity every minute
    const intervalId = setInterval(() => {
      if (!isSessionValid()) {
        showToast('Your session has expired or you are logged in elsewhere.', 'error');
        performLogout();
      }
    }, 60000); // Check every minute

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    if (activeMenu === 'dashboard') {
      loadDonations();
      loadCampaigns();
    } else if (activeMenu === 'campaigns') {
      loadCampaigns();
    } else if (activeMenu === 'categories') {
      loadCategories();
    } else if (activeMenu === 'donations') {
      loadDonations();
    }
  }, [navigate, activeMenu]);

  const loadDonations = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/donations`);
      const data = await res.json();
      setDonations(data);
    } catch (error) {
      console.error('Error loading donations:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    performLogout();
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

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await authFetch(`${API_BASE_URL}/admin/categories/${id}`, {
        method: 'DELETE'
      });
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        // Calculate statistics from donations table
        const successfulDonations = donations.filter(d => d.status === 'SUCCESS').length;
        const pendingDonations = donations.filter(d => d.status === 'PENDING').length;
        
        // Group SUCCESSFUL donations by campaign for ranking
        const successfulDonationsByCampaign = donations
          .filter(d => d.status === 'SUCCESS')
          .reduce((acc, donation) => {
            const campaignId = donation.campaignId;
            if (!acc[campaignId]) {
              acc[campaignId] = {
                campaignTitle: donation.campaignTitle,
                totalAmount: 0,
                count: 0,
                donations: []
              };
            }
            acc[campaignId].totalAmount += donation.amount;
            acc[campaignId].count += 1;
            acc[campaignId].donations.push(donation);
            return acc;
          }, {} as Record<string, { campaignTitle: string; totalAmount: number; count: number; donations: typeof donations }>);

        // Get top 5 campaigns by SUCCESSFUL donation amount
        const topCampaigns = Object.entries(successfulDonationsByCampaign)
          .sort(([, a], [, b]) => b.totalAmount - a.totalAmount)
          .slice(0, 5);

        return (
          <div className="dashboard-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading dashboard...</div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="dashboard-cards">
                  <div className="dashboard-card">
                    <div className="card-icon"><RiMoneyDollarCircleLine size={40} /></div>
                    <div className="card-content">
                      <h3>Total Donations</h3>
                      <p className="card-value">{donations.length}</p>
                    </div>
                  </div>
                  <div className="dashboard-card">
                    <div className="card-icon">✅</div>
                    <div className="card-content">
                      <h3>Successful</h3>
                      <p className="card-value">{successfulDonations}</p>
                    </div>
                  </div>
                  <div className="dashboard-card">
                    <div className="card-icon">⏳</div>
                    <div className="card-content">
                      <h3>Pending</h3>
                      <p className="card-value">{pendingDonations}</p>
                    </div>
                  </div>
                  <div className="dashboard-card">
                    <div className="card-icon"><RiMegaphoneLine size={40} /></div>
                    <div className="card-content">
                      <h3>Active Campaigns</h3>
                      <p className="card-value">{campaigns.filter(c => c.active).length}</p>
                    </div>
                  </div>
                </div>

                {/* Top Campaigns Chart */}
                <div className="dashboard-section">
                  <h2>🏆 Top 5 Campaigns by Donations</h2>
                  <div className="campaigns-chart">
                    {topCampaigns.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                        No donation data available yet
                      </p>
                    ) : (
                      topCampaigns.map(([campaignId, data], index) => {
                        const campaign = campaigns.find(c => c.id === campaignId);
                        const percentage = campaign && campaign.targetAmount > 0
                          ? Math.min((data.totalAmount / campaign.targetAmount) * 100, 100)
                          : 0;
                      
                      return (
                        <div key={campaignId} className="campaign-bar-item">
                          <div className="campaign-bar-header">
                            <span className="campaign-rank">#{index + 1}</span>
                            <span className="campaign-name">{data.campaignTitle}</span>
                            <span className="campaign-stats">
                              <strong>{formatCurrency(data.totalAmount, 'usd', { decimals: 0 })}</strong>
                              <span className="donation-count">({data.count} donations)</span>
                            </span>
                          </div>
                          <div className="progress-bar-container">
                            <div 
                              className="progress-bar-fill" 
                              style={{ 
                                width: `${percentage}%`,
                                background: `linear-gradient(90deg, 
                                  ${index === 0 ? '#10b981' : index === 1 ? '#3b82f6' : '#8b5cf6'} 0%, 
                                  ${index === 0 ? '#059669' : index === 1 ? '#2563eb' : '#7c3aed'} 100%)`
                              }}
                            >
                              <span className="progress-label">{percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                          {campaign && (
                            <div className="campaign-target">
                              Target: {formatCurrency(campaign.targetAmount, 'usd', { decimals: 0 })}
                            </div>
                          )}
                        </div>
                      );
                    })
                    )}
                  </div>
                </div>

                {/* Recent Donations */}
                <div className="dashboard-section">
                  <h2>📋 Recent Donations</h2>
                  {donations.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                      No donations yet
                    </p>
                  ) : (
                  <div className="recent-donations-list">
                    {donations.slice(0, 10).map((donation) => (
                      <div key={donation.id} className="recent-donation-item">
                        <div className="donation-avatar">
                          {(donation.donorName || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div className="donation-details">
                          <strong>{donation.donorName || 'Anonymous'}</strong>
                          <span className="donation-campaign">{donation.campaignTitle || 'Unknown Campaign'}</span>
                        </div>
                        <div className="donation-amount-badge">
                          {formatCurrency(donation.amount || 0, donation.currency || 'eur')}
                        </div>
                        <span className={`status-badge ${(donation.status || 'pending').toLowerCase()}`}>
                          {donation.status || 'PENDING'}
                        </span>
                      </div>
                    ))}
                  </div>
                  )}
                </div>

                {/* Campaign Performance Grid */}
                <div className="dashboard-section">
                  <h2><RiDashboardLine style={{verticalAlign: 'middle', marginRight: '0.5rem'}} /> All Campaigns Performance</h2>
                  {campaigns.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                      No campaigns created yet
                    </p>
                  ) : (
                  <div className="campaigns-grid">
                    {campaigns.map((campaign) => {
                      // Calculate metrics from SUCCESSFUL donations only
                      const successfulCampaignDonations = donations.filter(
                        d => d.campaignId === campaign.id && d.status === 'SUCCESS'
                      );
                      const totalRaised = successfulCampaignDonations.reduce((sum, d) => sum + d.amount, 0);
                      const progress = calculateProgress(totalRaised, campaign.targetAmount);
                      
                      return (
                        <div key={campaign.id} className="campaign-performance-card">
                          <div className="campaign-card-header">
                            <h3>{campaign.title}</h3>
                            {campaign.featured && <span className="badge-featured">⭐ Featured</span>}
                            {campaign.urgent && <span className="badge-urgent">🔥 Urgent</span>}
                          </div>
                          <div className="campaign-card-stats">
                            <div className="stat-item">
                              <span className="stat-label">Raised</span>
                              <span className="stat-value">{formatCurrency(totalRaised, 'usd', { decimals: 0 })}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Goal</span>
                              <span className="stat-value">{formatCurrency(campaign.targetAmount, 'usd', { decimals: 0 })}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Donations</span>
                              <span className="stat-value">{successfulCampaignDonations.length}</span>
                            </div>
                          </div>
                          <div className="progress-bar-container">
                            <div 
                              className="progress-bar-fill" 
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            >
                              <span className="progress-label">{progress.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="campaign-card-footer">
                            <span className={`status-indicator ${campaign.active ? 'active' : 'inactive'}`}>
                              {campaign.active ? '🟢 Active' : '🔴 Inactive'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              </>
            )}
          </div>
        );

      case 'donations':
        return (
          <div className="donations-section">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading donations...</div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Donor Name</th>
                      <th>Email</th>
                      <th>Amount</th>
                      <th>Campaign</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                          No donations found
                        </td>
                      </tr>
                    ) : (
                      donations.map((donation) => (
                        <tr key={donation.id}>
                          <td>{donation.donorName || 'Anonymous'}</td>
                          <td>{donation.donorEmail || 'N/A'}</td>
                          <td style={{ fontWeight: 'bold' }}>
                            {formatCurrency(donation.amount || 0, donation.currency || 'eur')}
                          </td>
                          <td>{donation.campaignTitle || 'Unknown Campaign'}</td>
                          <td>
                            <span className={`status-badge ${(donation.status || 'pending').toLowerCase()}`}>
                              {donation.status || 'PENDING'}
                            </span>
                          </td>
                          <td>{donation.createdAt ? new Date(donation.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <div>
            <div className="info-box">
              <strong><RiSettings3Line style={{verticalAlign: 'middle', marginRight: '0.5rem'}} /> Site Configuration</strong>
              <p>Manage global site settings and preferences.</p>
            </div>
            <button onClick={() => navigate('/admin/settings')} className="btn-primary">
              Open Settings Page
            </button>
          </div>
        );

      case 'campaigns':
        return (
          <div>
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
                    // currentAmount is derived from successful donations via backend
                    const progress = calculateProgress(campaign.currentAmount || 0, campaign.targetAmount);
                    
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
                        <td>{formatCurrency(campaign.targetAmount, 'usd', { decimals: 0 })}</td>
                        <td>{formatCurrency(campaign.currentAmount || 0, 'usd', { decimals: 0 })}</td>
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
        );

      case 'categories':
        return (
          <div>
            <button onClick={() => showToast('Category creation coming soon', 'info')} className="btn-add-new">
              + Add New Category
            </button>
            
            {loading ? (
              <p>Loading categories...</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Icon</th>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Order</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(category => (
                    <tr key={category.id}>
                      <td><span style={{fontSize: '1.5rem'}}>{category.icon}</span></td>
                      <td><strong>{category.name}</strong></td>
                      <td>{category.slug}</td>
                      <td>{category.displayOrder}</td>
                      <td>{category.active ? '✓ Active' : '✗ Inactive'}</td>
                      <td>
                        <div className="table-actions">
                          <button onClick={() => showToast('Edit coming soon', 'info')} className="btn-edit">Edit</button>
                          <button onClick={() => deleteCategory(category.id)} className="btn-delete">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getContentTitle = () => {
    switch (activeMenu) {
      case 'dashboard': return { title: 'Dashboard', desc: 'Overview of donations and campaign performance' };
      case 'donations': return { title: 'Donations', desc: 'View all donations made through the platform' };
      case 'settings': return { title: 'Site Settings', desc: 'Configure global site preferences' };
      case 'campaigns': return { title: 'Campaigns', desc: 'Manage donation campaigns' };
      case 'categories': return { title: 'Categories', desc: 'Manage campaign categories' };
      default: return { title: '', desc: '' };
    }
  };

  const contentTitle = getContentTitle();

  return (
    <div className="admin-dashboard-new">
      {/* Left Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h1><RiAdminLine style={{verticalAlign: 'middle', marginRight: '0.5rem'}} /> Admin Portal</h1>
          <div className="user-info">
            <div><strong>{currentUser.fullName || 'Administrator'}</strong></div>
            <div style={{fontSize: '0.75rem', opacity: 0.8}}>{currentUser.role || 'ADMIN'}</div>
          </div>
        </div>

        <nav>
          <ul className="sidebar-menu">
            {isAdmin && (
              <>
                <li className="sidebar-menu-item">
                  <button
                    className={`sidebar-menu-button ${activeMenu === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveMenu('dashboard')}
                  >
                    <RiDashboardLine className="menu-icon" />
                    <span>Dashboard</span>
                  </button>
                </li>
                <li className="sidebar-menu-item">
                  <button
                    className={`sidebar-menu-button ${activeMenu === 'donations' ? 'active' : ''}`}
                    onClick={() => setActiveMenu('donations')}
                  >
                    <RiMoneyDollarCircleLine className="menu-icon" />
                    <span>Donations</span>
                  </button>
                </li>
                <li className="sidebar-menu-item">
                  <button
                    className="sidebar-menu-button"
                    onClick={() => navigate('/admin/users')}
                  >
                    <RiTeamLine className="menu-icon" />
                    <span>Users</span>
                  </button>
                </li>
              </>
            )}
            <li className="sidebar-menu-item">
              <button
                className={`sidebar-menu-button ${activeMenu === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveMenu('settings')}
              >
                <RiSettings3Line className="menu-icon" />
                <span>Settings</span>
              </button>
            </li>
            <li className="sidebar-menu-item">
              <button
                className={`sidebar-menu-button ${activeMenu === 'campaigns' ? 'active' : ''}`}
                onClick={() => setActiveMenu('campaigns')}
              >
                <RiMegaphoneLine className="menu-icon" />
                <span>Campaigns</span>
              </button>
            </li>
            <li className="sidebar-menu-item">
              <button
                className={`sidebar-menu-button ${activeMenu === 'categories' ? 'active' : ''}`}
                onClick={() => setActiveMenu('categories')}
              >
                <RiFolderLine className="menu-icon" />
                <span>Categories</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout-sidebar">
            <RiLogoutBoxLine className="menu-icon" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-content">
        <div className="content-header">
          <h2>{contentTitle.title}</h2>
          <p>{contentTitle.desc}</p>
        </div>

        <div className="content-body">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
