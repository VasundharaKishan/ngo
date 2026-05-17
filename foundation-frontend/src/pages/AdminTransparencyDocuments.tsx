/**
 * Admin editor for transparency documents ({@code /admin/transparency-documents}).
 *
 * <p>Each card lets the admin set the title, description, category, external link
 * URL, issued date / period label, and enabled state. Reorder, add, delete, and
 * save-per-row mirror the {@code AdminFaqs} pattern.</p>
 *
 * <p>Documents are NOT registration-gated, so there is no "publicly visible"
 * banner — admin must consciously disable individual rows whose claims rely on
 * registration that has not arrived yet (the seed migration ships every row
 * disabled for exactly this reason).</p>
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';
import logger from '../utils/logger';
import './AdminTransparencyDocuments.css';

interface TransparencyDocument {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  linkUrl: string;
  issuedDate: string | null; // YYYY-MM-DD
  periodLabel: string | null;
  enabled: boolean;
  sortOrder: number;
  updatedAt: string | null;
  updatedBy: string | null;
}

type Draft = Omit<TransparencyDocument, 'updatedAt' | 'updatedBy'>;

function toDraft(d: TransparencyDocument): Draft {
  const { updatedAt: _u, updatedBy: _ub, ...rest } = d;
  return rest;
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\/.+/.test(value.trim());
}

export default function AdminTransparencyDocuments() {
  const navigate = useNavigate();
  const showToast = useToast();

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [originalsById, setOriginalsById] = useState<Map<number, Draft>>(new Map());
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
      const res = await authFetch(`${API_BASE_URL}/admin/transparency-documents`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: TransparencyDocument[] = await res.json();
      const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      const newDrafts = sorted.map(toDraft);
      setDrafts(newDrafts);
      const map = new Map<number, Draft>();
      newDrafts.forEach((d) => map.set(d.id, { ...d }));
      setOriginalsById(map);
    } catch (error) {
      logger.error('AdminTransparencyDocuments', 'Failed to load', error);
      showToast('Failed to load documents', 'error');
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
      (d.description ?? '') !== (o.description ?? '') ||
      (d.category ?? '') !== (o.category ?? '') ||
      d.linkUrl !== o.linkUrl ||
      (d.issuedDate ?? '') !== (o.issuedDate ?? '') ||
      (d.periodLabel ?? '') !== (o.periodLabel ?? '') ||
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

  const knownCategories = useMemo(() => {
    const set = new Set<string>();
    for (const d of drafts) {
      if (d.category && d.category.trim()) set.add(d.category.trim());
    }
    return Array.from(set).sort();
  }, [drafts]);

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
    if (!draft.linkUrl.trim()) {
      showToast('Link URL is required', 'error');
      return;
    }
    if (!isHttpUrl(draft.linkUrl)) {
      showToast('Link URL must start with http:// or https://', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/transparency-documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title.trim(),
          description: draft.description?.trim() ? draft.description.trim() : null,
          category: draft.category?.trim() ? draft.category.trim() : null,
          linkUrl: draft.linkUrl.trim(),
          issuedDate: draft.issuedDate || null,
          periodLabel: draft.periodLabel?.trim() ? draft.periodLabel.trim() : null,
          enabled: draft.enabled,
          sortOrder: draft.sortOrder,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }
      showToast(`Saved "${truncate(draft.title, 40)}"`, 'success');
      await load();
    } catch (error) {
      logger.error('AdminTransparencyDocuments', 'Save failed', error);
      showToast(error instanceof Error ? error.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      const orderedIds = drafts.map((d) => d.id);
      const res = await authFetch(`${API_BASE_URL}/admin/transparency-documents/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Order saved', 'success');
      await load();
    } catch (error) {
      logger.error('AdminTransparencyDocuments', 'Reorder failed', error);
      showToast('Reorder failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async (id: number) => {
    const draft = drafts.find((d) => d.id === id);
    if (!draft) return;
    const ok = window.confirm(`Delete "${truncate(draft.title, 60)}"? This cannot be undone.`);
    if (!ok) return;
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/transparency-documents/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Deleted', 'success');
      await load();
    } catch (error) {
      logger.error('AdminTransparencyDocuments', 'Delete failed', error);
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
      const res = await authFetch(`${API_BASE_URL}/admin/transparency-documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: null,
          category: null,
          linkUrl: 'https://example.com/replace-with-real-link',
          issuedDate: null,
          periodLabel: null,
          enabled: false,
          sortOrder: (drafts.length + 1) * 10,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }
      showToast('Document created — replace the placeholder link, then enable it', 'success');
      setNewTitle('');
      await load();
    } catch (error) {
      logger.error('AdminTransparencyDocuments', 'Create failed', error);
      showToast(error instanceof Error ? error.message : 'Create failed', 'error');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="loading-state" style={{ padding: '2rem' }}>Loading documents…</div>;
  }

  return (
    <div className="admin-transparency">
      <header className="at-header">
        <div>
          <h1>Transparency documents</h1>
          <p className="at-sub">
            Externally-hosted files surfaced on the public <code>/transparency</code>{' '}
            page. We do not store the files themselves — paste a public link (Drive,
            Dropbox, static site). Disable any row whose claims your foundation can't
            yet support.
          </p>
        </div>
        {orderChanged && (
          <button
            className="btn-primary"
            onClick={saveOrder}
            disabled={saving}
            data-testid="documents-save-order"
          >
            {saving ? 'Saving…' : 'Save new order'}
          </button>
        )}
      </header>

      <ol className="at-list" data-testid="documents-list">
        {drafts.map((d, idx) => {
          const dirty = isDirty(d);
          const urlInvalid = d.linkUrl.trim().length > 0 && !isHttpUrl(d.linkUrl);
          return (
            <li key={d.id} className={`at-card ${!d.enabled ? 'at-card--muted' : ''}`}>
              <div className="at-card-order">
                <button
                  className="btn-reorder"
                  onClick={() => move(d.id, -1)}
                  disabled={idx === 0 || saving}
                  aria-label="Move up"
                >
                  ↑
                </button>
                <span className="at-card-position">{idx + 1}</span>
                <button
                  className="btn-reorder"
                  onClick={() => move(d.id, 1)}
                  disabled={idx === drafts.length - 1 || saving}
                  aria-label="Move down"
                >
                  ↓
                </button>
              </div>

              <div className="at-card-body">
                <div className="at-row at-row--top">
                  <div className="at-field at-field--title">
                    <label htmlFor={`title-${d.id}`}>
                      Title <span className="required">*</span>
                    </label>
                    <input
                      id={`title-${d.id}`}
                      type="text"
                      maxLength={200}
                      value={d.title}
                      onChange={(e) => setField(d.id, 'title', e.target.value)}
                    />
                  </div>
                  <label className="at-toggle">
                    <input
                      type="checkbox"
                      checked={d.enabled}
                      onChange={(e) => setField(d.id, 'enabled', e.target.checked)}
                    />
                    <span>Enabled</span>
                  </label>
                </div>

                <div className="at-field">
                  <label htmlFor={`description-${d.id}`}>Description</label>
                  <textarea
                    id={`description-${d.id}`}
                    rows={2}
                    value={d.description ?? ''}
                    onChange={(e) => setField(d.id, 'description', e.target.value || null)}
                    placeholder="One-line summary shown under the title"
                  />
                </div>

                <div className="at-field">
                  <label htmlFor={`linkUrl-${d.id}`}>
                    External link URL <span className="required">*</span>
                  </label>
                  <input
                    id={`linkUrl-${d.id}`}
                    type="url"
                    inputMode="url"
                    maxLength={2000}
                    value={d.linkUrl}
                    onChange={(e) => setField(d.id, 'linkUrl', e.target.value)}
                    aria-invalid={urlInvalid}
                  />
                  <span className={`at-hint ${urlInvalid ? 'at-hint--warn' : ''}`}>
                    {urlInvalid
                      ? 'Must start with http:// or https://'
                      : 'Opens in a new tab. Use a public link anyone can verify.'}
                  </span>
                </div>

                <div className="at-row at-row--triple">
                  <div className="at-field">
                    <label htmlFor={`category-${d.id}`}>Category</label>
                    <input
                      id={`category-${d.id}`}
                      type="text"
                      maxLength={80}
                      list={`at-categories-${d.id}`}
                      placeholder="Governance / Financials / Policies…"
                      value={d.category ?? ''}
                      onChange={(e) => setField(d.id, 'category', e.target.value || null)}
                    />
                    {knownCategories.length > 0 && (
                      <datalist id={`at-categories-${d.id}`}>
                        {knownCategories.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    )}
                  </div>
                  <div className="at-field">
                    <label htmlFor={`issuedDate-${d.id}`}>Issued date</label>
                    <input
                      id={`issuedDate-${d.id}`}
                      type="date"
                      value={d.issuedDate ?? ''}
                      onChange={(e) => setField(d.id, 'issuedDate', e.target.value || null)}
                    />
                  </div>
                  <div className="at-field">
                    <label htmlFor={`periodLabel-${d.id}`}>Period label</label>
                    <input
                      id={`periodLabel-${d.id}`}
                      type="text"
                      maxLength={80}
                      placeholder="FY 2024-25"
                      value={d.periodLabel ?? ''}
                      onChange={(e) => setField(d.id, 'periodLabel', e.target.value || null)}
                    />
                  </div>
                </div>
                <p className="at-period-hint">
                  Shown next to the title. The period label takes precedence over the
                  date when both are set — use it for "FY 2024-25" style ranges.
                </p>

                <div className="at-card-actions">
                  <button
                    className="btn-primary"
                    onClick={() => saveRow(d.id)}
                    disabled={!dirty || saving}
                    data-testid={`save-document-${d.id}`}
                  >
                    {dirty ? 'Save changes' : 'Saved'}
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => deleteRow(d.id)}
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

      <div className="at-new">
        <h2>Add a new document</h2>
        <div className="at-new-row">
          <div className="at-field">
            <label htmlFor="new-document-title">Title</label>
            <input
              id="new-document-title"
              type="text"
              maxLength={200}
              placeholder="e.g. Society registration certificate"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={createRow} disabled={creating}>
            {creating ? 'Creating…' : 'Add document'}
          </button>
        </div>
        <p className="at-new-hint">
          New entries start <strong>disabled</strong> with a placeholder URL. Replace
          the link with the real public URL, set a category and date, then toggle
          Enabled.
        </p>
      </div>
    </div>
  );
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}
