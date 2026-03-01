import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logger from '../utils/logger';
import './Layout.css';
import '../styles/ui-polish.css';
import FeaturedCampaignModal from './FeaturedCampaignModal';
import ErrorBoundary from './ErrorBoundary';
// Language switcher removed — English only for now (i18n infra kept for future use)
import { fetchContactInfo, type ContactInfo } from '../utils/contactApi';
import { useSiteName, useSiteLogo } from '../contexts/ConfigContext';
import { API_BASE_URL } from '../api';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';

interface SocialMediaLink {
  platform: string;
  url: string;
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
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const newsletterRef = useRef<HTMLInputElement>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [contactLoading, setContactLoading] = useState(true);
  const [contactError, setContactError] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([]);
  const [footerTagline, setFooterTagline] = useState<string>('');
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
        logger.error('Layout', 'Failed to load contact info:', error);
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
          // API returns Map<key, value> of active items only
          const data: Record<string, string> = await response.json();
          if (data['development_banner'] !== undefined) {
            setShowBanner(true);
            setBannerMessage(data['development_banner']);
          }
        }
      } catch (error) {
        logger.error('Layout', 'Failed to load banner settings:', error);
      }
    };
    loadBannerSettings();
  }, []);

  useEffect(() => {
    const loadFooterContent = async () => {
      try {
        // Single source of truth: footer config managed by admin in Footer Settings
        const response = await fetch(`${API_BASE_URL}/config/public/footer`);
        if (response.ok) {
          const data = await response.json();
          if (data.tagline) setFooterTagline(data.tagline);

          // Build social links from admin-configured URLs — only include platforms with a URL set
          if (data.socialMedia) {
            const platformOrder = ['facebook', 'twitter', 'instagram', 'youtube', 'linkedin'];
            const links: SocialMediaLink[] = platformOrder
              .filter(p => data.socialMedia[p])
              .map(p => ({
                platform: p.charAt(0).toUpperCase() + p.slice(1),
                url: data.socialMedia[p],
              }));
            setSocialLinks(links);
          }
        }
      } catch (error) {
        logger.error('Layout', 'Failed to load footer content:', error);
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

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail)) {
      setNewsletterStatus('error');
      return;
    }
    // Redirect to contact page with email pre-filled and subject set to "newsletter"
    navigate(`/contact?subject=newsletter&email=${encodeURIComponent(newsletterEmail)}`);
    setNewsletterEmail('');
  };

  return (
    <div className="layout">
      {showBanner && (
        <div className="dev-banner">
          <span>🚧 {bannerMessage}</span>
        </div>
      )}
      <a href="#main-content" className="skip-to-content">
        {t('footer.skipToContent')}
      </a>
      <header data-testid="site-header" className="header" role="banner">
        <div className="header-inner">
          <Link to="/" className="site-logo" aria-label="Home">
            <img src={logoUrl} alt={`${siteName} logo`} className="logo-img" />
            <span className="site-logo-name">{siteName}</span>
          </Link>
          <nav className="nav" role="navigation" aria-label="Main navigation">
            <Link to="/" className="nav-link">{t('nav.home')}</Link>
            <Link data-testid="nav-campaigns" to="/campaigns" className="nav-link">{t('nav.campaigns')}</Link>
            <Link to="/about" className="nav-link">{t('nav.about')}</Link>
            <Link to="/contact" className="nav-link">{t('nav.contact')}</Link>
            <a href="#" className="btn-donate-header btn-hero" onClick={handleDonateClick} aria-label="Open donation form">
              <span className="heart-icon" aria-hidden="true">❤️</span>
              {t('nav.donate')}
            </a>
            {/* Language switcher removed — English only for now */}
          </nav>
        </div>
      </header>

      <main id="main-content" className="main" role="main">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      <div className="trust-strip" aria-label="Trust indicators">
        <div className="trust-strip-inner">
          <span className="trust-item"><span aria-hidden="true">🔒</span> {t('footer.trust.secure')}</span>
          <span className="trust-divider" aria-hidden="true">·</span>
          <span className="trust-item"><span aria-hidden="true">🏛️</span> {t('footer.trust.ngo')}</span>
          <span className="trust-divider" aria-hidden="true">·</span>
          <span className="trust-item"><span aria-hidden="true">💯</span> {t('footer.trust.funds')}</span>
        </div>
      </div>
      <footer className="footer" role="contentinfo">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>{siteName}</h3>
              <p className="footer-tagline">
                {footerTagline || t('footer.defaultTagline')}
              </p>
            </div>

            <div className="footer-section">
              <h4>{t('footer.quickLinks')}</h4>
              <ul>
                <li><Link to="/campaigns">{t('campaign.allCampaigns')}</Link></li>
                <li><Link to="/about">{t('nav.about')}</Link></li>
                <li><Link to="/contact">{t('nav.contact')}</Link></li>
              </ul>
            </div>

            <div className="footer-section footer-newsletter">
              <h4>{t('footer.stayConnected')}</h4>
              <p className="newsletter-description">{t('footer.newsletterText')}</p>
              {newsletterStatus === 'success' ? (
                <div className="newsletter-success">
                  ✅ {t('footer.subscribeSuccess')}
                </div>
              ) : (
                <form className="newsletter-form" onSubmit={handleNewsletterSubmit} noValidate>
                  <input
                    ref={newsletterRef}
                    type="email"
                    value={newsletterEmail}
                    onChange={e => { setNewsletterEmail(e.target.value); setNewsletterStatus('idle'); }}
                    placeholder={t('footer.emailPlaceholder')}
                    aria-label="Email address for newsletter"
                    className={`newsletter-input ${newsletterStatus === 'error' ? 'newsletter-input-error' : ''}`}
                  />
                  {newsletterStatus === 'error' && (
                    <span className="newsletter-error">{t('footer.subscribeError')}</span>
                  )}
                  <button type="submit" className="btn-newsletter">{t('footer.subscribe')}</button>
                </form>
              )}
            </div>

            {contactInfo && contactInfo.showInFooter !== false && (
              <div className="footer-section">
                <h4>{t('footer.contact')}</h4>
                {contactLoading ? (
                  <p className="footer-loading">{t('footer.loadingContact')}</p>
                ) : contactError ? (
                  <p className="footer-error-note">{t('footer.contactUnavailable')}</p>
                ) : (
                  <div>
                    {contactInfo.email && <p>{t('footer.emailLabel')} {contactInfo.email}</p>}
                    {contactInfo.locations && contactInfo.locations.map((location, index) => (
                      <div key={index} className="footer-location">
                        <p className="location-label"><strong>{location.label}</strong></p>
                        {location.lines.map((line, lineIndex) => (
                          <p key={lineIndex} className="location-line">{line}</p>
                        ))}
                        {location.postalLabel && location.postalCode && (
                          <p className="location-postal">{location.postalLabel}: {location.postalCode}</p>
                        )}
                        {location.mobile && <p className="location-mobile">{t('footer.mobileLabel')} {location.mobile}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="footer-bottom">
            <Link to="/privacy" className="privacy-link">{t('footer.privacyPolicy')}</Link>
            {!footerLoading && socialLinks.length > 0 && (
              <div className="footer-social-links">
                {socialLinks.map((link) => (
                  <a 
                    key={link.platform}
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
            <span className="copyright">© {new Date().getFullYear()} {siteName}</span>
          </div>
        </div>
      </footer>

      <FeaturedCampaignModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
