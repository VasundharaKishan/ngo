import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import CampaignList from './pages/CampaignList';
import CampaignDetail from './pages/CampaignDetail';
import DonationForm from './pages/DonationForm';
import Success from './pages/Success';
import Cancel from './pages/Cancel';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/campaigns" element={<CampaignList />} />
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
          <Route path="/donate/:campaignId" element={<DonationForm />} />
          <Route path="/donate/success" element={<Success />} />
          <Route path="/donate/cancel" element={<Cancel />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
