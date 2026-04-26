/**
 * Admin editor for the public trust badges. Renders a list of editable cards with:
 *   - Up/down reorder
 *   - Inline edit of icon / title / description
 *   - Toggles for `enabled`, `showInStrip`, `showInGrid`, `registrationGated`
 *   - Add new badge, delete existing badge
 *
 * Registration-gated badges also surface a small notice reminding the admin that the
 * card is hidden publicly until the foundation is APPROVED — the server filters these
 * out regardless of what this UI does, so this is purely informational.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';
import logger from '../utils/logger';
import { useRegistrationInfo } from '../hooks/useRegistrationInfo';
import './AdminTrustBadges.css';

interface TrustBadge {
  id: number;
  slotKey: string;
  iconEmoji: string;
  title: string;
  description: string;
  enabled: boolean;
  showInStrip: boolean;
  showInGrid: boolean;
  registrationGated: boolean;
  sortOrder: number;
  updatedAt: string | null;
  updatedBy: string | null;
}

type Draft = Omit<TrustBadge, 'updatedAt' | 'updatedBy'>;

function toDraft(b: TrustBadge): Draft {
  const { updatedAt: _u, updatedBy: _ub, ...rest } = b;
  return rest;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_\s-]/g, '')
    .replace(/[\s-]+/g, '_')
    .slice(0, 64);
}

export default function AdminTrustBadges() {
  const navigate = useNavigate();
  const showToast = useToast();
  const registration = useRegistrationInfo();

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [originalsById, setOriginalsById] = useState<Map<number, Draft>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSlotKey, setNewSlotKey] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const slotKeyTouched = useRef(false);

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
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/trust-badges`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: TrustBadge[] = await res.json();
      const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      const newDrafts = sorted.map(toDraft);
      setDrafts(newDrafts);
      const map = new Map<number, Draft>();
      newDrafts.forEach((d) => map.set(d.id, { ...d }));
      setOriginalsById(map);
    } catch (error) {
      logger.error('AdminTrustBadges', 'Failed to load', error);
      showToast('Failed to load trust badges', 'error');
    } finally {
      setLoading(false);
    }
  };

  const setField = <K extends keyof Draft>(id: number, key: K, value: Draft[K]) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, [key]: value } : d)));
  };

  const isDirty = (d: Draft): boolean => {
    const o = originalsById.get(d.id);
    if (!o) return true;
    return (
      d.iconEmoji !== o.iconEmoji ||
      d.title !== o.title ||
      d.description !== o.description ||
      d.enabled !== o.enabled ||
      d.showInStrip !== o.showInStrip ||
      d.showInGrid !== o.showInGrid ||
      d.registrationGated !== o.registrationGated ||
      d.sortOrder !== o.sortOrder
    );
  };

  const dirtyIds = useMemo(() => drafts.filter(isDirty).map((d) => d.id), [drafts, originalsById]);

  const move = (id: number, direction: -1 | 1) => {
    setDrafts((prev) => {
      const idx = prev.findIndex((d) => d.id === id);
      if (idx < 0) return prev;
      const target = idx + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const saveBadge = async (id: number) => {
    const draft = drafts.find((d) => d.id === id);
    if (!draft) return;
    if (!draft.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    if (!draft.description.trim()) {
      showToast('Description is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/trust-badges/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iconEmoji: draft.iconEmoji,
          title: draft.title,
          description: draft.description,
          enabled: draft.enabled,
          showInStrip: draft.showInStrip,
          showInGrid: draft.showInGrid,
          registrationGated: draft.registrationGated,
          sortOrder: draft.sortOrder,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast(`Saved "${draft.title}"`, 'success');
      await load();
    } catch (error) {
      logger.error('AdminTrustBadges', 'Save failed', error);
      showToast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      const orderedIds = drafts.map((d) => d.id);
      const res = await authFetch(`${API_BASE_URL}/admin/trust-badges/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Order saved', 'success');
      await load();
    } catch (error) {
      logger.error('AdminTrustBadges', 'Reorder failed', error);
      showToast('Reorder failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteBadge = async (id: number) => {
    const draft = drafts.find((d) => d.id === id);
    if (!draft) return;
    const ok = window.confirm(`Delete "${draft.title}"? This cannot be undone.`);
    if (!ok) return;
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/trust-badges/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast(`Deleted "${draft.title}"`, 'success');
      await load();
    } catch (error) {
      logger.error('AdminTrustBadges', 'Delete failed', error);
      showToast('Delete failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const createBadge = async () => {
    const slotKey = newSlotKey.trim();
    const title = newTitle.trim();
    if (!slotKey || !title) {
      showToast('Slot key and title are required', 'error');
      return;
    }
    if (!/^[a-z0-9_]{1,64}$/.test(slotKey)) {
      showToast('Slot key must be lowercase a-z, 0-9, and underscores', 'error');
      return;
    }
    setCreating(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/trust-badges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotKey,
          iconEmoji: '✨',
          title,
          description: 'Add a short description for this badge.',
          enabled: true,
          showInStrip: true,
          showInGrid: true,
          registrationGated: false,
          sortOrder: (drafts.length + 1) * 10,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }
      showToast(`Created "${title}"`, 'success');
      setNewSlotKey('');
      setNewTitle('');
      slotKeyTouched.current = false;
      await load();
    } catch (error) {
      logger.error('AdminTrustBadges', 'Create failed', error);
      showToast(error instanceof Error ? error.message : 'Create failed', 'error');
    } finally {
      setCreating(false);
    }
  };

  const onTitleChange = (value: string) => {
    setNewTitle(value);
    if (!slotKeyTouched.current) {
      setNewSlotKey(slugify(value));
    }
  };

  const onSlotKeyChange = (value: string) => {
    slotKeyTouched.current = true;
    setNewSlotKey(value.toLowerCase());
  };

  if (loading) return <div className="loading-state" style={{ padding: '2rem' }}>Loading trust badges…</div>;

  const orderChanged = drafts.some((d, idx) => {
    const original = Array.from(originalsById.values()).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    return original[idx]?.id !== d.id;
  });

  const notApproved = !registration || registration.status !== 'APPROVED';

  return (
    <div className="admin-trust-badges">
      <header className="atb-header">
        <div>
          <h1>Trust badges</h1>
          <p className="atb-sub">
            The small markers shown in the site footer strip and the About page "Trust &
            Transparency" grid. Keep copy short and specific — badges are not the place for long
            explanations.
          </p>
        </div>
        {orderChanged && (
          <button className="btn-primary" onClick={saveOrder} disabled={saving} data-testid="trust-badges-save-order">
            {saving ? 'Saving…' : 'Save new order'}
          </button>
        )}
      </header>

      {notApproved && (
        <div className="atb-banner" role="status">
          <strong>Heads up:</strong> the foundation is not in APPROVED status, so any badge marked
          <em> "Hide unless registered"</em> is not visible to visitors right now, regardless of
          the <em>Enabled</em> toggle below. Update registration status in <a href="/admin/settings">Settings → Legal</a> when approval arrives.
        </div>
      )}

      <ol className="atb-list" data-testid="trust-badges-list">
        {drafts.map((b, idx) => {
          const dirty = isDirty(b);
          const hiddenByGate = b.registrationGated && notApproved;
          return (
            <li key={b.id} className={`atb-card ${hiddenByGate ? 'atb-card--muted' : ''}`}>
              <div className="atb-card-order">
                <button
                  className="btn-reorder"
                  onClick={() => move(b.id, -1)}
                  disabled={idx === 0 || saving}
                  aria-label={`Move ${b.title} up`}
                >
                  ↑
                </button>
                <span className="atb-card-position">{idx + 1}</span>
                <button
                  className="btn-reorder"
                  onClick={() => move(b.id, 1)}
                  disabled={idx === drafts.length - 1 || saving}
                  aria-label={`Move ${b.title} down`}
                >
                  ↓
                </button>
              </div>

              <div className="atb-card-body">
                <div className="atb-row">
                  <div className="atb-field atb-field--icon">
                    <label htmlFor={`icon-${b.id}`}>Icon</label>
                    <input
                      id={`icon-${b.id}`}
                      type="text"
                      maxLength={16}
                      value={b.iconEmoji}
                      onChange={(e) => setField(b.id, 'iconEmoji', e.target.value)}
                    />
                  </div>
                  <div className="atb-field atb-field--title">
                    <label htmlFor={`title-${b.id}`}>
                      Title <span className="required">*</span>
                    </label>
                    <input
                      id={`title-${b.id}`}
                      type="text"
                      maxLength={120}
                      value={b.title}
                      onChange={(e) => setField(b.id, 'title', e.target.value)}
                    />
                  </div>
                  <div className="atb-field atb-field--slot">
                    <label>Slot key</label>
                    <input type="text" value={b.slotKey} readOnly disabled />
                    <small className="field-description">Immutable after creation.</small>
                  </div>
                </div>

                <div className="atb-field">
                  <label htmlFor={`desc-${b.id}`}>
                    Description <span className="required">*</span>
                  </label>
                  <textarea
                    id={`desc-${b.id}`}
                    rows={2}
                    maxLength={500}
                    value={b.description}
                    onChange={(e) => setField(b.id, 'description', e.target.value)}
                  />
                  <small className="field-description">{b.description.length}/500 characters</small>
                </div>

                <div className="atb-toggles">
                  <label className="atb-toggle">
                    <input
                      type="checkbox"
                      checked={b.enabled}
                      onChange={(e) => setField(b.id, 'enabled', e.target.checked)}
                    />
                    Enabled
                  </label>
                  <label className="atb-toggle">
                    <input
                      type="checkbox"
                      checked={b.showInGrid}
                      onChange={(e) => setField(b.id, 'showInGrid', e.target.checked)}
                    />
                    Show in About-page grid
                  </label>
                  <label className="atb-toggle">
                    <input
                      type="checkbox"
                      checked={b.showInStrip}
                      onChange={(e) => setField(b.id, 'showInStrip', e.target.checked)}
                    />
                    Show in footer strip
                  </label>
                  <label className="atb-toggle atb-toggle--gate">
                    <input
                      type="checkbox"
                      checked={b.registrationGated}
                      onChange={(e) => setField(b.id, 'registrationGated', e.target.checked)}
                    />
                    Hide unless registered (APPROVED)
                  </label>
                </div>

                {hiddenByGate && (
                  <small className="atb-gate-notice">
                    Currently hidden from visitors — registration gate is on and status is
                    {' '}
                    <strong>{registration?.status ?? 'UNREGISTERED'}</strong>.
                  </small>
                )}

                <div className="atb-card-actions">
                  <button
                    className="btn-primary"
                    onClick={() => saveBadge(b.id)}
                    disabled={!dirty || saving}
                    data-testid={`trust-badges-save-${b.slotKey}`}
                  >
                    {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
                  </button>
                  <button
                    className="btn-danger-outline"
                    onClick={() => deleteBadge(b.id)}
                    disabled={saving}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <section className="atb-new" aria-label="Add new badge">
        <h2>Add a new badge</h2>
        <div className="atb-new-row">
          <div className="atb-field">
            <label htmlFor="new-title">Title</label>
            <input
              id="new-title"
              type="text"
              maxLength={120}
              value={newTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g. Verified partners"
            />
          </div>
          <div className="atb-field">
            <label htmlFor="new-slot">Slot key</label>
            <input
              id="new-slot"
              type="text"
              maxLength={64}
              value={newSlotKey}
              onChange={(e) => onSlotKeyChange(e.target.value)}
              placeholder="lowercase_with_underscores"
            />
            <small className="field-description">
              Used by tests and URLs. Derived from title; click here to customise.
            </small>
          </div>
          <button
            className="btn-primary"
            onClick={createBadge}
            disabled={creating || !newTitle.trim() || !newSlotKey.trim()}
            data-testid="trust-badges-create"
          >
            {creating ? 'Creating…' : 'Add badge'}
          </button>
        </div>
      </section>

      {dirtyIds.length > 0 && (
        <div className="atb-dirty-banner">
          Unsaved changes on {dirtyIds.length} badge{dirtyIds.length === 1 ? '' : 's'}. Click
          Save on each card to persist.
        </div>
      )}
    </div>
  );
}
