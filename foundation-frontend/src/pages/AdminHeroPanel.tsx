import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';
import logger from '../utils/logger';
import './AdminHeroPanel.css';

type BackgroundFocus = 'CENTER' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';

interface HeroPanel {
  eyebrow: string | null;
  headline: string;
  subtitle: string | null;
  primaryCtaLabel: string | null;
  primaryCtaHref: string | null;
  backgroundImageUrl: string | null;
  backgroundFocus: BackgroundFocus;
  enabled: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}

const EMPTY: HeroPanel = {
  eyebrow: '',
  headline: '',
  subtitle: '',
  primaryCtaLabel: '',
  primaryCtaHref: '',
  backgroundImageUrl: '',
  backgroundFocus: 'CENTER',
  enabled: true,
  updatedAt: null,
  updatedBy: null,
};

const FOCUS_OPTIONS: BackgroundFocus[] = ['CENTER', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM'];

const focusToObjectPosition: Record<BackgroundFocus, string> = {
  CENTER: 'center',
  LEFT: 'left center',
  RIGHT: 'right center',
  TOP: 'center top',
  BOTTOM: 'center bottom',
};

export default function AdminHeroPanel() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [panel, setPanel] = useState<HeroPanel>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('adminUser');
    if (!user) {
      navigate('/admin/login');
      return;
    }
    load();
  }, [navigate]);

  const load = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/hero-panel`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: HeroPanel = await res.json();
      setPanel({
        ...data,
        eyebrow: data.eyebrow ?? '',
        subtitle: data.subtitle ?? '',
        primaryCtaLabel: data.primaryCtaLabel ?? '',
        primaryCtaHref: data.primaryCtaHref ?? '',
        backgroundImageUrl: data.backgroundImageUrl ?? '',
      });
    } catch (error) {
      logger.error('AdminHeroPanel', 'Failed to load hero panel', error);
      showToast('Failed to load hero panel', 'error');
    } finally {
      setLoading(false);
    }
  };

  const setField = <K extends keyof HeroPanel>(key: K, value: HeroPanel[K]) => {
    setPanel((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!panel.headline.trim()) {
      showToast('Headline is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        eyebrow: panel.eyebrow || null,
        headline: panel.headline,
        subtitle: panel.subtitle || null,
        primaryCtaLabel: panel.primaryCtaLabel || null,
        primaryCtaHref: panel.primaryCtaHref || null,
        backgroundImageUrl: panel.backgroundImageUrl || null,
        backgroundFocus: panel.backgroundFocus,
        enabled: panel.enabled,
      };
      const res = await authFetch(`${API_BASE_URL}/admin/hero-panel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `HTTP ${res.status}`);
      }
      showToast('Hero panel saved', 'success');
      await load();
    } catch (error) {
      logger.error('AdminHeroPanel', 'Save failed', error);
      showToast(error instanceof Error ? error.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image must be under 10 MB', 'error');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await authFetch(`${API_BASE_URL}/admin/upload/image`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setField('backgroundImageUrl', data.url);
      showToast('Image uploaded', 'success');
    } catch (error) {
      logger.error('AdminHeroPanel', 'Upload failed', error);
      showToast('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="loading-state" style={{ padding: '2rem' }}>Loading hero panel…</div>;

  const bg = panel.backgroundImageUrl
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(30,64,175,0.72) 0%, rgba(30,64,175,0.48) 100%), url("${panel.backgroundImageUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: focusToObjectPosition[panel.backgroundFocus],
      }
    : { background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' };

  return (
    <div className="admin-hero-panel">
      <header className="ahp-header">
        <div>
          <h1>Hero panel</h1>
          <p className="ahp-sub">
            The main editorial block at the top of the public home page. Use short, specific copy
            and a single primary action.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving || uploading}
          data-testid="hero-panel-save"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </header>

      <div className="ahp-grid">
        {/* Editor */}
        <section className="ahp-editor" aria-label="Hero editor">
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={panel.enabled}
                onChange={(e) => setField('enabled', e.target.checked)}
                data-testid="hero-panel-enabled"
              />{' '}
              Show hero panel on the public home page
            </label>
            {!panel.enabled && (
              <small className="field-description warning">
                When off, the home page falls back to a default hero until re-enabled.
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="hero-eyebrow">Eyebrow (optional)</label>
            <input
              id="hero-eyebrow"
              type="text"
              maxLength={120}
              value={panel.eyebrow ?? ''}
              onChange={(e) => setField('eyebrow', e.target.value)}
              placeholder="e.g. Community-led foundation"
              data-testid="hero-panel-eyebrow"
            />
            <small className="field-description">Small label above the headline. Keep to 2–6 words.</small>
          </div>

          <div className="form-group">
            <label htmlFor="hero-headline">
              Headline <span className="required">*</span>
            </label>
            <input
              id="hero-headline"
              type="text"
              maxLength={240}
              value={panel.headline}
              onChange={(e) => setField('headline', e.target.value)}
              placeholder="What should a visitor understand in 3 seconds?"
              required
              data-testid="hero-panel-headline"
            />
            <small className="field-description">{panel.headline.length}/240 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="hero-subtitle">Subtitle (optional)</label>
            <textarea
              id="hero-subtitle"
              rows={3}
              maxLength={500}
              value={panel.subtitle ?? ''}
              onChange={(e) => setField('subtitle', e.target.value)}
              placeholder="One sentence of supporting context — be specific about what the donation funds."
              data-testid="hero-panel-subtitle"
            />
            <small className="field-description">{(panel.subtitle ?? '').length}/500 characters</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cta-label">Primary CTA label</label>
              <input
                id="cta-label"
                type="text"
                maxLength={64}
                value={panel.primaryCtaLabel ?? ''}
                onChange={(e) => setField('primaryCtaLabel', e.target.value)}
                placeholder="Donate now"
                data-testid="hero-panel-cta-label"
              />
            </div>
            <div className="form-group">
              <label htmlFor="cta-href">Primary CTA link</label>
              <input
                id="cta-href"
                type="text"
                maxLength={500}
                value={panel.primaryCtaHref ?? ''}
                onChange={(e) => setField('primaryCtaHref', e.target.value)}
                placeholder="/campaigns"
                data-testid="hero-panel-cta-href"
              />
              <small className="field-description">Internal path (e.g. /campaigns) or full URL.</small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="bg-url">Background image URL (optional)</label>
            <div className="image-url-row">
              <input
                id="bg-url"
                type="text"
                value={panel.backgroundImageUrl ?? ''}
                onChange={(e) => setField('backgroundImageUrl', e.target.value)}
                placeholder="/uploads/hero.jpg"
                data-testid="hero-panel-bg-url"
              />
              <label htmlFor="bg-file" className="btn-upload" style={{ opacity: uploading ? 0.6 : 1 }}>
                {uploading ? 'Uploading…' : 'Upload'}
              </label>
              <input
                id="bg-file"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageUpload(f);
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="bg-focus">Background focus</label>
            <select
              id="bg-focus"
              value={panel.backgroundFocus}
              onChange={(e) => setField('backgroundFocus', e.target.value as BackgroundFocus)}
              data-testid="hero-panel-focus"
            >
              {FOCUS_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <small className="field-description">
              Controls how the background image is positioned when the hero reflows on mobile.
            </small>
          </div>

          {panel.updatedAt && (
            <p className="ahp-updated">
              Last updated {new Date(panel.updatedAt).toLocaleString()}
              {panel.updatedBy ? ` by ${panel.updatedBy}` : ''}
            </p>
          )}
        </section>

        {/* Live preview */}
        <aside className="ahp-preview" aria-label="Live preview">
          <div className="ahp-preview-label">Live preview (82%)</div>
          <div className="ahp-preview-frame">
            <div className="ahp-hero" style={bg}>
              {panel.eyebrow && <div className="ahp-hero-eyebrow">{panel.eyebrow}</div>}
              <h2 className="ahp-hero-headline">{panel.headline || 'Your headline goes here'}</h2>
              {panel.subtitle && <p className="ahp-hero-subtitle">{panel.subtitle}</p>}
              {panel.primaryCtaLabel && panel.primaryCtaHref && (
                <span className="ahp-hero-cta">{panel.primaryCtaLabel} →</span>
              )}
            </div>
          </div>
          <p className="ahp-preview-note">
            Preview is a static rendering. Final appearance may adjust for fonts, spacing, and
            reduced-motion preferences.
          </p>
        </aside>
      </div>
    </div>
  );
}
