/**
 * Admin editor for the single-row announcement bar that renders above the public header.
 *
 * Singleton form: one-click enable/disable, message + optional CTA link, style variant,
 * dismissibility, and an optional start/end window. Start/end are datetime-local inputs
 * converted to/from UTC ISO on the wire so the backend stores absolute moments.
 *
 * The API returns a {@code publiclyVisible} flag (server evaluates enabled + window) so
 * we show an accurate "live right now" banner without re-implementing the window math here.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';
import logger from '../utils/logger';
import './AdminAnnouncementBar.css';

type AnnouncementStyle = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';

interface AnnouncementBar {
  enabled: boolean;
  iconEmoji: string | null;
  message: string;
  linkUrl: string | null;
  linkLabel: string | null;
  style: AnnouncementStyle;
  dismissible: boolean;
  startsAt: string | null;
  endsAt: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  publiclyVisible: boolean;
}

const EMPTY: AnnouncementBar = {
  enabled: false,
  iconEmoji: '',
  message: '',
  linkUrl: '',
  linkLabel: '',
  style: 'INFO',
  dismissible: true,
  startsAt: null,
  endsAt: null,
  updatedAt: null,
  updatedBy: null,
  publiclyVisible: false,
};

const STYLE_OPTIONS: { value: AnnouncementStyle; label: string; hint: string }[] = [
  { value: 'INFO',     label: 'Info (blue)',       hint: 'Neutral update' },
  { value: 'SUCCESS',  label: 'Success (green)',   hint: 'Goal reached, good news' },
  { value: 'WARNING',  label: 'Warning (amber)',   hint: 'Soft alert, closures' },
  { value: 'CRITICAL', label: 'Critical (red)',    hint: 'Urgent action needed' },
];

/** Convert backend ISO-UTC → value for `<input type="datetime-local">` (local wall clock). */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // Shift by tz offset so `toISOString().slice(0,16)` yields local wall time, not UTC.
  const tzOffsetMs = d.getTimezoneOffset() * 60 * 1000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

