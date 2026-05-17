/**
 * Home-page FAQ teaser section. Renders a small subset of enabled FAQs (default 5)
 * as an inline accordion, with a link to the full {@code /faq} page.
 *
 * <p>Unlike the standalone page, this section never groups by category — the home
 * page is not the right surface for a long taxonomy. The {@code limit} and
 * {@code category} filter are taken from the section's {@code configJson}.</p>
 */
import { Link } from 'react-router-dom';
import { useFaqs, type PublicFaq } from '../../hooks/useFaqs';
import './FaqSection.css';

interface FaqSectionConfig {
  title?: string;
  subtitle?: string;
  /** Maximum number of FAQs to render. Defaults to 5. */
  limit?: number;
  /** If set, only FAQs whose category matches (case-insensitive) are rendered. */
  category?: string | null;
}

const DEFAULT_LIMIT = 5;

export default function FaqSection({ config }: { config: FaqSectionConfig }) {
  const { loading, faqs } = useFaqs();

  if (loading) return null;
  if (!faqs || faqs.length === 0) return null;

  const title = config.title && config.title.trim() ? config.title : 'Frequently asked questions';
  const subtitle = config.subtitle && config.subtitle.trim() ? config.subtitle : null;
  const limit = typeof config.limit === 'number' && config.limit > 0 ? config.limit : DEFAULT_LIMIT;
  const categoryFilter = config.category && config.category.trim() ? config.category.trim().toLowerCase() : null;

  const filtered: PublicFaq[] = faqs
    .filter((f) => {
      if (!categoryFilter) return true;
      const c = (f.category ?? '').trim().toLowerCase();
      return c === categoryFilter;
    })
    .slice(0, limit);

  if (filtered.length === 0) return null;

  return (
    <section className="faq-home-section" aria-labelledby="faq-home-section-title">
      <div className="faq-home-container">
        <header className="faq-home-header">
          <h2 id="faq-home-section-title" className="font-display">{title}</h2>
          {subtitle && <p className="faq-home-subtitle">{subtitle}</p>}
        </header>

        <ul className="faq-home-list">
          {filtered.map((f) => (
            <li key={f.id} className="faq-home-item">
              <details className="faq-home-details">
                <summary className="faq-home-summary">
                  <span className="faq-home-summary-text">{f.question}</span>
                  <span className="faq-home-summary-icon" aria-hidden="true">+</span>
                </summary>
                <div className="faq-home-answer">
                  {f.answer.split(/\n{2,}/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </details>
            </li>
          ))}
        </ul>

        <div className="faq-home-cta">
          <Link to="/faq" className="faq-home-cta-link">
            See all FAQs →
          </Link>
        </div>
      </div>
    </section>
  );
}
