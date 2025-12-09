import './LegalPage.css';

export default function CookiesPage() {
  return (
    <div className="legal-page">
      <h1>Cookie Policy</h1>
      <p className="last-updated">Last Updated: December 2024</p>

      <section>
        <h2>What Are Cookies</h2>
        <p>
          Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.
        </p>
      </section>

      <section>
        <h2>How We Use Cookies</h2>
        <p>
          We use cookies for several reasons:
        </p>
        <ul>
          <li>To remember your preferences and settings</li>
          <li>To understand how you use our website</li>
          <li>To improve our website and services</li>
          <li>To enable donation functionality</li>
          <li>To provide security features</li>
        </ul>
      </section>

      <section>
        <h2>Types of Cookies We Use</h2>
        
        <h3>Essential Cookies</h3>
        <p>
          These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.
        </p>

        <h3>Analytics Cookies</h3>
        <p>
          These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website.
        </p>

        <h3>Functionality Cookies</h3>
        <p>
          These cookies allow the website to remember choices you make (such as your preferred language) and provide enhanced, more personal features.
        </p>

        <h3>Payment Cookies</h3>
        <p>
          We use cookies in conjunction with Stripe to securely process your donations. These cookies are essential for payment processing.
        </p>
      </section>

      <section>
        <h2>Third-Party Cookies</h2>
        <p>
          Some cookies are placed by third-party services that appear on our pages. We use:
        </p>
        <ul>
          <li>Stripe for payment processing</li>
          <li>Analytics services to understand website usage</li>
        </ul>
        <p>
          These third parties have their own privacy policies and cookie policies.
        </p>
      </section>

      <section>
        <h2>Managing Cookies</h2>
        <p>
          Most web browsers allow you to control cookies through their settings. You can:
        </p>
        <ul>
          <li>View what cookies are stored and delete them individually</li>
          <li>Block third-party cookies</li>
          <li>Block all cookies from specific websites</li>
          <li>Block all cookies from being set</li>
          <li>Delete all cookies when you close your browser</li>
        </ul>
        <p>
          Please note that deleting or blocking cookies may impact your experience on our website and some features may not function properly.
        </p>
      </section>

      <section>
        <h2>Your Consent</h2>
        <p>
          By continuing to use our website, you consent to our use of cookies as described in this policy. You can withdraw your consent at any time by deleting cookies from your browser.
        </p>
      </section>

      <section>
        <h2>Updates to This Policy</h2>
        <p>
          We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.
        </p>
      </section>

      <section>
        <h2>Contact Us</h2>
        <p>
          If you have questions about our use of cookies, please contact us at{' '}
          <a href="mailto:privacy@myfoundation.org">privacy@myfoundation.org</a>.
        </p>
      </section>
    </div>
  );
}
