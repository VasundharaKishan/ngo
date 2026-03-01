import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useSiteName } from '../contexts/ConfigContext';
import './AboutPage.css';

export default function AboutPage() {
  const siteName = useSiteName();

  return (
    <div className="about-page" data-testid="about-page">
      <Helmet>
        <title>About Us | {siteName}</title>
        <meta name="description" content={`Learn about ${siteName} — our mission, values, and the communities we serve.`} />
        <meta property="og:title" content={`About Us | ${siteName}`} />
      </Helmet>

      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-inner">
          <h1>Our Story</h1>
          <p>
            {siteName} was founded with a simple belief: that every community deserves access to
            education, healthcare, and opportunity — regardless of geography or circumstance.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="about-section about-mission">
        <div className="about-container">
          <div className="mission-grid">
            <div className="mission-card">
              <span className="mission-icon" aria-hidden="true">🎯</span>
              <h2>Our Mission</h2>
              <p>
                To empower underserved communities through transparent, accountable,
                and impactful philanthropic initiatives — ensuring every donated rupee
                or dollar reaches the people who need it most.
              </p>
            </div>
            <div className="mission-card">
              <span className="mission-icon" aria-hidden="true">🌍</span>
              <h2>Our Vision</h2>
              <p>
                A world where access to education, clean water, nutrition, and healthcare
                is a reality for every child and family — not a privilege of geography or wealth.
              </p>
            </div>
            <div className="mission-card">
              <span className="mission-icon" aria-hidden="true">💎</span>
              <h2>Our Values</h2>
              <p>
                Transparency in every transaction. Accountability to our donors and beneficiaries.
                Partnership with local communities. Impact measured by lives changed, not funds raised.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="about-section about-how-it-works">
        <div className="about-container">
          <h2 className="section-title">How Your Donation Works</h2>
          <p className="section-subtitle">
            From your heart to the people who need it — a fully transparent process.
          </p>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon" aria-hidden="true">❤️</div>
              <h3>You Choose & Donate</h3>
              <p>
                Browse our campaigns, pick a cause that resonates with you, and donate securely
                via Stripe. One-time or monthly — every contribution counts.
              </p>
            </div>
            <div className="step-connector" aria-hidden="true">→</div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon" aria-hidden="true">📋</div>
              <h3>We Allocate & Execute</h3>
              <p>
                100% of your donation goes directly to the campaign. Our team works with
                vetted local partners to execute the project with full documentation.
              </p>
            </div>
            <div className="step-connector" aria-hidden="true">→</div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon" aria-hidden="true">🌟</div>
              <h3>Community Benefits</h3>
              <p>
                Real people receive real help. We report back with outcomes, photos,
                and impact data so you know exactly what your generosity achieved.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Where we work */}
      <section className="about-section about-where">
        <div className="about-container">
          <h2 className="section-title">Where We Work</h2>
          <p className="section-subtitle">
            Currently focused on India and Ireland, with plans to expand responsibly.
          </p>
          <div className="where-grid">
            <div className="where-card">
              <span className="where-flag" aria-hidden="true">🇮🇳</span>
              <h3>India</h3>
              <p>
                Education initiatives, school construction, scholarship programs for girls,
                nutrition projects, and clean water access in rural communities.
              </p>
            </div>
            <div className="where-card">
              <span className="where-flag" aria-hidden="true">🇮🇪</span>
              <h3>Ireland</h3>
              <p>
                Community development, social inclusion programs, and support for
                vulnerable families across urban and rural regions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Transparency */}
      <section className="about-section about-trust">
        <div className="about-container">
          <h2 className="section-title">Why Trust Us</h2>
          <div className="trust-grid">
            <div className="trust-item-card">
              <span className="trust-icon" aria-hidden="true">🔒</span>
              <h3>Secure Payments</h3>
              <p>All donations processed via Stripe — PCI-DSS compliant and fully encrypted.</p>
            </div>
            <div className="trust-item-card">
              <span className="trust-icon" aria-hidden="true">🏛️</span>
              <h3>Registered NGO</h3>
              <p>Legally registered non-governmental organisation with full statutory compliance.</p>
            </div>
            <div className="trust-item-card">
              <span className="trust-icon" aria-hidden="true">💯</span>
              <h3>Zero Admin Fees</h3>
              <p>100% of your donation reaches the campaign. We are volunteer-driven at the core.</p>
            </div>
            <div className="trust-item-card">
              <span className="trust-icon" aria-hidden="true">📋</span>
              <h3>Annual Reports</h3>
              <p>We publish annual impact reports detailing where every penny went and the outcomes achieved.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="about-container">
          <h2>Ready to Make a Difference?</h2>
          <p>Browse our active campaigns and support a cause that matters to you.</p>
          <div className="about-cta-buttons">
            <Link to="/campaigns" className="btn-about-primary">
              Browse Campaigns
            </Link>
            <Link to="/contact" className="btn-about-secondary">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
