/**
 * Transparency section — dark trust-900 background with 3-col grid.
 *
 * Left column: saffron eyebrow + white Fraunces heading.
 * Right 2 columns: 2×2 grid of link cards (bg-white/5, border-white/10).
 *
 * Matches the mockup's "You wrote the cheque. You deserve to see the ledger." block.
 */
import { Link } from 'react-router-dom';
import './TransparencySection.css';

interface TransparencySectionProps {
  config: {
    title?: string;
    eyebrow?: string;
  };
}

const TRANSPARENCY_LINKS = [
  {
    id: 'registration',
    title: 'Registration status',
    desc: 'Our current legal status and what\u2019s next.',
    to: '/transparency#registration',
  },
  {
    id: 'spending',
    title: 'Quarterly spending reports',
    desc: 'Line-item spend for every campaign, published every quarter.',
    to: '/transparency#spending',
  },
  {
    id: 'updates',
    title: 'Campaign updates',
    desc: 'Progress, photos and funds utilised — straight from the field.',
    to: '/transparency#updates',
  },
  {
    id: 'photos',
    title: 'Field photos & stories',
    desc: 'Consented, dated, with village names.',
    to: '/transparency#photos',
  },
];

export default function TransparencySection({ config }: TransparencySectionProps) {
  const {
    title = 'You wrote the cheque. You deserve to see the ledger.',
    eyebrow = 'Transparency',
  } = config;

  return (
    <section
      id="transparency"
      className="transparency-section"
      aria-labelledby="transparency-section-title"
    >
      <div className="transparency-container">
        {/* Left column — heading */}
        <div className="transparency-heading">
          <div className="transparency-eyebrow">{eyebrow}</div>
          <h2 id="transparency-section-title" className="transparency-title font-display">
            {title}
          </h2>
        </div>

        {/* Right columns — link cards */}
        <div className="transparency-cards">
          {TRANSPARENCY_LINKS.map((link) => (
            <Link key={link.id} to={link.to} className="transparency-card">
              <div className="transparency-card-title">{link.title}</div>
              <div className="transparency-card-desc">{link.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
