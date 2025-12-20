import { type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import './Layout.css';
import FeaturedCampaignModal from './FeaturedCampaignModal';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDonateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <Link to="/" className="logo">
            <h1>Hope Foundation</h1>
          </Link>
          <nav className="nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/campaigns" className="nav-link">Campaigns</Link>
            <a href="#" className="btn-donate-header btn-hero" onClick={handleDonateClick}>Donate Now</a>
          </nav>
        </div>
      </header>

      <main className="main">
        {children}
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Hope Foundation</h3>
              <p className="footer-tagline">Empowering communities worldwide through compassion and action.</p>
              <div className="social-links">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">𝕏</a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">⊕</a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">▶</a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">in</a>
              </div>
            </div>

            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/campaigns">All Campaigns</Link></li>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/impact">Our Impact</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Get Involved</h4>
              <ul>
                <li><a href="#" onClick={handleDonateClick}>Make a Donation</a></li>
                <li><Link to="/volunteer">Volunteer</Link></li>
                <li><Link to="/partner">Corporate Partners</Link></li>
                <li><Link to="/fundraise">Start Fundraising</Link></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Contact</h4>
              <p>Email: contact@hopefoundation.org</p>
              <p>Phone: +1 (555) 123-4567</p>
              <p>Address: 123 Charity Lane, Global City</p>
              <div className="certifications">
                <span className="cert-badge">501(c)(3)</span>
                <span className="cert-badge">4-Star Charity</span>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="legal-links">
              <Link to="/terms">Terms and Conditions</Link>
              <span>•</span>
              <Link to="/privacy">Privacy Statement</Link>
              <span>•</span>
              <Link to="/accessibility">Accessibility</Link>
              <span>•</span>
              <Link to="/cookies">Cookie Policy</Link>
              <span>•</span>
              <button className="cookie-manage" onClick={() => alert('Cookie preferences panel would open here')}>Manage My Cookies</button>
            </div>
            <p className="copyright">© 2025 Hope Foundation. All rights reserved. Registered Charity #12-3456789</p>
            <p className="disclaimer">Hope Foundation is a registered 501(c)(3) nonprofit organization. Donations are tax-deductible to the extent permitted by law.</p>
          </div>
        </div>
      </footer>

      <FeaturedCampaignModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
