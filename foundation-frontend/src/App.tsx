import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ConfigLoader from './components/ConfigLoader';

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
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AdminContactSettings = lazy(() => import('./pages/AdminContactSettings'));
const AdminFooterSettings = lazy(() => import('./pages/AdminFooterSettings'));
const AdminDonatePopupSettings = lazy(() => import('./pages/AdminDonatePopupSettings'));
const AdminHeroSlides = lazy(() => import('./pages/AdminHeroSlides'));
const AdminHomeSections = lazy(() => import('./pages/AdminHomeSections'));
const AdminCMS = lazy(() => import('./pages/AdminCMS'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const PasswordSetup = lazy(() => import('./pages/PasswordSetup'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const AccessibilityPage = lazy(() => import('./pages/AccessibilityPage'));
const CookiesPage = lazy(() => import('./pages/CookiesPage'));

// Loading spinner component
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
    <div className="loading-spinner" style={{ fontSize: '18px', color: '#666' }}>Loading...</div>
  </div>
);

function App() {
  return (
    <ConfigLoader>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Admin Login (No Sidebar) */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/setup-password" element={<PasswordSetup />} />
            
            {/* Admin Routes - Nested with Sidebar */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="donations" element={<Donations />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="categories" element={<Categories />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="contact-settings" element={<AdminContactSettings />} />
              <Route path="footer-settings" element={<AdminFooterSettings />} />
              <Route path="donate-popup-settings" element={<AdminDonatePopupSettings />} />
              <Route path="hero-slides" element={<AdminHeroSlides />} />
              <Route path="home-sections" element={<AdminHomeSections />} />
              <Route path="cms" element={<AdminCMS />} />
            </Route>
            
            {/* Campaign Form Routes (No Sidebar - separate) */}
            <Route path="/admin/campaigns/new" element={<AdminCampaignForm />} />
            <Route path="/admin/campaigns/:id" element={<AdminCampaignForm />} />
            
            {/* Public Routes - With Layout */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/campaigns" element={<CampaignList />} />
              <Route path="/campaigns/:id" element={<CampaignDetail />} />
              <Route path="/donate/:campaignId" element={<DonationForm />} />
              <Route path="/donate/success" element={<Success />} />
              <Route path="/donate/cancel" element={<Cancel />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/accessibility" element={<AccessibilityPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ConfigLoader>
  );
}

export default App;
