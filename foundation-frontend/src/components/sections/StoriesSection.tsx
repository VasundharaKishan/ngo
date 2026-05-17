/**
 * "Voices from the field" home section — matches mockup impact-story layout.
 *
 * 2-column grid per story: left image (4:3 with overlay caption),
 * right Fraunces heading + narrative paragraphs + CTA link.
 * Even-indexed stories flip the columns for visual rhythm.
 *
 * Returns null when the hook resolves to an empty list — the backend returns 204
 * when the foundation is not in APPROVED registration status.
 */
import { Link } from 'react-router-dom';
import { useStories } from '../../hooks/useStories';
import './StoriesSection.css';

interface StoriesSectionConfig {
  title?: string;
  subtitle?: string;
}

export default function StoriesSection({ config }: { config: StoriesSectionConfig }) {
  const { loading, stories } = useStories();

  if (loading) return null;
  if (!stories || stories.length === 0) return null;

  const title = config.title && config.title.trim() ? config.title : 'Voices from the field';
  const subtitle = config.subtitle && config.subtitle.trim() ? config.subtitle : null;

  return (
    <section className="stories-section" aria-labelledby="stories-section-title">
      <div className="stories-container">
        {stories.length > 1 && (
          <header className="stories-header">
            <h2 id="stories-section-title" className="font-display">{title}</h2>
            {subtitle && <p className="stories-subtitle">{subtitle}</p>}
          </header>
        )}

        <ul className="stories-grid">
          {stories.map((story) => (
            <li key={story.id} className="story-card">
              {/* Image side */}
              <div className="story-card__media">
                {story.imageUrl && (
                  <img
                    src={story.imageUrl}
                    alt=""
                    loading="lazy"
                    className="story-card__image"
                  />
                )}
                {/* Overlay caption */}
                <div className="story-card__overlay">
                  {(story.programTag || story.location) && (
                    <div className="story-card__overlay-label">
                      {[story.programTag, story.location].filter(Boolean).join(' · ')}
                    </div>
                  )}
                  {story.title && (
                    <div className="story-card__overlay-text">{story.title}</div>
                  )}
                </div>
              </div>

              {/* Text side */}
              <div className="story-card__body">
                <h3 className="story-card__title font-display">
                  {story.attribution ? `Meet ${story.attribution.split(',')[0]}.` : story.title}
                </h3>
                <blockquote className="story-card__quote">
                  {story.quote.split(/\n{2,}/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </blockquote>
                {story.attribution && (
                  <p className="story-card__attribution">— {story.attribution}</p>
                )}
                <Link to="/campaigns" className="story-card__link">
                  Fund another campaign →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
