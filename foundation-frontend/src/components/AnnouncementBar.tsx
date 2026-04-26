/**
 * AnnouncementBar — thin strip rendered above the site header.
 *
 * Controlled by the admin via `/admin/announcement-bar`. Reads `/api/public/announcement-bar`
 * through {@link useAnnouncementBar}; when the hook returns `null` (disabled, out-of-window,
 * or fetch failure) this component renders nothing.
 *
 * Dismissal is per-visitor and stored in localStorage keyed on the announcement's
 * `updatedAt`. When the admin edits the bar, `updatedAt` changes and the dismissal resets
 * automatically — visitors see the new message once, can dismiss again, and so on.
 */
import { useEffect, useMemo, useState } from 'react';
import { useAnnouncementBar, type AnnouncementStyle } from '../hooks/useAnnouncementBar';
import logger from '../utils/logger';
import './AnnouncementBar.css';

const STORAGE_KEY = 'announcementBarDismissedAt';

const styleClass: Record<AnnouncementStyle, string> = {
  INFO: 'announcement-bar--info',
  SUCCESS: 'announcement-bar--success',
  WARNING: 'announcement-bar--warning',
  CRITICAL: 'announcement-bar--critical',
};

function readDismissedKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    // Safari private mode / storage disabled — treat as "never dismissed".
    logger.warn('AnnouncementBar', 'localStorage unavailable for dismissal read', error);
    return null;
  }
}

function writeDismissedKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch (error) {
    logger.warn('AnnouncementBar', 'localStorage unavailable for dismissal write', error);
  }
}

export default function AnnouncementBar() {
  const { loading, bar } = useAnnouncementBar();
  const [dismissed, setDismissed] = useState(false);

  // Re-evaluate dismissal whenever the bar's updatedAt changes so a fresh edit reappears
  // for users who dismissed an older version.
  useEffect(() => {
    if (!bar) return;
    const stored = readDismissedKey();
    setDismissed(stored === bar.updatedAt);
  }, [bar?.updatedAt]);

  const isExternalLink = useMemo(() => {
    if (!bar?.linkUrl) return false;
    return /^https?:\/\//i.test(bar.linkUrl);
  }, [bar?.linkUrl]);

  if (loading || !bar) return null;
  if (bar.dismissible && dismissed) return null;

  const handleDismiss = () => {
    writeDismissedKey(bar.updatedAt);
    setDismissed(true);
  };

  const showLink = bar.linkUrl && bar.linkLabel;

  return (
    <div
      className={`announcement-bar ${styleClass[bar.style]}`}
      role="status"
      aria-live="polite"
      data-testid="announcement-bar"
    >
      <div className="announcement-bar__inner">
        {bar.iconEmoji && (
          <span className="announcement-bar__icon" aria-hidden="true">
            {bar.iconEmoji}
          </span>
        )}
        <span className="announcement-bar__message">{bar.message}</span>
        {showLink && (
          <a
            className="announcement-bar__link"
            href={bar.linkUrl!}
            target={isExternalLink ? '_blank' : undefined}
            rel={isExternalLink ? 'noopener noreferrer' : undefined}
          >
            {bar.linkLabel}
          </a>
        )}
      </div>
      {bar.dismissible && (
        <button
          type="button"
          className="announcement-bar__dismiss"
          aria-label="Dismiss announcement"
          onClick={handleDismiss}
        >
          ×
        </button>
      )}
    </div>
  );
}
