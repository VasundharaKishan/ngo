import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';
import type { TabType, TabRef } from './settings/types';
import GeneralSettingsTab from './settings/GeneralSettingsTab';
import ContactSettingsTab from './settings/ContactSettingsTab';
import FooterSettingsTab from './settings/FooterSettingsTab';
import BannerSettingsTab from './settings/BannerSettingsTab';
import LegalRegistrationTab from './settings/LegalRegistrationTab';
import {
  RiSettings3Line,
  RiPhoneLine,
  RiLayoutBottomLine,
  RiGlobalLine,
  RiShieldCheckLine
} from 'react-icons/ri';
import './AdminSettingsConsolidated.css';

export default function AdminSettingsConsolidated() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [saving, setSaving] = useState(false);

  const generalRef = useRef<TabRef>(null);
  const contactRef = useRef<TabRef>(null);
  const footerRef = useRef<TabRef>(null);
  const bannerRef = useRef<TabRef>(null);
  const legalRef = useRef<TabRef>(null);

  useEffect(() => {
    const user = localStorage.getItem('adminUser');
    if (!user) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      switch (activeTab) {
        case 'general':
          await generalRef.current?.save();
          break;
        case 'contact':
          await contactRef.current?.save();
          break;
        case 'footer':
          await footerRef.current?.save();
          break;
        case 'banner':
          await bannerRef.current?.save();
          break;
        case 'legal':
          await legalRef.current?.save();
          break;
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-settings-consolidated">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage all site settings in one place</p>
      </div>

      {/* Tab Navigation */}
      <div className="settings-tabs">
        <button
          className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
          data-testid="settings-tab-general"
        >
          <RiSettings3Line className="tab-icon" />
          <span>General</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
          data-testid="settings-tab-contact"
        >
          <RiPhoneLine className="tab-icon" />
          <span>Contact</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'footer' ? 'active' : ''}`}
          onClick={() => setActiveTab('footer')}
          data-testid="settings-tab-footer"
        >
          <RiLayoutBottomLine className="tab-icon" />
          <span>Footer</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'banner' ? 'active' : ''}`}
          onClick={() => setActiveTab('banner')}
          data-testid="settings-tab-banner"
        >
          <RiGlobalLine className="tab-icon" />
          <span>Banner</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'legal' ? 'active' : ''}`}
          onClick={() => setActiveTab('legal')}
          data-testid="settings-tab-legal"
        >
          <RiShieldCheckLine className="tab-icon" />
          <span>Legal / Registration</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="settings-content">
        {activeTab === 'general' && <GeneralSettingsTab ref={generalRef} showToast={showToast} />}
        {activeTab === 'contact' && <ContactSettingsTab ref={contactRef} showToast={showToast} />}
        {activeTab === 'footer' && <FooterSettingsTab ref={footerRef} showToast={showToast} />}
        {activeTab === 'banner' && <BannerSettingsTab ref={bannerRef} showToast={showToast} />}
        {activeTab === 'legal' && <LegalRegistrationTab ref={legalRef} showToast={showToast} />}
      </div>

      {/* Save Button */}
      <div className="settings-actions">
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
          data-testid="settings-save-button"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
