import { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import './Layout.css';
import '../styles/ui-polish.css';
import FeaturedCampaignModal from './FeaturedCampaignModal';
import ErrorBoundary from './ErrorBoundary';
import { fetchContactInfo, type ContactInfo } from '../utils/contactApi';
import { useSiteName, useSiteLogo } from '../contexts/ConfigContext';
import { API_BASE_URL } from '../api';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';

interface SocialMediaLink {
  id: number;
  platform: string;
  url: string;
  icon: string;
  displayOrder: number;
  active: boolean;
}

interface CMSContent {
  id: number;
  section: string;
  key: string;
  value: string;
  contentType: string;
  active: boolean;
}

// Helper function to get icon component based on platform name
const getSocialIcon = (platform: string) => {
  const platformLower = platform.toLowerCase();
  if (platformLower.includes('facebook')) return <FaFacebook />;
  if (platformLower.includes('twitter') || platformLower.includes('x')) return <FaTwitter />;
  if (platformLower.includes('instagram')) return <FaInstagram />;
  if (platformLower.includes('linkedin')) return <FaLinkedin />;
  if (platformLower.includes('youtube')) return <FaYoutube />;
  return null;
};

export default function Layout() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [contactLoading, setContactLoading] = useState(true);
  const [contactError, setContactError] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([]);
  const [footerTagline, setFooterTagline] = useState<string>('');
  const [, setCopyrightText] = useState<string>('');
  const [, setDisclaimerText] = useState<string>('');
  const [footerLoading, setFooterLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('This website is under development');
  
  // Get site name and logo from config context
  const siteName = useSiteName();
  const logoUrl = useSiteLogo();

  useEffect(() => {
    const loadContactInfo = async () => {
      try {
        const data = await fetchContactInfo();
        setContactInfo(data);
        setContactError(false);
      } catch (error) {
        console.error('Failed to load contact info:', error);
        setContactError(true);
      } finally {
        setContactLoading(false);
      }
    };
    loadContactInfo();
  }, []);

  useEffect(() => {
    const loadBannerSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/cms/content/site-settings`);
        if (response.ok) {
          const data = await response.json();
          const bannerSetting = data.find((item: CMSContent) => item.key === 'development_banner');
          if (bannerSetting && bannerSetting.active) {
            setShowBanner(true);
            if (bannerSetting.value) {
              setBannerMessage(bannerSetting.value);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load banner settings:', error);
      }
    };
    loadBannerSettings();
  }, []);

  useEffect(() => {
    const loadFooterContent = async () => {
      try {
        // Fetch social media links from CMS
        const socialResponse = await fetch(`${API_BASE_URL}/cms/social-media`);
        if (socialResponse.ok) {
          const socialData = await socialResponse.json();
          // Sort by display order and filter active links
          const activeSocialLinks = socialData
            .filter((link: SocialMediaLink) => link.active)
            .sort((a: SocialMediaLink, b: SocialMediaLink) => a.displayOrder - b.displayOrder);
          setSocialLinks(activeSocialLinks);
        }

        // Fetch footer content from CMS
        const contentResponse = await fetch(`${API_BASE_URL}/cms/content/footer`);
        if (contentResponse.ok) {
          const contentData: CMSContent[] = await contentResponse.json();
          
          // Extract footer content by key
          contentData.forEach((item) => {
            if (item.active) {
              switch (item.key) {
                case 'tagline':
                  setFooterTagline(item.value);
                  break;
                case 'copyright':
                  setCopyrightText(item.value);
                  break;
                case 'disclaimer':
                  setDisclaimerText(item.value);
                  break;
              }
            }
          });
        }
      } catch (error) {
        console.error('Failed to load footer content:', error);
      } finally {
        setFooterLoading(false);
      }
    };
    loadFooterContent();
  }, []);

  const handleDonateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <div className="layout">
      {showBanner && (
        <div className="dev-banner">
          <span>🚧 {bannerMessage}</span>
        </div>
      )}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <header data-testid="site-header" className="header" role="banner">
        <div className="header-inner">
          <Link to="/" className="site-logo" aria-label="Home">
            <img src={logoUrl} alt={`${siteName} logo`} className="logo-img" />
            <h1>{siteName}</h1>
          </Link>
          <nav className="nav" role="navigation" aria-label="Main navigation">
            <Link to="/" className="nav-link">Home</Link>
            <Link data-testid="nav-campaigns" to="/campaigns" className="nav-link">Campaigns</Link>
            <a href="#" className="btn-donate-header btn-hero" onClick={handleDonateClick} aria-label="Open donation form">
              <span className="heart-icon" aria-hidden="true">❤️</span>
              Donate
            </a>
          </nav>
        </div>
      </header>

      <main id="main-content" className="main" role="main">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      <footer className="footer" role="contentinfo">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>{siteName}</h3>
              <p className="footer-tagline">
                {footerTagline || 'Empowering communities worldwide through compassion and action.'}
              </p>
            </div>

            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/campaigns">All Campaigns</Link></li>
                <li><Link to="/terms">Terms & Conditions</Link></li>
                <li><Link to="/accessibility">Accessibility</Link></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Get Involved</h4>
              <ul>
                <li><a href="#" onClick={handleDonateClick}>Make a Donation</a></li>
              </ul>
            </div>

            {contactInfo && contactInfo.showInFooter !== false && (
              <div className="footer-section">
                <h4>Contact</h4>
                {contactLoading ? (
                  <p className="footer-loading">Loading contact info...</p>
                ) : contactError ? (
                  <p className="footer-error-note">Contact information temporarily unavailable</p>
                ) : (
                  <div>
                    {contactInfo.email && <p>Email: {contactInfo.email}</p>}
                    {contactInfo.locations && contactInfo.locations.map((location, index) => (
                      <div key={index} className="footer-location">
                        <p className="location-label"><strong>{location.label}</strong></p>
                        {location.lines.map((line, lineIndex) => (
                          <p key={lineIndex} className="location-line">{line}</p>
                        ))}
                        {location.postalLabel && location.postalCode && (
                          <p className="location-postal">{location.postalLabel}: {location.postalCode}</p>
                        )}
                        {location.mobile && <p className="location-mobile">Mobile: {location.mobile}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="footer-bottom">
            <Link to="/privacy" className="privacy-link">Privacy policy</Link>
            {!footerLoading && socialLinks.length > 0 && (
              <div className="footer-social-links">
                {socialLinks.map((link) => (
                  <a 
                    key={link.id}
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    aria-label={link.platform}
                    title={link.platform}
                  >
                    {getSocialIcon(link.platform)}
                  </a>
                ))}
              </div>
            )}
            <span className="copyright">© 2025 YSS</span>
          </div>
        </div>
      </footer>

      <FeaturedCampaignModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
