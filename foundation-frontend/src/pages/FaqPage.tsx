/**
 * Standalone FAQ page at {@code /faq}. Renders enabled FAQs grouped by their
 * free-text {@code category} field, each as a native {@code <details>} element so
 * accordion behaviour, keyboard control, and accessibility come for free.
 *
 * <p>Uses {@code <details>} rather than a custom collapsible widget so the page
 * remains keyboard-navigable, screen-reader-friendly, and printable without any
 * client-side JS (the hook still gates initial paint on the fetch, but once data is
 * present the markup is plain HTML).</p>
 *
 * <p>Categories preserve admin-defined order: the first appearance of each category
 * (in the array as returned by the API, which is sort_order ascending) sets that
 * category's position. Ungrouped FAQs (category = null) appear under "General".</p>
 */
import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useSiteName } from '../contexts/ConfigContext';
import { useFaqs, type PublicFaq } from '../hooks/useFaqs';
import './FaqPage.css';

const GENERAL_CATEGORY = 'General';

interface CategoryGroup {
  category: string;
  faqs: PublicFaq[];
}

function groupByCategory(faqs: PublicFaq[]): CategoryGroup[] {
  const order: string[] = [];
  const buckets = new Map<string, PublicFaq[]>();
  for (const f of faqs) {
    const key = f.category && f.category.trim() ? f.category.trim() : GENERAL_CATEGORY;
    if (!buckets.has(key)) {
      buckets.set(key, []);
      order.push(key);
    }
    buckets.get(key)!.push(f);
  }
  return order.map((category) => ({ category, faqs: buckets.get(category)! }));
}

export default function FaqPage() {
  const siteName = useSiteName();
  const { loading, faqs } = useFaqs();

  const groups = useMemo(() => (faqs ? groupByCategory(faqs) : []), [faqs]);

  return (
    <div className="faq-page" data-testid="faq-page">
      <Helmet>
        <title>Frequently asked questions | {siteName}</title>
        <meta
          name="description"
          content={`Frequently asked questions about ${siteName} — donations, programmes, and how to get involved.`}
        />
        <meta property="og:title" content={`Frequently asked questions | ${siteName}`} />
      </Helmet>

      <header className="faq-hero">
        <div className="faq-container">
          <h1>Frequently asked questions</h1>
          <p className="faq-hero-sub">
            Short answers to the questions donors and volunteers ask most often. Can't
            find what you're looking for?{' '}
            <Link to="/contact">Get in touch</Link> and we'll reply within a week.
          </p>
        </div>
      </header>

      <section className="faq-section">
        <div className="faq-container">
          {loading && (
            <p className="faq-loading" role="status">Loading…</p>
          )}

          {!loading && faqs === null && (
            <div className="faq-error" role="alert">
              <strong>We couldn't load the FAQ list right now.</strong>
              <p>Please refresh the page in a moment, or contact us directly.</p>
            </div>
          )}

          {!loading && faqs !== null && faqs.length === 0 && (
            <div className="faq-empty">
              <strong>No FAQs published yet.</strong>
              <p>
                We're still preparing answers. In the meantime, please reach out via the{' '}
                <Link to="/contact">Contact page</Link>.
              </p>
            </div>
          )}

          {!loading &&
            groups.map((group) => (
              <section key={group.category} className="faq-group">
                <h2 className="faq-group-title">{group.category}</h2>
                <ul className="faq-list">
                  {group.faqs.map((f) => (
                    <li key={f.id} className="faq-item">
                      <details className="faq-details">
                        <summary className="faq-summary">
                          <span className="faq-summary-text">{f.question}</span>
                          <span className="faq-summary-icon" aria-hidden="true">+</span>
                        </summary>
                        <div className="faq-answer">
                          {f.answer.split(/\n{2,}/).map((para, i) => (
                            <p key={i}>{para}</p>
                          ))}
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      </section>
    </div>
  );
}
