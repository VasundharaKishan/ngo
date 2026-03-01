import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ConfigLoader from './components/ConfigLoader';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load all pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const CampaignList = lazy(() => import('./pages/CampaignList'));
const CampaignDetail = lazy(() => import('./pages/CampaignDetail'));
const DonationForm = lazy(() => import('./pages/DonationForm'));
const Success = lazy(() => import('./pages/Success'));
const Cancel = lazy(() => import('./pages/Cancel'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Donations = lazy(() => import('./pages/Donations'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const Categories = lazy(() => import('./pages/Categories'));
const AdminCampaignForm = lazy(() => import('./pages/AdminCampaignForm'));
const AdminSettingsConsolidated = lazy(() => import('./pages/AdminSettingsConsolidated'));
const AdminDonatePopupSettings = lazy(() => import('./pages/AdminDonatePopupSettings'));
const AdminHomepage = lazy(() => import('./pages/AdminHomepage'));
const AdminCMS = lazy(() => import('./pages/AdminCMS'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const PasswordSetup = lazy(() => import('./pages/PasswordSetup'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const AccessibilityPage = lazy(() => import('./pages/AccessibilityPage'));
const CookiesPage = lazy(() => import('./pages/CookiesPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
import CookieConsent from './components/CookieConsent';

// Loading spinner component
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
    <div className="loading-spinner" style={{ fontSize: '18px', color: '#666' }}>Loading...</div>
  </div>
);

function App() {
  return (
    <ConfigLoader>
      <Helmet>
        <title>Donate</title>
        <meta name="description" content="Supporting education, healthcare, and community development through transparent donations." />
      </Helmet>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Admin Login (No Sidebar) */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/setup-password" element={<PasswordSetup />} />
            
            {/* Admin Routes - Nested with Sidebar */}
            <Route path="/admin" element={<ErrorBoundary><AdminLayout /></ErrorBoundary>}>
              <Route index element={<Dashboard />} />
              <Route path="donations" element={<Donations />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="campaigns/new" element={<AdminCampaignForm />} />
              <Route path="campaigns/:id" element={<AdminCampaignForm />} />
              <Route path="categories" element={<Categories />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="settings" element={<AdminSettingsConsolidated />} />
              <Route path="donate-popup-settings" element={<AdminDonatePopupSettings />} />
              <Route path="homepage" element={<AdminHomepage />} />
              <Route path="cms" element={<AdminCMS />} />
            </Route>
            
            {/* Public Routes - With Layout */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/campaigns" element={<CampaignList />} />
              <Route path="/campaigns/:id" element={<CampaignDetail />} />
              <Route path="/donate/:campaignId" element={<DonationForm />} />
              <Route path="/donate/success" element={<Success />} />
              <Route path="/donate/cancel" element={<Cancel />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/accessibility" element={<AccessibilityPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
        <CookieConsent />
      </BrowserRouter>
    </ConfigLoader>
  );
}

export default App;
