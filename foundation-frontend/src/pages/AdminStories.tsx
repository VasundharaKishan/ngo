/**
 * Admin editor for impact stories ({@code /admin/stories}). Each card lets the admin set
 * title, the quoted text, attribution, optional image, program tag, and location, plus
 * enabled state. Reorder, add, delete, and save-per-row follow the same pattern as
 * {@code AdminMoneyAllocations}.
 *
 * The page surfaces a {@code publiclyVisible} signal returned by the server: when the
 * foundation is not in APPROVED registration status, every enabled story is still
 * hidden from visitors regardless of what's saved here. Admin edits persist either way.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';
import logger from '../utils/logger';
import './AdminStories.css';

interface Story {
  id: number;
  title: string;
  quote: string;
  attribution: string;
  imageUrl: string | null;
  programTag: string | null;
  location: string | null;
  enabled: boolean;
  sortOrder: number;
  updatedAt: string | null;
  updatedBy: string | null;
}

interface AdminListResponse {
  rows: Story[];
  publiclyVisible: boolean;
}

type Draft = Omit<Story, 'updatedAt' | 'updatedBy'>;

function toDraft(s: Story): Draft {
  const { updatedAt: _u, updatedBy: _ub, ...rest } = s;
  return rest;
}

const QUOTE_SOFT_LIMIT = 600; // characters — past this the card warns admin about readability

export default function AdminStories() {
  const navigate = useNavigate();
  const showToast = useToast();

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [originalsById, setOriginalsById] = useState<Map<number, Draft>>(new Map());
  const [publiclyVisible, setPubliclyVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

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
      const res = await authFetch(`${API_BASE_URL}/admin/stories`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AdminListResponse = await res.json();
      const sorted = [...data.rows].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      const newDrafts = sorted.map(toDraft);
      setDrafts(newDrafts);
      const map = new Map<number, Draft>();
      newDrafts.forEach((d) => map.set(d.id, { ...d }));
      setOriginalsById(map);
      setPubliclyVisible(data.publiclyVisible);
    } catch (error) {
      logger.error('AdminStories', 'Failed to load', error);
      showToast('Failed to load stories', 'error');
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
      d.title !== o.title ||
      d.quote !== o.quote ||
      d.attribution !== o.attribution ||
      (d.imageUrl ?? '') !== (o.imageUrl ?? '') ||
      (d.programTag ?? '') !== (o.programTag ?? '') ||
      (d.location ?? '') !== (o.location ?? '') ||
      d.enabled !== o.enabled ||
      d.sortOrder !== o.sortOrder
    );
  };

  const orderChanged = useMemo(() => {
    const original = Array.from(originalsById.values()).sort(
      (a, b) => a.sortOrder - b.sortOrder || a.id - b.id
    );
    return drafts.some((d, idx) => original[idx]?.id !== d.id);
  }, [drafts, originalsById]);

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

  const saveRow = async (id: number) => {
    const draft = drafts.find((d) => d.id === id);
    if (!draft) return;
    if (!draft.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    if (!draft.quote.trim()) {
      showToast('Quote is required', 'error');
      return;
    }
    if (!draft.attribution.trim()) {
      showToast('Attribution is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/stories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title.trim(),
          quote: draft.quote.trim(),
          attribution: draft.attribution.trim(),
          imageUrl: draft.imageUrl?.trim() ? draft.imageUrl.trim() : null,
          programTag: draft.programTag?.trim() ? draft.programTag.trim() : null,
          location: draft.location?.trim() ? draft.location.trim() : null,
          enabled: draft.enabled,
          sortOrder: draft.sortOrder,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }
      showToast(`Saved "${draft.title}"`, 'success');
      await load();
    } catch (error) {
      logger.error('AdminStories', 'Save failed', error);
      showToast(error instanceof Error ? error.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      const orderedIds = drafts.map((d) => d.id);
      const res = await authFetch(`${API_BASE_URL}/admin/stories/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Order saved', 'success');
      await load();
    } catch (error) {
      logger.error('AdminStories', 'Reorder failed', error);
      showToast('Reorder failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async (id: number) => {
    const draft = drafts.find((d) => d.id === id);
    if (!draft) return;
    const ok = window.confirm(`Delete "${draft.title}"? This cannot be undone.`);
    if (!ok) return;
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/stories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast(`Deleted "${draft.title}"`, 'success');
      await load();
    } catch (error) {
      logger.error('AdminStories', 'Delete failed', error);
      showToast('Delete failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const createRow = async () => {
    const title = newTitle.trim();
    if (!title) {
      showToast('Title is required', 'error');
      return;
    }
    setCreating(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          quote: 'Add the beneficiary quote here, in their own words where possible.',
          attribution: 'Name, role / age',
          imageUrl: null,
          programTag: null,
          location: null,
          enabled: false,
          sortOrder: (drafts.length + 1) * 10,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }
      showToast(`Created "${title}" — fill in the details and enable it`, 'success');
      setNewTitle('');
      await load();
    } catch (error) {
      logger.error('AdminStories', 'Create failed', error);
      showToast(error instanceof Error ? error.message : 'Create failed', 'error');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="loading-state" style={{ padding: '2rem' }}>Loading stories…</div>;
  }

  return (
    <div className="admin-stories">
      <header className="as-header">
        <div>
          <h1>Impact stories</h1>
          <p className="as-sub">
            Short narratives from beneficiaries and caregivers. These appear publicly on the
            home page only after the foundation reaches APPROVED registration status — admin
            edits below are saved either way.
          </p>
        </div>
        {orderChanged && (
          <button
            className="btn-primary"
            onClick={saveOrder}
            disabled={saving}
            data-testid="stories-save-order"
          >
            {saving ? 'Saving…' : 'Save new order'}
          </button>
        )}
      </header>

      {!publiclyVisible && (
        <div className="as-banner as-banner--info" role="status">
          <strong>Not publicly visible.</strong> The foundation is not in APPROVED status,
          so stories are hidden from visitors regardless of what's saved below. They will
          go live once registration is approved and individual stories are enabled.
        </div>
      )}

      <ol className="as-list" data-testid="stories-list">
        {drafts.map((s, idx) => {
          const dirty = isDirty(s);
          const overSoftLimit = s.quote.length > QUOTE_SOFT_LIMIT;
          return (
            <li key={s.id} className={`as-card ${!s.enabled ? 'as-card--muted' : ''}`}>
              <div className="as-card-order">
                <button
                  className="btn-reorder"
                  onClick={() => move(s.id, -1)}
                  disabled={idx === 0 || saving}
                  aria-label={`Move ${s.title} up`}
                >
                  ↑
                </button>
                <span className="as-card-position">{idx + 1}</span>
                <button
                  className="btn-reorder"
                  onClick={() => move(s.id, 1)}
                  disabled={idx === drafts.length - 1 || saving}
                  aria-label={`Move ${s.title} down`}
                >
                  ↓
                </button>
              </div>

              <div className="as-card-body">
                <div className="as-row as-row--top">
                  <div className="as-field as-field--title">
                    <label htmlFor={`title-${s.id}`}>
                      Title <span className="required">*</span>
                    </label>
                    <input
                      id={`title-${s.id}`}
                      type="text"
                      maxLength={160}
                      value={s.title}
                      onChange={(e) => setField(s.id, 'title', e.target.value)}
                    />
                  </div>
                  <label className="as-toggle">
                    <input
                      type="checkbox"
                      checked={s.enabled}
                      onChange={(e) => setField(s.id, 'enabled', e.target.checked)}
                    />
                    <span>Enabled</span>
                  </label>
                </div>

                <div className="as-field">
                  <label htmlFor={`quote-${s.id}`}>
                    Quote <span className="required">*</span>
                  </label>
                  <textarea
                    id={`quote-${s.id}`}
                    rows={4}
                    value={s.quote}
                    onChange={(e) => setField(s.id, 'quote', e.target.value)}
                  />
                  <span className={`as-counter ${overSoftLimit ? 'as-counter--warn' : ''}`}>
                    {s.quote.length} characters
                    {overSoftLimit && ` — over ${QUOTE_SOFT_LIMIT}, consider trimming for readability`}
                  </span>
                </div>

                <div className="as-row as-row--bottom">
                  <div className="as-field">
                    <label htmlFor={`attribution-${s.id}`}>
                      Attribution <span className="required">*</span>
                    </label>
                    <input
                      id={`attribution-${s.id}`}
                      type="text"
                      maxLength={160}
                      placeholder="e.g. Priya, age 11 — Class 6 student"
                      value={s.attribution}
                      onChange={(e) => setField(s.id, 'attribution', e.target.value)}
                    />
                  </div>
                  <div className="as-field">
                    <label htmlFor={`program-${s.id}`}>Program tag</label>
                    <input
                      id={`program-${s.id}`}
                      type="text"
                      maxLength={80}
                      placeholder="Education / Healthcare / Community…"
                      value={s.programTag ?? ''}
                      onChange={(e) => setField(s.id, 'programTag', e.target.value)}
                    />
                  </div>
                </div>

                <div className="as-row as-row--bottom">
                  <div className="as-field">
                    <label htmlFor={`location-${s.id}`}>Location</label>
                    <input
                      id={`location-${s.id}`}
                      type="text"
                      maxLength={120}
                      placeholder="e.g. Patna district, Bihar"
                      value={s.location ?? ''}
                      onChange={(e) => setField(s.id, 'location', e.target.value)}
                    />
                  </div>
                  <div className="as-field">
                    <label htmlFor={`image-${s.id}`}>Image URL</label>
                    <input
                      id={`image-${s.id}`}
                      type="text"
                      maxLength={1000}
                      placeholder="https://…"
                      value={s.imageUrl ?? ''}
                      onChange={(e) => setField(s.id, 'imageUrl', e.target.value)}
                    />
                  </div>
                </div>

                <div className="as-card-actions">
                  <button
                    className="btn-primary"
                    onClick={() => saveRow(s.id)}
                    disabled={!dirty || saving}
                    data-testid={`save-story-${s.id}`}
                  >
                    {dirty ? 'Save changes' : 'Saved'}
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => deleteRow(s.id)}
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

      <div className="as-new">
        <h2>Add a new story</h2>
        <div className="as-new-row">
          <div className="as-field">
            <label htmlFor="new-story-title">Title</label>
            <input
              id="new-story-title"
              type="text"
              maxLength={160}
              placeholder="Short headline"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={createRow} disabled={creating}>
            {creating ? 'Creating…' : 'Add story'}
          </button>
        </div>
        <p className="as-new-hint">
          Created stories start <strong>disabled</strong> with placeholder text. Fill in
          the quote, attribution, and other fields, then toggle Enabled.
        </p>
      </div>
    </div>
  );
}
