/**
 * "Where your donation goes" home section. Renders a horizontal bar for each enabled
 * allocation row, sized proportionally to its percentage. Icon + label + optional
 * description sit alongside the bar.
 *
 * The block renders nothing (returns null) when the hook resolves to an empty list —
 * the backend returns 204 No Content whenever the foundation is not APPROVED, so
 * this is what keeps financial disclosure claims invisible pre-registration.
 */
import { useMoneyAllocations } from '../../hooks/useMoneyAllocations';
import './MoneyAllocationSection.css';

interface MoneyAllocationSectionConfig {
  title?: string;
  subtitle?: string;
}

export default function MoneyAllocationSection({ config }: { config: MoneyAllocationSectionConfig }) {
  const { loading, allocations } = useMoneyAllocations();

  // Explicitly avoid any fallback: if the API is down or the block is gated by
  // registration, we render nothing rather than guessing at percentages.
  if (loading) return null;
  if (!allocations || allocations.length === 0) return null;

  const title = config.title && config.title.trim() ? config.title : 'Where your donation goes';
  const subtitle = config.subtitle && config.subtitle.trim() ? config.subtitle : null;

  // Display percentages scaled against the max so that a partial set (e.g. summing
  // to 80 while an admin edits) still visually fills the row — the numeric label
  // stays truthful.
  const maxPercent = Math.max(...allocations.map((a) => a.percentage), 1);

  return (
    <section className="money-allocation-section" aria-labelledby="money-allocation-title">
      <div className="ma-container">
        <header className="ma-header">
          <h2 id="money-allocation-title">{title}</h2>
          {subtitle && <p className="ma-subtitle">{subtitle}</p>}
        </header>

        <ol className="ma-list">
          {allocations.map((row) => {
            const fillPct = Math.round((row.percentage / maxPercent) * 100);
            return (
              <li key={row.id} className="ma-row">
                <div className="ma-row-head">
                  <span className="ma-icon" aria-hidden="true">{row.iconEmoji}</span>
                  <span className="ma-label">{row.label}</span>
                  <span className="ma-percent">{row.percentage}%</span>
                </div>
                <div className="ma-bar" role="img" aria-label={`${row.percentage} percent`}>
                  <span
                    className="ma-bar-fill"
                    style={{ width: `${fillPct}%`, backgroundColor: row.colorHex }}
                  />
                </div>
                {row.description && <p className="ma-description">{row.description}</p>}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