/** Convert `<input type="datetime-local">` string → ISO-UTC for the API. */
function localInputToIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function AdminAnnouncementBar() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [bar, setBar] = useState<AnnouncementBar>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('adminUser');
    if (!user) {
      navigate('/admin/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/announcement-bar`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AnnouncementBar = await res.json();
      setBar({
        ...data,
        iconEmoji: data.iconEmoji ?? '',
        linkUrl: data.linkUrl ?? '',
        linkLabel: data.linkLabel ?? '',
      });
    } catch (error) {
      logger.error('AdminAnnouncementBar', 'Failed to load', error);
      showToast('Failed to load announcement bar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const setField = <K extends keyof AnnouncementBar>(key: K, value: AnnouncementBar[K]) => {
    setBar((prev) => ({ ...prev, [key]: value }));
  };

  const startsLocal = useMemo(() => isoToLocalInput(bar.startsAt), [bar.startsAt]);
  const endsLocal = useMemo(() => isoToLocalInput(bar.endsAt), [bar.endsAt]);

  const windowInverted =
    !!bar.startsAt && !!bar.endsAt && new Date(bar.endsAt) <= new Date(bar.startsAt);

  const linkPartial =
    (!!bar.linkUrl && !bar.linkLabel) || (!bar.linkUrl && !!bar.linkLabel);

  const handleSave = async () => {
    if (!bar.message.trim()) {
      showToast('Message is required', 'error');
      return;
    }
    if (windowInverted) {
      showToast('End time must be after start time', 'error');
      return;
    }
    if (linkPartial) {
      showToast('Provide both link URL and label, or neither', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        enabled: bar.enabled,
        iconEmoji: bar.iconEmoji?.trim() || null,
        message: bar.message.trim(),
        linkUrl: bar.linkUrl?.trim() || null,
        linkLabel: bar.linkLabel?.trim() || null,
        style: bar.style,
        dismissible: bar.dismissible,
        startsAt: bar.startsAt,
        endsAt: bar.endsAt,
      };
      const res = await authFetch(`${API_BASE_URL}/admin/announcement-bar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `HTTP ${res.status}`);
      }
      showToast('Announcement bar saved', 'success');
      await load();
    } catch (error) {
      logger.error('AdminAnnouncementBar', 'Save failed', error);
      showToast(error instanceof Error ? error.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="aab-loading">Loading announcement bar…</div>;
  }

  const visibilityHint = bar.publiclyVisible
    ? 'Live: visitors are seeing this right now.'
    : bar.enabled
    ? 'Enabled but outside the scheduled time window — hidden from visitors.'
    : 'Disabled — hidden from visitors.';

  return (
    <div className="aab">
      <header className="aab-header">
        <div>
          <h1>Announcement bar</h1>
          <p className="aab-sub">
            A single slim strip that appears above the public site header. Use sparingly —
            campaign milestones, office closures, or time-boxed notices.
          </p>
        </div>
        <button
          type="button"
          className="aab-btn aab-btn--primary"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </header>

      <div
        className={`aab-visibility ${
          bar.publiclyVisible ? 'aab-visibility--live' : 'aab-visibility--hidden'
        }`}
        role="status"
      >
        {visibilityHint}
      </div>

      <section className="aab-card">
        <h2>Status</h2>
        <div className="aab-row aab-row--toggles">
          <label className="aab-toggle">
            <input
              type="checkbox"
              checked={bar.enabled}
              onChange={(e) => setField('enabled', e.target.checked)}
            />
            <span>Enabled</span>
          </label>
          <label className="aab-toggle">
            <input
              type="checkbox"
              checked={bar.dismissible}
              onChange={(e) => setField('dismissible', e.target.checked)}
            />
            <span>Dismissible (visitor can close it)</span>
          </label>
        </div>
      </section>

      <section className="aab-card">
        <h2>Content</h2>
        <div className="aab-grid">
          <div className="aab-field aab-field--icon">
            <label htmlFor="aab-icon">Icon</label>
            <input
              id="aab-icon"
              type="text"
              maxLength={8}
              placeholder="📣"
              value={bar.iconEmoji ?? ''}
              onChange={(e) => setField('iconEmoji', e.target.value)}
            />
            <span className="aab-hint">Single emoji. Optional.</span>
          </div>
          <div className="aab-field aab-field--style">
            <label htmlFor="aab-style">Style</label>
            <select
              id="aab-style"
              value={bar.style}
              onChange={(e) => setField('style', e.target.value as AnnouncementStyle)}
            >
              {STYLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.hint}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="aab-field">
          <label htmlFor="aab-message">
            Message <span className="aab-required">*</span>
          </label>
          <textarea
            id="aab-message"
            rows={2}
            maxLength={500}
            value={bar.message}
            onChange={(e) => setField('message', e.target.value)}
            placeholder="e.g. We've matched 50 lakh this month — thank you!"
          />
          <span className="aab-hint">{bar.message.length} / 500 characters</span>
        </div>
      </section>

      <section className="aab-card">
        <h2>Optional link</h2>
        <p className="aab-sub-small">
          Leave both blank to show the message without a call to action. If you fill one,
          fill the other.
        </p>
        <div className="aab-grid">
          <div className="aab-field">
            <label htmlFor="aab-link-label">Link label</label>
            <input
              id="aab-link-label"
              type="text"
              maxLength={64}
              value={bar.linkLabel ?? ''}
              onChange={(e) => setField('linkLabel', e.target.value)}
              placeholder="Read more"
            />
          </div>
          <div className="aab-field">
            <label htmlFor="aab-link-url">Link URL</label>
            <input
              id="aab-link-url"
              type="text"
              maxLength={500}
              value={bar.linkUrl ?? ''}
              onChange={(e) => setField('linkUrl', e.target.value)}
              placeholder="/campaigns/spotlight or https://…"
            />
          </div>
        </div>
        {linkPartial && (
          <div className="aab-warning">Fill both label and URL, or leave both blank.</div>
        )}
      </section>

      <section className="aab-card">
        <h2>Time window (optional)</h2>
        <p className="aab-sub-small">
          Restrict when the bar appears. Leave a field blank for no boundary on that side.
          Times are in your local timezone.
        </p>
        <div className="aab-grid">
          <div className="aab-field">
            <label htmlFor="aab-starts">Starts at</label>
            <input
              id="aab-starts"
              type="datetime-local"
              value={startsLocal}
              onChange={(e) => setField('startsAt', localInputToIso(e.target.value))}
            />
          </div>
          <div className="aab-field">
            <label htmlFor="aab-ends">Ends at</label>
            <input
              id="aab-ends"
              type="datetime-local"
              value={endsLocal}
              onChange={(e) => setField('endsAt', localInputToIso(e.target.value))}
            />
          </div>
        </div>
        {windowInverted && (
          <div className="aab-warning">End time must be after start time.</div>
        )}
      </section>

      {bar.updatedAt && (
        <div className="aab-audit">
          Last updated {new Date(bar.updatedAt).toLocaleString()}
          {bar.updatedBy ? ` by ${bar.updatedBy}` : ''}.
        </div>
      )}
    </div>
  );
}
