/**
 * Standalone Transparency page at {@code /transparency}.
 *
 * <p>This page is intentionally meaningful at every registration stage. It openly
 * states what is and is not yet in place, rather than hiding the foundation's
 * status. Three blocks:</p>
 * <ol>
 *   <li><b>Registration status</b> — pulled from {@code useRegistrationInfo}. Shows
 *       the current stage (UNREGISTERED / APPLIED / APPROVED), the registered number
 *       once approved, and active 80G / FCRA badges. Defence-in-depth: the backend
 *       only emits {@code registrationNumber} when status is APPROVED.</li>
 *   <li><b>Documents</b> — pulled from {@code useTransparencyDocuments}. Grouped by
 *       free-text category. Each row links externally to a public file (Drive /
 *       Dropbox / static site); the foundation chooses where to host.</li>
 *   <li><b>What's still pending</b> — a static honesty note that names the things a
 *       brand-new community foundation typically lacks until it formalises (audited
 *       financials, 80G certificate, FCRA, etc.). Reduces "where's X?" friction.</li>
 * </ol>
 */
import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useSiteName } from '../contexts/ConfigContext';
import { useRegistrationInfo, type PublicRegistrationStatus } from '../hooks/useRegistrationInfo';
import {
  useTransparencyDocuments,
  type PublicTransparencyDocument,
} from '../hooks/useTransparencyDocuments';
import './TransparencyPage.css';

const UNCATEGORISED = 'Other documents';

interface CategoryGroup {
  category: string;
  documents: PublicTransparencyDocument[];
}

function groupByCategory(documents: PublicTransparencyDocument[]): CategoryGroup[] {
  const order: string[] = [];
  const buckets = new Map<string, PublicTransparencyDocument[]>();
  for (const d of documents) {
    const key = d.category && d.category.trim() ? d.category.trim() : UNCATEGORISED;
    if (!buckets.has(key)) {
      buckets.set(key, []);
      order.push(key);
    }
    buckets.get(key)!.push(d);
  }
  return order.map((category) => ({ category, documents: buckets.get(category)! }));
}

const STATUS_HEADLINE: Record<PublicRegistrationStatus, string> = {
  UNREGISTERED: 'Community-led, not yet registered',
  APPLIED: 'Section 8 application filed — awaiting approval',
  APPROVED: 'Registered under Section 8 of the Companies Act, 2013',
};

const STATUS_BLURB: Record<PublicRegistrationStatus, string> = {
  UNREGISTERED:
    'We are operating as an informal community foundation while the legal entity is being prepared. Donations made today are recorded as community contributions and are not eligible for tax exemption.',
  APPLIED:
    'Our Section 8 (Companies Act, 2013) registration has been filed and is under review. Until the certificate is issued, donations are not yet eligible for 80G tax exemption.',
  APPROVED:
    'We are a registered Section 8 company. Operational, governance and financial documents are listed below as they become available.',
};

function formatIssuedDate(iso: string | null, periodLabel: string | null): string | null {
  if (periodLabel && periodLabel.trim()) return periodLabel.trim();
  if (!iso) return null;
  // YYYY-MM-DD → DD MMM YYYY (locale-safe; no Date parsing surprises)
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = parseInt(m, 10) - 1;
  if (monthIdx < 0 || monthIdx > 11) return iso;
  return `${parseInt(d, 10)} ${months[monthIdx]} ${y}`;
}

