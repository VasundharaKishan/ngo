/**
 * Admin shell — matches mockup sidebar + breadcrumb bar.
 *
 * Sidebar (w-60):
 *   - YS logo block (trust-800 rounded square + two-line text)
 *   - Search bar (⌘K hint)
 *   - Grouped nav: Overview · Operate · Site · Access
 *   - User avatar footer
 *
 * Top bar:
 *   - Breadcrumb (Section / Page)
 *   - Status chip (placeholder) + Publish button
 *
 * All existing auth, session, and CSRF logic preserved.
 */
import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import logger from '../utils/logger';
import { API_BASE_URL } from '../api';
import { TIMING, STORAGE_KEYS } from '../config/constants';
import '../styles/AdminCommon.css';
import './AdminLayout.css';

/* ── Inline SVG icons (no react-icons dependency for shell) ── */
const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);
const CampaignIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M3 9h18" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);
const DonationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7H14a3.5 3.5 0 110 7H6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
const ContentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 4h16v4H4zM4 10h10v10H4zM16 10h4v10h-4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);
const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 1v2m0 18v2m-7.8-3.2l1.4-1.4m12.8-12.8l1.4-1.4M1 12h2m18 0h2M4.2 4.2l1.4 1.4m12.8 12.8l1.4 1.4" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);
const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="9" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
    <path d="M3 21c0-3.5 3-6 6-6s6 2.5 6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="17" cy="9" r="3" stroke="currentColor" strokeWidth="1.7" />
    <path d="M14.5 15.5c2.8.4 5 2.5 5.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M21 21l-4.3-4.3M18 10a8 8 0 11-16 0 8 8 0 0116 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const DotsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="5" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="19" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

/* ── Navigation structure matching mockup groups ── */
interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
  badge?: string;
  adminOnly?: boolean;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: <HomeIcon />, end: true },
    ],
  },
  {
    heading: 'Operate',
    items: [
      { to: '/admin/campaigns', label: 'Campaigns', icon: <CampaignIcon /> },
      { to: '/admin/donations', label: 'Donations', icon: <DonationIcon /> },
      { to: '/admin/categories', label: 'Categories', icon: <CampaignIcon /> },
    ],
  },
  {
    heading: 'Site',
    items: [
      { to: '/admin/homepage', label: 'Homepage sections', icon: <ContentIcon /> },
      { to: '/admin/hero-panel', label: 'Hero panel', icon: <ContentIcon /> },
      { to: '/admin/trust-badges', label: 'Trust badges', icon: <ContentIcon /> },
      { to: '/admin/stories', label: 'Impact stories', icon: <ContentIcon /> },
      { to: '/admin/faqs', label: 'FAQ', icon: <ContentIcon /> },
      { to: '/admin/announcement-bar', label: 'Announcement bar', icon: <ContentIcon /> },
      { to: '/admin/transparency-documents', label: 'Transparency docs', icon: <ContentIcon /> },
      { to: '/admin/donation-presets', label: 'Donation presets', icon: <DonationIcon /> },
      { to: '/admin/money-allocations', label: 'Money allocation', icon: <DonationIcon /> },
      { to: '/admin/contact-submissions', label: 'Contact inbox', icon: <ContentIcon /> },
      { to: '/admin/cms', label: 'CMS content', icon: <ContentIcon /> },
      { to: '/admin/donate-popup-settings', label: 'Donate popup', icon: <DonationIcon /> },
    ],
  },
  {
    heading: 'Settings',
    items: [
      { to: '/admin/settings', label: 'Settings', icon: <SettingsIcon /> },
    ],
  },
  {
    heading: 'Access',
    items: [
      { to: '/admin/users', label: 'Users', icon: <UsersIcon />, adminOnly: true },
    ],
  },
];

