import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import CampaignList from './pages/CampaignList';
import CampaignDetail from './pages/CampaignDetail';
import DonationForm from './pages/DonationForm';
import Success from './pages/Success';
import Cancel from './pages/Cancel';
import Dashboard from './pages/Dashboard';
import Donations from './pages/Donations';
import Campaigns from './pages/Campaigns';
import Categories from './pages/Categories';
import AdminCampaignForm from './pages/AdminCampaignForm';
import AdminSettings from './pages/AdminSettings';
import AdminLogin from './pages/AdminLogin';
import AdminUsers from './pages/AdminUsers';
import PasswordSetup from './pages/PasswordSetup';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import AccessibilityPage from './pages/AccessibilityPage';
import CookiesPage from './pages/CookiesPage';

function App() {
  return (
    <BrowserRouter>
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
        </Route>
        
        {/* Campaign Form Routes (No Sidebar - separate) */}
        <Route path="/admin/campaigns/new" element={<AdminCampaignForm />} />
        <Route path="/admin/campaigns/:id" element={<AdminCampaignForm />} />
        
        {/* Public Routes - With Layout */}
        <Route path="/*" element={
          <Layout>
            <Routes>
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
            </Routes>
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
