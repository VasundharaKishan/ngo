import './LegalPage.css';

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <h1>Privacy Statement</h1>
      <p className="last-updated">Last Updated: December 2024</p>

      <section>
        <h2>1. Information We Collect</h2>
        <p>
          We collect information you provide directly to us, including your name, email address, payment information, and any other information you choose to provide when making a donation or contacting us.
        </p>
      </section>

      <section>
        <h2>2. How We Use Your Information</h2>
        <p>
          We use the information we collect to:
        </p>
        <ul>
          <li>Process your donations and send donation receipts</li>
          <li>Communicate with you about our programs and campaigns</li>
          <li>Improve our website and services</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      <section>
        <h2>3. Information Sharing</h2>
        <p>
          We do not sell, trade, or otherwise transfer your personally identifiable information to third parties. We may share information with trusted service providers who assist us in operating our website and conducting our operations, provided they agree to keep this information confidential.
        </p>
      </section>

      <section>
        <h2>4. Payment Security</h2>
        <p>
          All payment transactions are processed through Stripe, a secure payment gateway. We do not store your complete credit card information on our servers.
        </p>
      </section>

      <section>
        <h2>5. Cookies and Tracking</h2>
        <p>
          We use cookies and similar tracking technologies to enhance your experience on our website. You can control cookie preferences through your browser settings. For more information, see our{' '}
          <a href="/cookies">Cookie Policy</a>.
        </p>
      </section>

      <section>
        <h2>6. Your Rights</h2>
        <p>
          You have the right to:
        </p>
        <ul>
          <li>Access the personal information we hold about you</li>
          <li>Request correction of inaccurate information</li>
          <li>Request deletion of your personal information</li>
          <li>Opt-out of marketing communications</li>
        </ul>
      </section>

      <section>
        <h2>7. Data Retention</h2>
        <p>
          We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy statement, unless a longer retention period is required by law.
        </p>
      </section>

      <section>
        <h2>Contact Us</h2>
        <p>
          If you have questions about this Privacy Statement or want to exercise your privacy rights, please contact us at{' '}
          <a href="mailto:privacy@myfoundation.org">privacy@myfoundation.org</a>.
        </p>
      </section>
    </div>
  );
}