/* ── Breadcrumb helper ── */
function useBreadcrumb() {
  const location = useLocation();
  const path = location.pathname.replace('/admin', '').replace(/^\//, '');

  // Map path segments to readable labels
  const LABELS: Record<string, [string, string]> = {
    '': ['Overview', 'Dashboard'],
    'campaigns': ['Operate', 'Campaigns'],
    'donations': ['Operate', 'Donations'],
    'categories': ['Operate', 'Categories'],
    'homepage': ['Site', 'Homepage sections'],
    'hero-panel': ['Site', 'Hero panel'],
    'trust-badges': ['Site', 'Trust badges'],
    'stories': ['Site', 'Impact stories'],
    'faqs': ['Site', 'FAQ'],
    'announcement-bar': ['Site', 'Announcement bar'],
    'transparency-documents': ['Site', 'Transparency docs'],
    'donation-presets': ['Site', 'Donation presets'],
    'money-allocations': ['Site', 'Money allocation'],
    'contact-submissions': ['Site', 'Contact inbox'],
    'cms': ['Site', 'CMS content'],
    'donate-popup-settings': ['Site', 'Donate popup'],
    'settings': ['Settings', 'Settings'],
    'users': ['Access', 'Users'],
  };

  const [section, page] = LABELS[path] || ['Admin', path || 'Dashboard'];
  return { section, page };
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const { section, page } = useBreadcrumb();
  const [currentUser, setCurrentUser] = useState({ fullName: '', role: '', email: '', username: '' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Session management
  const SESSION_KEY = STORAGE_KEYS.SESSION_ID;
  const LAST_ACTIVITY_KEY = STORAGE_KEYS.LAST_ACTIVITY;
  const SESSION_TIMEOUT = TIMING.SESSION_TIMEOUT_ADMIN;

  const generateSessionId = () =>
    `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;

  const updateActivity = () => {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  };

  const isSessionValid = () => {
    const sessionId = localStorage.getItem(SESSION_KEY);
    const tabSessionId = sessionStorage.getItem(SESSION_KEY);
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!sessionId || !lastActivity) return false;
    if (sessionId !== tabSessionId) return false;
    return Date.now() - parseInt(lastActivity) < SESSION_TIMEOUT;
  };

  const performLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (error) {
      logger.error('AdminLayout', 'Logout API call failed:', error);
    }
    localStorage.removeItem('adminUser');
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    navigate('/admin/login');
  };

  // Load current user
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('adminUser');
      const user = userStr ? JSON.parse(userStr) : {};
      setCurrentUser(user);
      setIsAdmin(user.role === 'ADMIN');
    } catch {
      setCurrentUser({ fullName: '', role: '', email: '', username: '' });
    }
  }, []);

  // Initialize session
  useEffect(() => {
    const init = async () => {
      const user = localStorage.getItem('adminUser');
      if (!user) { navigate('/admin/login'); return; }

      let sid = localStorage.getItem(SESSION_KEY);
      if (!sid) {
        sid = generateSessionId();
        localStorage.setItem(SESSION_KEY, sid);
        sessionStorage.setItem(SESSION_KEY, sid);
        updateActivity();
      } else {
        if (!isSessionValid()) {
          alert('Your session has expired or you are logged in elsewhere. Please login again.');
          performLogout();
          return;
        }
        sessionStorage.setItem(SESSION_KEY, sid);
        updateActivity();
      }

      try {
        await fetch(`${API_BASE_URL}/auth/csrf`, { method: 'GET', credentials: 'include' });
      } catch (error) {
        logger.warn('AdminLayout', 'Failed to initialize CSRF token:', error);
      }
      setIsAuthChecked(true);
    };
    init();
  }, []);

  // Activity tracking
  useEffect(() => {
    const handleActivity = () => {
      if (!isSessionValid()) { alert('Your session has expired. Please login again.'); performLogout(); return; }
      updateActivity();
    };
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((e) => window.addEventListener(e, handleActivity));
    const tid = setInterval(() => {
      if (!isSessionValid()) { alert('Your session has expired or you are logged in elsewhere.'); performLogout(); }
    }, 60000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      clearInterval(tid);
    };
  }, []);

  const closeSidebar = () => setIsSidebarOpen(false);

  // Close sidebar on Esc
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && isSidebarOpen) closeSidebar(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isSidebarOpen]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);

  // Get user initials for avatar
  const initials = (currentUser.fullName || 'A')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (!isAuthChecked) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {/* Mobile hamburger */}
      <button
        className="admin-hamburger"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={isSidebarOpen}
      >
        <span /><span /><span />
      </button>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div className="admin-overlay" onClick={closeSidebar} aria-hidden="true" />
      )}

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`} data-testid="admin-sidebar">
        {/* Logo header */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">YS</div>
          <div className="sidebar-logo-text">
            <div className="sidebar-logo-name">Yugal Savitri</div>
            <div className="sidebar-logo-sub">Admin console</div>
          </div>
        </div>

        {/* Search */}
        <div className="sidebar-search-wrap">
          <button className="sidebar-search-btn">
            <SearchIcon />
            <span>Search</span>
            <kbd className="sidebar-kbd">⌘K</kbd>
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" data-testid="admin-nav">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.adminOnly || isAdmin
            );
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.heading} className="sidebar-group">
                <div className="sidebar-group-heading">{group.heading}</div>
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `sidebar-nav-item ${isActive ? 'active' : ''}`
                    }
                    onClick={closeSidebar}
                    data-testid={`nav-${item.to.split('/').pop()}`}
                  >
                    <span className="sidebar-nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="sidebar-nav-badge">{item.badge}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{currentUser.fullName || 'Administrator'}</div>
            <div className="sidebar-user-role">{currentUser.role || 'ADMIN'}</div>
          </div>
          <button
            className="sidebar-user-menu"
            onClick={performLogout}
            aria-label="Logout"
            title="Logout"
            data-testid="admin-logout"
          >
            <LogoutIcon />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="admin-main">
        {/* Breadcrumb bar */}
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            <span className="breadcrumb-section">{section}</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-page">{page}</span>
          </div>
        </header>

        {/* Content */}
        <div className="admin-content">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
