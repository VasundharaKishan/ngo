import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  RiDashboardLine, 
  RiMoneyDollarCircleLine, 
  RiTeamLine, 
  RiMegaphoneLine,
  RiFolderLine,
  RiHomeLine,
  RiFileTextLine,
  RiSettings3Line,
  RiStarLine,
  RiLogoutBoxLine,
  RiAdminLine,
  RiUserLine,
  RiArrowDownSLine
} from 'react-icons/ri';
import { API_BASE_URL } from '../api';
import { TIMING, STORAGE_KEYS } from '../config/constants';
import './AdminLayout.css';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState({ fullName: '', role: '', email: '', username: '' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

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
    const initializeSession = async () => {
      const user = localStorage.getItem('adminUser');
      if (!user) {
        navigate('/admin/login');
        // Don't set isAuthChecked - keep showing loading while redirecting
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
          // Don't set isAuthChecked - keep showing loading while redirecting
          return;
        }
        sessionStorage.setItem(SESSION_KEY, currentSessionId);
        updateActivity();
      }

      // Initialize CSRF token by making a GET request
      // This ensures the XSRF-TOKEN cookie is set before any PUT/POST/DELETE requests
      try {
        await fetch(`${API_BASE_URL}/auth/csrf`, {
          method: 'GET',
          credentials: 'include'
        });
      } catch (error) {
        console.warn('Failed to initialize CSRF token:', error);
      }
      
      // Only set auth checked if authentication passed
      setIsAuthChecked(true);
    };

    initializeSession();
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

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const closeProfileDropdown = () => {
    setIsProfileDropdownOpen(false);
  };

  // Close sidebar on Esc key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSidebarOpen) closeSidebar();
        if (isProfileDropdownOpen) closeProfileDropdown();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isSidebarOpen, isProfileDropdownOpen]);

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
      {!isAuthChecked ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '1.2rem',
          color: '#666'
        }}>
          Loading...
        </div>
      ) : (
        <>
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
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`} data-testid="admin-sidebar">
        <div className="sidebar-header">
          <h1><RiAdminLine className="header-icon" /> Admin Portal</h1>
          <div className="user-info">
            <div><strong>{currentUser.fullName || 'Administrator'}</strong></div>
            <div style={{fontSize: '0.75rem', opacity: 0.8}}>{currentUser.role || 'ADMIN'}</div>
          </div>
        </div>

        <nav data-testid="admin-nav">
          <ul className="sidebar-menu">
            <li className="sidebar-menu-item">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
                data-testid="nav-dashboard"
              >
                <RiDashboardLine className="menu-icon" />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li className="sidebar-menu-item">
              <NavLink
                to="/admin/donations"
                className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
                data-testid="nav-donations"
              >
                <RiMoneyDollarCircleLine className="menu-icon" />
                <span>Donations</span>
              </NavLink>
            </li>
            {isAdmin && (
              <li className="sidebar-menu-item">
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
                data-testid="nav-users"
              >
                <RiTeamLine className="menu-icon" />
                <span>Users</span>
              </NavLink>
            </li>
            )}
            <li className="sidebar-menu-item">
              <NavLink
                to="/admin/campaigns"
                className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
                data-testid="nav-campaigns"
              >
                <RiMegaphoneLine className="menu-icon" />
                <span>Campaigns</span>
              </NavLink>
            </li>
            <li className="sidebar-menu-item">
              <NavLink
                to="/admin/categories"
                className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
                data-testid="nav-categories"
              >
                <RiFolderLine className="menu-icon" />
                <span>Categories</span>
              </NavLink>
            </li>
            <li className="sidebar-menu-item">
              <NavLink
                to="/admin/homepage"
                className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
                data-testid="nav-homepage"
              >
                <RiHomeLine className="menu-icon" />
                <span>Homepage</span>
              </NavLink>
            </li>
            <li className="sidebar-menu-item">
              <NavLink
                to="/admin/cms"
                className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
                data-testid="nav-cms"
              >
                <RiFileTextLine className="menu-icon" />
                <span>CMS Content</span>
              </NavLink>
            </li>
            <li className="sidebar-menu-item">
              <NavLink
                to="/admin/settings"
                className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
                data-testid="nav-settings"
              >
                <RiSettings3Line className="menu-icon" />
                <span>Settings</span>
              </NavLink>
            </li>
            <li className="sidebar-menu-item">
              <NavLink
                to="/admin/donate-popup-settings"
                className={({ isActive }) => `sidebar-menu-button ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
                data-testid="nav-donate-popup"
              >
                <RiStarLine className="menu-icon" />
                <span>Donate Popup</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout-sidebar" data-testid="admin-logout">
            <RiLogoutBoxLine className="menu-icon" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-content">
        {/* Top Header Bar */}
        <div className="admin-top-header">
          <div className="header-spacer"></div>
          <div className="user-profile-dropdown">
            <button
              className="profile-trigger"
              onClick={toggleProfileDropdown}
              aria-expanded={isProfileDropdownOpen}
              aria-haspopup="true"
              aria-label="User profile menu"
            >
              <div className="profile-icon">
                <RiUserLine />
              </div>
              <div className="profile-info">
                <span className="profile-name">{currentUser.fullName || 'Administrator'}</span>
                <span className="profile-role">{currentUser.role || 'ADMIN'}</span>
              </div>
              <RiArrowDownSLine className={`dropdown-arrow ${isProfileDropdownOpen ? 'open' : ''}`} />
            </button>

            {isProfileDropdownOpen && (
              <>
                <div 
                  className="dropdown-overlay"
                  onClick={closeProfileDropdown}
                  aria-hidden="true"
                />
                <div className="profile-dropdown-menu" role="menu">
                  <div className="dropdown-header">
                    <div className="dropdown-user-icon">
                      <RiUserLine />
                    </div>
                    <div className="dropdown-user-info">
                      <strong>{currentUser.fullName || 'Administrator'}</strong>
                      <small>{currentUser.email || currentUser.username || 'admin@example.org'}</small>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item-group">
                    <div className="dropdown-info-item">
                      <span className="info-label">Role:</span>
                      <span className={`role-badge ${currentUser.role?.toLowerCase()}`}>
                        {currentUser.role || 'ADMIN'}
                      </span>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-item logout-item"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <RiLogoutBoxLine />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div className="admin-content-wrapper">
          <Outlet />
        </div>
      </main>
        </>
      )}
    </div>
  );
}
