import './LegalPage.css';

export default function TermsPage() {
  return (
    <div className="legal-page">
      <h1>Terms and Conditions</h1>
      <p className="last-updated">Last Updated: December 2024</p>

      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using the Yugal Savitri Seva Foundation website, you accept and agree to be bound by the terms and provisions of this agreement.
        </p>
      </section>

      <section>
        <h2>2. Use of Donations</h2>
        <p>
          All donations made through this platform will be used for the stated charitable purposes. We reserve the right to redirect funds to similar programs if the original campaign is fully funded or no longer operational.
        </p>
      </section>

      <section>
        <h2>3. Donation Policy</h2>
        <p>
          Donations are generally non-refundable. However, if you believe a mistake was made, please contact us within 30 days at{' '}
          <a href="mailto:donate@yugalsavitriseva.org">donate@yugalsavitriseva.org</a>.
        </p>
      </section>

      <section>
        <h2>4. User Conduct</h2>
        <p>
          You agree not to use the website for any unlawful purpose or in any way that could damage, disable, overburden, or impair the website.
        </p>
      </section>

      <section>
        <h2>5. Intellectual Property</h2>
        <p>
          All content on this website, including text, graphics, logos, and images, is the property of Yugal Savitri Seva Foundation and protected by copyright laws.
        </p>
      </section>

      <section>
        <h2>6. Limitation of Liability</h2>
        <p>
          Yugal Savitri Seva Foundation shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the website.
        </p>
      </section>

      <section>
        <h2>7. Changes to Terms</h2>
        <p>
          We reserve the right to modify these terms at any time. Continued use of the website after changes constitutes acceptance of the new terms.
        </p>
      </section>

      <section>
        <h2>Contact Us</h2>
        <p>
          If you have questions about these Terms and Conditions, please contact us at{' '}
          <a href="mailto:legal@yugalsavitriseva.org">legal@yugalsavitriseva.org</a>.
        </p>
      </section>
    </div>
  );
}