export default function TransparencyPage() {
  const siteName = useSiteName();
  const registration = useRegistrationInfo();
  const { loading: documentsLoading, documents } = useTransparencyDocuments();

  const groups = useMemo(
    () => (documents ? groupByCategory(documents) : []),
    [documents],
  );

  const status: PublicRegistrationStatus = registration?.status ?? 'UNREGISTERED';

  return (
    <div className="transparency-page" data-testid="transparency-page">
      <Helmet>
        <title>Transparency &amp; accountability | {siteName}</title>
        <meta
          name="description"
          content={`Registration status, governance documents, and operational disclosures for ${siteName}.`}
        />
        <meta property="og:title" content={`Transparency | ${siteName}`} />
      </Helmet>

      <header className="tx-hero">
        <div className="tx-container">
          <p className="tx-hero-eyebrow">Accountability</p>
          <h1>Transparency &amp; disclosures</h1>
          <p className="tx-hero-sub">
            Where {siteName} stands today — legally, financially, and operationally.
            We publish what exists and openly note what does not yet.
          </p>
        </div>
      </header>

      <section className="tx-section tx-status-section">
        <div className="tx-container">
          <div
            className={`tx-status tx-status--${status.toLowerCase()}`}
            data-testid="tx-registration-status"
          >
            <div className="tx-status-head">
              <span className={`tx-status-pill tx-status-pill--${status.toLowerCase()}`}>
                {status}
              </span>
              <h2>{STATUS_HEADLINE[status]}</h2>
            </div>
            <p className="tx-status-blurb">{STATUS_BLURB[status]}</p>

            {registration?.registrationNumber && (
              <dl className="tx-status-meta">
                <div>
                  <dt>Registration number</dt>
                  <dd>{registration.registrationNumber}</dd>
                </div>
              </dl>
            )}

            <ul className="tx-status-badges">
              <li
                className={
                  registration?.eightyGActive ? 'tx-badge tx-badge--on' : 'tx-badge tx-badge--off'
                }
              >
                <strong>80G tax exemption</strong>
                <span>{registration?.eightyGActive ? 'Active — donations eligible' : 'Not yet available'}</span>
              </li>
              <li
                className={
                  registration?.fcraActive ? 'tx-badge tx-badge--on' : 'tx-badge tx-badge--off'
                }
              >
                <strong>FCRA (foreign donations)</strong>
                <span>{registration?.fcraActive ? 'Active' : 'Not yet available'}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="tx-section tx-documents-section">
        <div className="tx-container">
          <h2 className="tx-section-title">Published documents</h2>
          <p className="tx-section-sub">
            All documents below open in a new tab. We host them on external services
            so anyone can verify the source.
          </p>

          {documentsLoading && (
            <p className="tx-loading" role="status">Loading documents…</p>
          )}

          {!documentsLoading && documents === null && (
            <div className="tx-error" role="alert">
              <strong>We couldn't load the document list right now.</strong>
              <p>Please refresh the page in a moment, or contact us directly.</p>
            </div>
          )}

          {!documentsLoading && documents !== null && documents.length === 0 && (
            <div className="tx-empty">
              <strong>No documents have been published yet.</strong>
              <p>
                As governance and financial documents become available, they will be
                listed here. Reach out via the{' '}
                <Link to="/contact">Contact page</Link> if you need something specific.
              </p>
            </div>
          )}

          {!documentsLoading &&
            groups.map((group) => (
              <section key={group.category} className="tx-doc-group">
                <h3 className="tx-doc-group-title">{group.category}</h3>
                <ul className="tx-doc-list">
                  {group.documents.map((doc) => {
                    const issued = formatIssuedDate(doc.issuedDate, doc.periodLabel);
                    return (
                      <li key={doc.id} className="tx-doc-item">
                        <a
                          href={doc.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tx-doc-link"
                          data-testid={`tx-doc-${doc.id}`}
                        >
                          <div className="tx-doc-text">
                            <strong className="tx-doc-title">{doc.title}</strong>
                            {doc.description && (
                              <span className="tx-doc-desc">{doc.description}</span>
                            )}
                            {issued && <span className="tx-doc-period">{issued}</span>}
                          </div>
                          <span className="tx-doc-arrow" aria-hidden="true">↗</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
        </div>
      </section>

      <section className="tx-section tx-pending-section">
        <div className="tx-container">
          <h2 className="tx-section-title">What's still pending</h2>
          <p className="tx-section-sub">
            We would rather name what is missing than leave you to guess. These items
            will appear above as they are completed.
          </p>
          <ul className="tx-pending-list">
            {!registration?.eightyGActive && (
              <li>
                <strong>80G tax-exemption certificate</strong>
                <span>
                  Until issued, donations cannot be claimed as tax-deductible under
                  Section 80G of the Income Tax Act.
                </span>
              </li>
            )}
            {!registration?.fcraActive && (
              <li>
                <strong>FCRA registration</strong>
                <span>
                  We are not currently authorised to receive foreign donations.
                  Donations from outside India should be paused until this is in place.
                </span>
              </li>
            )}
            <li>
              <strong>Audited annual financials</strong>
              <span>
                The first year-end audit will be published here once it is complete
                and signed off.
              </span>
            </li>
            <li>
              <strong>Programme outcome reports</strong>
              <span>
                We will publish programme outcomes annually, with beneficiary numbers
                and spending breakdowns, once a full programme cycle has run.
              </span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
