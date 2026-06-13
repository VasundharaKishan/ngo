import { useState, useEffect, useMemo } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCurrencySymbol } from '../utils/currency';
import { DONATION } from '../config/constants';
import logger from '../utils/logger';
import './Layout.css';
import '../styles/ui-polish.css';
import FeaturedCampaignModal from './FeaturedCampaignModal';
import ErrorBoundary from './ErrorBoundary';
import AnnouncementBar from './AnnouncementBar';
import { useSiteName, useSiteLogo } from '../contexts/ConfigContext';
import { useRegistrationInfo, footerDisclosureFor } from '../hooks/useRegistrationInfo';
import { useDonationPresets } from '../hooks/useDonationPresets';
import { API_BASE_URL } from '../api';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';

interface SocialMediaLink {
  platform: string;
  url: string;
}

interface FooterConfig {
  tagline?: string;
  copyrightText?: string;
  disclaimerText?: string;
  socialMedia?: Record<string, string>;
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

/* ── Derive a two-line logo name from the full site name ── */
function splitLogoName(name: string): [string, string] {
  const words = name.trim().split(/\s+/);
  if (words.length <= 1) return [name, ''];
  if (words.length === 2) return [words[0], words[1]];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

/* ── Derive initials (up to 2) from site name ── */
function logoInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase();
}

/* ── Interpolate {year} and {siteName} in footer template strings ── */
function interpolateFooterText(template: string, siteName: string): string {
  return template
    .replace(/\{year\}/g, String(new Date().getFullYear()))
    .replace(/\{siteName\}/g, siteName);
}

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
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([]);
  const [footerConfig, setFooterConfig] = useState<FooterConfig>({});
  const [footerLoading, setFooterLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');

  const siteName = useSiteName();
  const logoUrl = useSiteLogo();
  const registration = useRegistrationInfo();
  const registrationDisclosure = footerDisclosureFor(registration);
  const { data: presetsData } = useDonationPresets();

  /* ── Derive logo display parts from site name ── */
  const [logoLine1, logoLine2] = useMemo(() => splitLogoName(siteName), [siteName]);
  const initials = useMemo(() => logoInitials(siteName), [siteName]);

  /* ── Minimum donation amount for mobile sticky bar (from presets API) ── */
  const minPresetAmount = useMemo(() => {
    if (!presetsData?.presets?.length) return null;
    const min = Math.min(...presetsData.presets.map(p => p.amountMinorUnits));
    const sym = getCurrencySymbol(DONATION.CURRENCY);
    return min > 0 ? `${sym}${(min / 100).toLocaleString()}` : null;
  }, [presetsData]);

  /* ── Footer copyright / disclaimer with template interpolation ── */
  const copyrightLine = useMemo(() => {
    if (footerConfig.copyrightText) {
      return interpolateFooterText(footerConfig.copyrightText, siteName);
    }
    return `© ${new Date().getFullYear()} ${siteName}.`;
  }, [footerConfig.copyrightText, siteName]);

  const disclaimerLine = useMemo(() => {
    if (footerConfig.disclaimerText) {
      return interpolateFooterText(footerConfig.disclaimerText, siteName);
    }
    return null;
  }, [footerConfig.disclaimerText, siteName]);

  /* ── data fetching ── */
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
          const data: FooterConfig & { socialMedia?: Record<string, string> } = await response.json();
          setFooterConfig(data);
          if (data.socialMedia) {
            const order = ['facebook', 'twitter', 'instagram', 'youtube', 'linkedin'];
            const links: SocialMediaLink[] = order
              .filter(p => data.socialMedia![p])
              .map(p => ({ platform: p.charAt(0).toUpperCase() + p.slice(1), url: data.socialMedia![p] }));
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

  /* ── Logo block shared between header and footer ── */
  const LogoMark = ({ small = false }: { small?: boolean }) => (
    <>
      {logoUrl ? (
        <img src={logoUrl} alt={`${siteName} logo`} className={small ? 'footer-logo-img' : 'logo-img'} />
      ) : (
        <div className={small ? 'logo-mark logo-mark--sm' : 'logo-mark'} aria-hidden="true">
          {initials}
        </div>
      )}
      <div className="logo-text">
        <span className="logo-text-name">{logoLine1}</span>
        {logoLine2 && <span className="logo-text-sub">{logoLine2}</span>}
      </div>
    </>
  );

  /* ── render ── */
  return (
    <div className="layout">
      <AnnouncementBar />
      {showBanner && bannerMessage && (
        <div className="dev-banner">
          <span>🚧 {bannerMessage}</span>
        </div>
      )}

      <a href="#main-content" className="skip-to-content">
        {t('footer.skipToContent')}
      </a>

      {/* ═══════ HEADER ═══════ */}
      <header data-testid="site-header" className="header" role="banner">
        <div className="header-inner">
          {/* Logo block — derived from admin site name */}
          <Link to="/" className="site-logo" aria-label="Home" onClick={closeMobileMenu}>
            <LogoMark />
          </Link>

          {/* Desktop nav */}
          <nav className="nav-desktop" role="navigation" aria-label="Main navigation">
            <Link to="/campaigns" className="nav-link">{t('nav.campaigns')}</Link>
            <Link to="/impact" className="nav-link">{t('nav.impact')}</Link>
            <Link to="/transparency" className="nav-link">{t('nav.transparency')}</Link>
            <Link to="/about" className="nav-link">{t('nav.about')}</Link>
            <Link to="/faq" className="nav-link">FAQ</Link>
            <Link to="/contact" className="nav-link">{t('nav.contact')}</Link>
          </nav>

          <div className="header-actions">
            <a
              href="#donate"
              className="btn-donate-header"
              onClick={handleDonateClick}
              aria-label="Open donation form"
            >
              {t('nav.donate')} <ArrowIcon />
            </a>
            {/* Mobile hamburger */}
            <button
              className="btn-hamburger"
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label={mobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
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
            <Link to="/impact" className="nav-mobile-link" onClick={closeMobileMenu}>{t('nav.impact')}</Link>
            <Link to="/transparency" className="nav-mobile-link" onClick={closeMobileMenu}>{t('nav.transparency')}</Link>
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

      {/* ═══════ FOOTER ═══════ */}
      <footer className="footer" role="contentinfo">
        <div className="footer-grid-wrapper">
          <div className="footer-grid">
            {/* Col 1: Logo + tagline */}
            <div className="footer-brand">
              <Link to="/" className="footer-logo" aria-label="Home">
                <LogoMark small />
              </Link>
              <p className="footer-tagline">
                {footerConfig.tagline || ''}
              </p>
            </div>

            {/* Col 2: Give */}
            <div className="footer-col">
              <div className="footer-col-heading">{t('footer.giveHeading')}</div>
              <ul className="footer-links">
                <li><a href="#donate" onClick={handleDonateClick}>{t('footer.donateOnce')}</a></li>
                <li><a href="#donate" onClick={handleDonateClick}>{t('footer.giveMonthly')}</a></li>
                <li><Link to="/campaigns">{t('footer.allCampaigns')}</Link></li>
                <li><Link to="/contact">{t('footer.corporateCsr')}</Link></li>
              </ul>
            </div>

            {/* Col 3: About */}
            <div className="footer-col">
              <div className="footer-col-heading">{t('footer.aboutHeading')}</div>
              <ul className="footer-links">
                <li><Link to="/about">{t('footer.ourStory')}</Link></li>
                <li><Link to="/impact">{t('footer.ourImpact')}</Link></li>
                <li><Link to="/transparency">{t('footer.annualReports')}</Link></li>
                <li><Link to="/faq">FAQ</Link></li>
                <li><Link to="/contact">{t('nav.contact')}</Link></li>
              </ul>
            </div>

            {/* Col 4: Legal */}
            <div className="footer-col">
              <div className="footer-col-heading">{t('footer.legalHeading')}</div>
              <ul className="footer-links">
                <li><Link to="/privacy">{t('footer.privacyPolicy')}</Link></li>
                <li><Link to="/terms">{t('footer.terms')}</Link></li>
                <li><Link to="/refund">{t('footer.refundPolicy')}</Link></li>
                <li><Link to="/accessibility">{t('footer.accessibility')}</Link></li>
                <li><Link to="/cookies">{t('footer.cookiesPolicy', 'Cookies')}</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom-wrapper">
          <div className="footer-bottom">
            <div className="footer-bottom-left">
              {/* Copyright — from admin footer settings, with {year}/{siteName} interpolated */}
              <span>{copyrightLine}</span>
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
              {/* Disclaimer — from admin footer settings */}
              {disclaimerLine && (
                <span className="footer-disclaimer">{' · '}{disclaimerLine}</span>
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
          {minPresetAmount
            ? `${t('nav.donate')} · from ${minPresetAmount}`
            : t('nav.donate')}{' '}
          <ArrowIcon size={18} />
        </a>
      </div>

      <FeaturedCampaignModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
