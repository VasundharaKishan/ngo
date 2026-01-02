import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { TIMING, STORAGE_KEYS } from '../config/constants';
import './AdminLayout.css';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState({ fullName: '', role: '' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Session management
  const SESSION_KEY = STORAGE_KEYS.SESSION_ID;
  const LAST_ACTIVITY_KEY = STORAGE_KEYS.LAST_ACTIVITY;
  const SESSION_TIMEOUT = TIMING.SESSION_TIMEOUT_ADMIN;

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  };

  const updateActivity = () => {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  };

  const isSessionValid = () => {
    const sessionId = localStorage.getItem(SESSION_KEY);
    const tabSessionId = sessionStorage.getItem(SESSION_KEY);
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);

    if (!sessionId || !lastActivity) return false;
    if (sessionId !== tabSessionId) return false;

    const timeSinceActivity = Date.now() - parseInt(lastActivity);
    return timeSinceActivity < SESSION_TIMEOUT;
  };

  const performLogout = async () => {
    try {
      // Call logout endpoint to clear httpOnly cookie
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    
    // Clear client-side storage
    localStorage.removeItem('adminUser');
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    navigate('/admin/login');
  };

  // Load current user
  useEffect(() => {
    const getCurrentUser = () => {
      try {
        const userStr = localStorage.getItem('adminUser');
        return userStr ? JSON.parse(userStr) : {};
      } catch {
        return {};
      }
    };
    
    const user = getCurrentUser();
    setCurrentUser(user);
    setIsAdmin(user.role === 'ADMIN');
  }, []);

  // Initialize session on component mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    let currentSessionId = localStorage.getItem(SESSION_KEY);
    if (!currentSessionId) {
      currentSessionId = generateSessionId();
      localStorage.setItem(SESSION_KEY, currentSessionId);
      sessionStorage.setItem(SESSION_KEY, currentSessionId);
      updateActivity();
    } else {
      if (!isSessionValid()) {
        alert('Your session has expired or you are logged in elsewhere. Please login again.');
        performLogout();
        return;
      }
      sessionStorage.setItem(SESSION_KEY, currentSessionId);
      updateActivity();
    }
  }, []);

  // Activity tracking
  useEffect(() => {
    const handleActivity = () => {
      if (!isSessionValid()) {
        alert('Your session has expired. Please login again.');
        performLogout();
        return;
      }
      updateActivity();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    const intervalId = setInterval(() => {
      if (!isSessionValid()) {
        alert('Your session has expired or you are logged in elsewhere.');
        performLogout();
      }
    }, 60000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(intervalId);
    };
  }, []);

  const handleLogout = () => {
    performLogout();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Close sidebar on Esc key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        closeSidebar();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isSidebarOpen]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  return (
    <div className="admin-dashboard-new">
      {/* Hamburger Button - Mobile Only */}
      <button
        className="hamburger-button"
        onClick={toggleSidebar}
        aria-label="Toggle navigation menu"
        aria-expanded={isSidebarOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay - Mobile Only */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>🛠️ Admin Portal</h1>
          <div className="user-info">
            <div><strong>{currentUser.fullName || 'Administrator'}</strong></div>
            <div style={{fontSize: '0.75rem', opacity: 0.8}}>{currentUser.role || 'ADMIN'}</div>
          </div>
        </div>

        <nav>
          <ul className="sidebar-menu">
            <li className="sidebar-menu-item">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="menu-icon">📊</span>
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li className="sidebar-menu-item">
              <NavLink
                to="/admin/donations"
                className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="menu-icon">💰</span>
                <span>Donations</span>
              </NavLink>
            </li>
            {isAdmin && (
              <li className="sidebar-menu-item">
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                  onClick={closeSidebar}
                >
                  <span className="menu-icon">👥</span>
                  <span>Users</span>
                </NavLink>
              </li>
            )}
            <li className="sidebar-menu-item">
              <NavLink
                to="/admin/campaigns"
                className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="menu-icon">📢</span>
                <span>Campaigns</span>
              </NavLink>
            </li>
            <li className="sidebar-menu-item">
              <NavLink
                to="/admin/categories"
                className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="menu-icon">📂</span>
                <span>Categories</span>
              </NavLink>
            </li>
            <li className="sidebar-menu-item">
              <NavLink
                to="/admin/hero-slides"
                className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="menu-icon">🎠</span>
                <span>Hero Slides</span>
              </NavLink>
            </li>
            <li className="sidebar-menu-item">
              <NavLink
                to="/admin/home-sections"
                className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="menu-icon">🏠</span>
                <span>Home Sections</span>
              </NavLink>
            </li>
            <li className="sidebar-menu-item">
              <NavLink
                to="/admin/cms"
                className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="menu-icon">📝</span>
                <span>CMS Content</span>
              </NavLink>
            </li>
            <li className="sidebar-menu-item">
              <NavLink
                to="/admin/settings"
                className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="menu-icon">⚙️</span>
                <span>Settings</span>
              </NavLink>
            </li>
            <li className="sidebar-menu-item">
              <NavLink
                to="/admin/contact-settings"
                className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="menu-icon">📞</span>
                <span>Contact Info</span>
              </NavLink>
            </li>
            <li className="sidebar-menu-item">
              <NavLink
                to="/admin/footer-settings"
                className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="menu-icon">🦶</span>
                <span>Footer Settings</span>
              </NavLink>
            </li>
            <li className="sidebar-menu-item">
              <NavLink
                to="/admin/donate-popup-settings"
                className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="menu-icon">🌟</span>
                <span>Donate Popup</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout-sidebar">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
}
