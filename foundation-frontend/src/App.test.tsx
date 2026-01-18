import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

const stub = (label: string) => () => <div>{label}</div>;

let initialEntries: string[] = ['/'];

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  const MemoryRouter = actual.MemoryRouter;
  const Outlet = actual.Outlet;
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    ),
    Outlet,
  };
});

vi.mock('./components/ConfigLoader', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./components/Layout', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  const Outlet = actual.Outlet;
  return {
    __esModule: true,
    default: () => (
      <div>
        Layout
        <Outlet />
      </div>
    ),
  };
});

vi.mock('./components/AdminLayout', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  const Outlet = actual.Outlet;
  return {
    __esModule: true,
    default: () => (
      <div>
        AdminLayout
        <Outlet />
      </div>
    ),
  };
});

// Mock all lazy-loaded pages with simple stubs
vi.mock('./pages/Home', () => ({ __esModule: true, default: stub('Home Page') }));
vi.mock('./pages/CampaignList', () => ({ __esModule: true, default: stub('Campaign List Page') }));
vi.mock('./pages/CampaignDetail', () => ({ __esModule: true, default: stub('Campaign Detail Page') }));
vi.mock('./pages/DonationForm', () => ({ __esModule: true, default: stub('Donation Form Page') }));
vi.mock('./pages/Success', () => ({ __esModule: true, default: stub('Success Page') }));
vi.mock('./pages/Cancel', () => ({ __esModule: true, default: stub('Cancel Page') }));
vi.mock('./pages/Dashboard', () => ({ __esModule: true, default: stub('Dashboard Page') }));
vi.mock('./pages/Donations', () => ({ __esModule: true, default: stub('Donations Page') }));
vi.mock('./pages/Campaigns', () => ({ __esModule: true, default: stub('Campaigns Page') }));
vi.mock('./pages/Categories', () => ({ __esModule: true, default: stub('Categories Page') }));
vi.mock('./pages/AdminCampaignForm', () => ({ __esModule: true, default: stub('Admin Campaign Form Page') }));
vi.mock('./pages/AdminSettingsConsolidated', () => ({ __esModule: true, default: stub('Admin Settings Consolidated Page') }));
vi.mock('./pages/AdminDonatePopupSettings', () => ({ __esModule: true, default: stub('Admin Donate Popup Settings Page') }));
vi.mock('./pages/AdminHomepage', () => ({ __esModule: true, default: stub('Admin Homepage Page') }));
vi.mock('./pages/AdminCMS', () => ({ __esModule: true, default: stub('Admin CMS Page') }));
vi.mock('./pages/AdminLogin', () => ({ __esModule: true, default: stub('Admin Login Page') }));
vi.mock('./pages/AdminUsers', () => ({ __esModule: true, default: stub('Admin Users Page') }));
vi.mock('./pages/PasswordSetup', () => ({ __esModule: true, default: stub('Password Setup Page') }));
vi.mock('./pages/TermsPage', () => ({ __esModule: true, default: stub('Terms Page') }));
vi.mock('./pages/PrivacyPage', () => ({ __esModule: true, default: stub('Privacy Page') }));
vi.mock('./pages/AccessibilityPage', () => ({ __esModule: true, default: stub('Accessibility Page') }));
vi.mock('./pages/CookiesPage', () => ({ __esModule: true, default: stub('Cookies Page') }));

describe('App routing', () => {
  beforeEach(() => {
    initialEntries = ['/'];
  });

  it('renders home route', async () => {
    initialEntries = ['/'];
    render(<App />);
    expect(await screen.findByText('Home Page')).toBeInTheDocument();
  });

  it('renders admin login route', async () => {
    initialEntries = ['/admin/login'];
    render(<App />);
    expect(await screen.findByText('Admin Login Page')).toBeInTheDocument();
  });

  it('renders nested admin route', async () => {
    initialEntries = ['/admin/campaigns'];
    render(<App />);
    expect(await screen.findByText('AdminLayout')).toBeInTheDocument();
    expect(await screen.findByText('Campaigns Page')).toBeInTheDocument();
  });
});
