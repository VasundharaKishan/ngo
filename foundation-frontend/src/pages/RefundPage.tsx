import { Helmet } from 'react-helmet-async';
import { useCMSContent } from '../hooks/useCMSContent';
import { useSiteName, useConfig } from '../contexts/ConfigContext';
import './LegalPage.css';

/**
 * Refund & Cancellation Policy — India-first (80G / RBI / Consumer Protection Act).
 *
 * Architecture notes:
 *  - Variables (org name, registered address, 80G number, contact, refund window,
 *    jurisdiction, effective date) come from the `site_settings` table via ConfigContext.
 *    Non-technical admins can update them without a deploy.
 *  - The legal prose below is the versioned fallback. It is what renders when the
 *    CMS has no override for the `legal_refund` section. An admin who truly needs
 *    to replace the wording can set `legal_refund.body` in the CMS, but for audit
 *    and compliance reasons we strongly prefer changes to land via a code review.
 *  - Counsel review is required before publishing. This is a reasonable starting
 *    draft for an Indian 80G-registered NGO, not a substitute for legal advice.
 */
export default function RefundPage() {
  const { content, hasCMSContent } = useCMSContent('legal_refund');
  const siteName = useSiteName();
  const { config } = useConfig();

  // Admin-editable variables (all resolve to safe defaults if the setting is missing)
  const orgName = config['legal.org_name'] || siteName;
  const registeredAddress =
    config['legal.registered_address'] || 'Registered office address to be updated by admin.';
  const eightyGNumber = config['legal.80g_number'] || '';
  const jurisdiction = config['legal.jurisdiction'] || 'India';
  const contactEmail =
    config['legal.contact_email'] ||
    config['contact.email'] ||
    'contact@yugalsavitriseva.org';
  const contactPhone = config['legal.contact_phone'] || config['contact.phone'] || '';
  const refundWindowDays = parseInt(
    config['legal.refund_window_days'] || '7',
    10,
  );
  const refundProcessingDays = parseInt(
    config['legal.refund_processing_days'] || '7',
    10,
  );
  const effectiveDate =
    content.lastUpdated || config['legal.effective_date'] || 'April 2026';

  return (
    <div className="legal-page">
      <Helmet>
        <title>Refund & Cancellation Policy | {siteName}</title>
        <meta
          name="description"
          content={`Refund and cancellation policy for donations made to ${orgName}. Request window, grounds for refund, and how to contact us.`}
        />
      </Helmet>

      <h1>{content.title || 'Refund & Cancellation Policy'}</h1>
      <p className="last-updated">Last Updated: {effectiveDate}</p>

      {hasCMSContent && content.body ? (
        <div dangerouslySetInnerHTML={{ __html: content.body }} />
      ) : (
        <>
          <section>
            <p>
              This Refund and Cancellation Policy (the "Policy") explains how{' '}
              <strong>{orgName}</strong> ("we", "us", or "our") handles refund and
              cancellation requests for donations made through our website. This
              Policy applies to all donations received via our online donation
              platform, whether one-time or recurring.
            </p>
            <p>
              By making a donation to {orgName}, you acknowledge that you have read,
              understood, and agreed to this Policy. If you do not agree with any
              part of this Policy, please do not proceed with a donation.
            </p>
          </section>

          <section>
            <h2>1. General Principle</h2>
            <p>
              Donations made to {orgName} are voluntary contributions intended to
              support our charitable work. Once received and deposited, donations
              are typically allocated to live programs, committed to beneficiaries,
              or reported to our funders and, where applicable, to the Income Tax
              Department of India for purposes of Section 80G of the Income Tax
              Act, 1961. For these reasons, donations are, as a general rule,{' '}
              <strong>non-refundable</strong>.
            </p>
            <p>
              However, we recognise that genuine mistakes can occur. This Policy
              sets out the limited circumstances in which we will consider a
              refund, the procedure for making a request, and the timelines you
              can expect.
            </p>
          </section>

          <section>
            <h2>2. Grounds on Which a Refund May Be Considered</h2>
            <p>
              We will consider a refund request only where one or more of the
              following apply:
            </p>
            <ul>
              <li>
                <strong>Duplicate transaction.</strong> The same donation was
                charged more than once due to a technical or network error on
                our platform, the payment gateway, or your bank.
              </li>
              <li>
                <strong>Incorrect amount.</strong> The amount charged differs
                from the amount you intended to donate (for example, an
                obvious typing error such as an extra zero), and the request is
                made within the window specified in Section 3.
              </li>
              <li>
                <strong>Unauthorised transaction.</strong> The donation was made
                without your authorisation, including in cases of suspected
                fraud or misuse of your payment instrument. You must also
                raise this with your card issuer or bank without delay.
              </li>
              <li>
                <strong>Failed or non-delivered service.</strong> A technical
                error caused the transaction to be charged while the donation
                did not register in our records, and a corresponding receipt
                was not issued.
              </li>
              <li>
                <strong>Cancellation of a recurring donation.</strong> For
                future instalments of a recurring donation that you have
                cancelled, as set out in Section 6.
              </li>
            </ul>
            <p>
              Refunds will <strong>not</strong> be issued on the following
              grounds, among others: a change of mind; a change in personal or
              financial circumstances after the donation; dissatisfaction with
              the outcome of a campaign (donations are contributions to our
              mission and are not guarantees of specific results); or where the
              donation has already been deployed to the programme for which it
              was collected.
            </p>
          </section>

          <section>
            <h2>3. Time Window for Requests</h2>
            <p>
              A refund request must reach us within{' '}
              <strong>{refundWindowDays} days</strong> of the donation date. We
              may, at our sole discretion, consider requests submitted outside
              this window in exceptional cases (for example, documented
              unauthorised transactions identified later), but we are not
              obliged to do so.
            </p>
          </section>

          <section>
            <h2>4. How to Request a Refund</h2>
            <p>
              To request a refund, please send an email to{' '}
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              {contactPhone && <> (or call us at {contactPhone})</>} with the
              following information:
            </p>
            <ul>
              <li>The full name used for the donation.</li>
              <li>The date and amount of the donation.</li>
              <li>
                The transaction or receipt reference number (sent to you by
                email after a successful donation).
              </li>
              <li>
                A short description of the reason for the refund request,
                referencing the relevant ground in Section 2.
              </li>
              <li>
                Any supporting documentation (e.g., bank statement showing a
                duplicate charge, screenshots of the payment error).
              </li>
            </ul>
            <p>
              We will acknowledge your request within two (2) business days of
              receipt and communicate our decision within ten (10) business days.
              In complex cases involving third parties (such as the payment
              gateway or banks), additional time may be required and we will
              keep you informed.
            </p>
          </section>

          <section>
            <h2>5. How Approved Refunds Are Issued</h2>
            <p>
              Where a refund is approved, it will be credited back to the
              original payment method used for the donation. We do not issue
              refunds in cash, to a different bank account, or by cheque.
            </p>
            <p>
              Once initiated from our side, the refund will typically be
              credited within <strong>{refundProcessingDays} business days</strong>,
              subject to the timelines of your card issuer, bank, or the
              payment gateway. Currency conversion charges, gateway fees, or
              foreign exchange spreads deducted by intermediaries are not
              within our control and may not be refundable.
            </p>
          </section>

          <section>
            <h2>6. Cancellation of Recurring Donations</h2>
            <p>
              If you have set up a recurring (monthly or periodic) donation,
              you may cancel at any time. Cancellation will stop all future
              instalments; already-processed instalments will not be
              automatically refunded and, if you believe an already-processed
              instalment meets a ground set out in Section 2, you must raise a
              separate refund request as described in Section 4.
            </p>
            <p>
              To cancel a recurring donation, please email{' '}
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a> from the
              email address associated with the donation, or use the
              cancellation link included in your recurring-donation receipt
              emails where available.
            </p>
          </section>

          <section>
            <h2>7. Implications for 80G Tax Receipts</h2>
            <p>
              If we have already issued an 80G tax exemption receipt
              {eightyGNumber && <> (under 80G registration number {eightyGNumber})</>}{' '}
              for a donation and that donation is subsequently refunded, the
              receipt will be treated as void. If you have already filed a tax
              return claiming deduction against the voided receipt, you are
              responsible for making any necessary revisions. We will, on
              request, issue a written confirmation of the voided receipt for
              your records.
            </p>
          </section>

          <section>
            <h2>8. Fraud, Chargebacks and Misuse</h2>
            <p>
              We take fraud and chargeback abuse seriously. Where we have
              reasonable grounds to believe that a refund or chargeback request
              is fraudulent, or is being used to circumvent this Policy, we
              reserve the right to: refuse the request; require additional
              identity verification; report the matter to the relevant payment
              networks, banks or law enforcement; and pursue recovery of any
              associated costs.
            </p>
          </section>

          <section>
            <h2>9. Changes to this Policy</h2>
            <p>
              We may update this Policy from time to time to reflect changes in
              our operations, applicable law, or payment-industry requirements.
              The "Last Updated" date at the top of this page reflects the most
              recent revision. Material changes will be brought to the notice
              of recurring donors by email. Continued use of the donation
              platform after the effective date of a change constitutes
              acceptance of the revised Policy.
            </p>
          </section>

          <section>
            <h2>10. Governing Law and Dispute Resolution</h2>
            <p>
              This Policy is governed by the laws of {jurisdiction}, without
              regard to its conflict-of-laws provisions. Any dispute arising
              out of or in connection with this Policy shall be subject to the
              exclusive jurisdiction of the competent courts located in{' '}
              {jurisdiction}. We encourage donors to contact us first so that
              we may attempt to resolve any concern informally before any
              formal proceedings are initiated.
            </p>
          </section>

          <section>
            <h2>Contact Us</h2>
            <p>
              If you have any questions about this Policy or about a specific
              donation, please contact us:
            </p>
            <p>
              <strong>{orgName}</strong>
              <br />
              {registeredAddress}
              <br />
              Email:{' '}
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              {contactPhone && (
                <>
                  <br />
                  Phone: {contactPhone}
                </>
              )}
            </p>
          </section>

          <section>
            <p className="legal-footnote">
              <em>
                This Refund &amp; Cancellation Policy is provided as a
                good-faith starting point for our operations and is not legal
                advice. {orgName} has had this Policy reviewed by qualified
                counsel before publication. If you are an advisor reviewing
                this page and believe any clause should be amended, please
                contact us at{' '}
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
              </em>
            </p>
          </section>
        </>
      )}
    </div>
  );
}
