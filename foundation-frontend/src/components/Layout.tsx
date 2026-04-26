import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logger from '../utils/logger';
import './Layout.css';
import '../styles/ui-polish.css';
import FeaturedCampaignModal from './FeaturedCampaignModal';
import ErrorBoundary from './ErrorBoundary';
import TrustBadges from './TrustBadges';
import AnnouncementBar from './AnnouncementBar';
import { fetchContactInfo, type ContactInfo } from '../utils/contactApi';
import { useSiteName, useSiteLogo } from '../contexts/ConfigContext';
import { useRegistrationInfo, footerDisclosureFor } from '../hooks/useRegistrationInfo';
import { API_BASE_URL } from '../api';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';

interface SocialMediaLink {
  platform: string;
  url: string;
}

const getSocialIcon = (platform: string) => {
  const p = platform.toLowerCase();
  if (p.includes('facebook')) return <FaFacebook />;
  if (p.includes('twitter') || p.includes('x')) return <FaTwitter />;
  if (p.includes('instagram')) return <FaInstagram />;
  if (p.includes('linkedin')) return <FaLinkedin />;
  if (p.includes('youtube')) return <FaYoutube />;
  return null;
};

/* ── Arrow icon used in CTA buttons ── */
const ArrowIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Hamburger / close icon ── */
const MenuIcon = ({ open }: { open: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {open ? (
      <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    ) : (
      <>
        <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    )}
  </svg>
);

export default function Layout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [contactLoading, setContactLoading] = useState(true);
  const [contactError, setContactError] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([]);
  const [footerTagline, setFooterTagline] = useState<string>('');
  const [footerLoading, setFooterLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('This website is under development');

  const siteName = useSiteName();
  const logoUrl = useSiteLogo();

  const registration = useRegistrationInfo();
  const registrationDisclosure = footerDisclosureFor(registration);

  /* ── data fetching ── */
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
        const response = await fetch(`${API_BASE_URL}/config/public/footer`);
        if (response.ok) {
          const data = await response.json();
          if (data.tagline) setFooterTagline(data.tagline);
          if (data.socialMedia) {
            const order = ['facebook', 'twitter', 'instagram', 'youtube', 'linkedin'];
            const links: SocialMediaLink[] = order
              .filter(p => data.socialMedia[p])
              .map(p => ({ platform: p.charAt(0).toUpperCase() + p.slice(1), url: data.socialMedia[p] }));
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

  /* ── handlers ── */
  const handleDonateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  /* ── render ── */
  return (
    <div className="layout">
      <AnnouncementBar />
      {showBanner && (
        <div className="dev-banner">
          <span>🚧 {bannerMessage}</span>
        </div>
      )}

      <a href="#main-content" className="skip-to-content">
        {t('footer.skipToContent')}
      </a>

      {/* ═══════ HEADER — matches mockup: sticky, white/glass, saffron CTA ═══════ */}
      <header data-testid="site-header" className="header" role="banner">
        <div className="header-inner">
          {/* Logo block — trust-blue square + two-line name */}
          <Link to="/" className="site-logo" aria-label="Home" onClick={closeMobileMenu}>
            {logoUrl ? (
              <img src={logoUrl} alt={`${siteName} logo`} className="logo-img" />
            ) : (
              <div className="logo-mark" aria-hidden="true">YS</div>
            )}
            <div className="logo-text">
              <span className="logo-text-name">Yugal Savitri</span>
              <span className="logo-text-sub">Seva Foundation</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="nav-desktop" role="navigation" aria-label="Main navigation">
            <Link to="/campaigns" className="nav-link">{t('nav.campaigns')}</Link>
            <Link to="/impact" className="nav-link">Our impact</Link>
            <Link to="/transparency" className="nav-link">Transparency</Link>
            <Link to="/about" className="nav-link">{t('nav.about')}</Link>
          </nav>

          <div className="header-actions">
            <a
              href="#donate"
              className="btn-donate-header"
              onClick={handleDonateClick}
              aria-label="Open donation form"
            >
              Donate <ArrowIcon />
            </a>
            {/* Mobile hamburger */}
            <button
              className="btn-hamburger"
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              <MenuIcon open={mobileMenuOpen} />
            </button>
          </div>
        </div>

        {/* Mobile nav overlay */}
        {mobileMenuOpen && (
          <nav className="nav-mobile" role="navigation" aria-label="Mobile navigation">
            <Link to="/campaigns" className="nav-mobile-link" onClick={closeMobileMenu}>{t('nav.campaigns')}</Link>
            <Link to="/impact" className="nav-mobile-link" onClick={closeMobileMenu}>Our impact</Link>
            <Link to="/transparency" className="nav-mobile-link" onClick={closeMobileMenu}>Transparency</Link>
            <Link to="/about" className="nav-mobile-link" onClick={closeMobileMenu}>{t('nav.about')}</Link>
            <Link to="/faq" className="nav-mobile-link" onClick={closeMobileMenu}>FAQ</Link>
            <Link to="/contact" className="nav-mobile-link" onClick={closeMobileMenu}>{t('nav.contact')}</Link>
          </nav>
        )}
      </header>

      {/* ═══════ MAIN ═══════ */}
      <main id="main-content" className="main" role="main">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* ═══════ FOOTER — mockup: light bg, 4-col grid, bottom bar ═══════ */}
      <footer className="footer" role="contentinfo">
        <div className="footer-grid-wrapper">
          <div className="footer-grid">
            {/* Col 1: Logo + tagline */}
            <div className="footer-brand">
              <Link to="/" className="footer-logo" aria-label="Home">
                {logoUrl ? (
                  <img src={logoUrl} alt={`${siteName} logo`} className="footer-logo-img" />
                ) : (
                  <div className="logo-mark logo-mark--sm" aria-hidden="true">YS</div>
                )}
                <div className="logo-text">
                  <span className="logo-text-name">Yugal Savitri</span>
                  <span className="logo-text-sub">Seva Foundation</span>
                </div>
              </Link>
              <p className="footer-tagline">
                {footerTagline || 'Education, health, and dignity for rural India. A community-led foundation.'}
              </p>
            </div>

            {/* Col 2: Give */}
            <div className="footer-col">
              <div className="footer-col-heading">Give</div>
              <ul className="footer-links">
                <li><a href="#donate" onClick={handleDonateClick}>Donate once</a></li>
                <li><a href="#donate" onClick={handleDonateClick}>Give monthly</a></li>
                <li><Link to="/campaigns">All campaigns</Link></li>
                <li><Link to="/contact">Corporate / CSR</Link></li>
              </ul>
            </div>

            {/* Col 3: About */}
            <div className="footer-col">
              <div className="footer-col-heading">About</div>
              <ul className="footer-links">
                <li><Link to="/about">Our story</Link></li>
                <li><Link to="/impact">Our impact</Link></li>
                <li><Link to="/transparency">Annual reports</Link></li>
                <li><Link to="/faq">FAQ</Link></li>
                <li><Link to="/contact">{t('nav.contact')}</Link></li>
              </ul>
            </div>

            {/* Col 4: Legal */}
            <div className="footer-col">
              <div className="footer-col-heading">Legal</div>
              <ul className="footer-links">
                <li><Link to="/privacy">Privacy policy</Link></li>
                <li><Link to="/terms">Terms</Link></li>
                <li><Link to="/refund">Refund policy</Link></li>
                <li><Link to="/accessibility">Accessibility</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom-wrapper">
          <div className="footer-bottom">
            <div className="footer-bottom-left">
              <span>© {new Date().getFullYear()} {siteName}.</span>
              {registrationDisclosure && (
                <span
                  className="footer-registration"
                  role="note"
                  data-testid="footer-registration-disclosure"
                  data-registration-status={registration?.status ?? 'LOADING'}
                >
                  {' '}{registrationDisclosure}
                  {registration?.status === 'APPROVED' && registration.registrationNumber && (
                    <span className="registration-number"> · Reg. no. {registration.registrationNumber}</span>
                  )}
                </span>
              )}
            </div>
            <div className="footer-bottom-right">
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
              <span className="made-in-india">Made with <span className="heart-saffron">♥</span> in India</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══════ MOBILE STICKY DONATE BAR ═══════ */}
      <div className="mobile-donate-bar">
        <a href="#donate" className="mobile-donate-btn" onClick={handleDonateClick}>
          Donate now · from ₹500 <ArrowIcon size={18} />
        </a>
      </div>

      <FeaturedCampaignModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
