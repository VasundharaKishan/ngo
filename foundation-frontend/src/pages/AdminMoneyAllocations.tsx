/**
 * Admin editor for the "Where your money goes" rows. Each card lets the admin set
 * icon / label / percentage / colour / short description and whether the row is
 * enabled. Reorder, add, delete, and save-per-row all follow the same pattern as
 * {@code AdminTrustBadges} and {@code AdminDonationPresets}.
 *
 * The page surfaces two cross-cutting signals the server returns alongside the list:
 *   - {@code enabledPercentageSum} — flagged when it isn't 100, so admins notice gaps
 *     without the UI hard-blocking their edits.
 *   - {@code publiclyVisible} — false whenever registration is not APPROVED, in which
 *     case visitors don't see the block regardless of what's saved here.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';
import logger from '../utils/logger';
import './AdminMoneyAllocations.css';

interface MoneyAllocation {
  id: number;
  iconEmoji: string;
  label: string;
  percentage: number;
  description: string | null;
  colorHex: string;
  enabled: boolean;
  sortOrder: number;
  updatedAt: string | null;
  updatedBy: string | null;
}

interface AdminListResponse {
  rows: MoneyAllocation[];
  enabledPercentageSum: number;
  publiclyVisible: boolean;
}

type Draft = Omit<MoneyAllocation, 'updatedAt' | 'updatedBy'>;

function toDraft(m: MoneyAllocation): Draft {
  const { updatedAt: _u, updatedBy: _ub, ...rest } = m;
  return rest;
}

export default function AdminMoneyAllocations() {
  const navigate = useNavigate();
  const showToast = useToast();

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [originalsById, setOriginalsById] = useState<Map<number, Draft>>(new Map());
  const [sum, setSum] = useState(0);
  const [publiclyVisible, setPubliclyVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newPercentage, setNewPercentage] = useState('');

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
      const res = await authFetch(`${API_BASE_URL}/admin/money-allocations`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AdminListResponse = await res.json();
      const sorted = [...data.rows].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      const newDrafts = sorted.map(toDraft);
      setDrafts(newDrafts);
      const map = new Map<number, Draft>();
      newDrafts.forEach((d) => map.set(d.id, { ...d }));
      setOriginalsById(map);
      setSum(data.enabledPercentageSum);
      setPubliclyVisible(data.publiclyVisible);
    } catch (error) {
      logger.error('AdminMoneyAllocations', 'Failed to load', error);
      showToast('Failed to load money allocations', 'error');
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
      d.label !== o.label ||
      d.percentage !== o.percentage ||
      (d.description ?? '') !== (o.description ?? '') ||
      d.colorHex !== o.colorHex ||
      d.enabled !== o.enabled ||
      d.sortOrder !== o.sortOrder
    );
  };

  const dirtyIds = useMemo(() => drafts.filter(isDirty).map((d) => d.id), [drafts, originalsById]);

  const orderChanged = useMemo(() => {
    const original = Array.from(originalsById.values()).sort(
      (a, b) => a.sortOrder - b.sortOrder || a.id - b.id
    );
    return drafts.some((d, idx) => original[idx]?.id !== d.id);
  }, [drafts, originalsById]);

  // Live sum reflects the admin's unsaved edits so the banner updates as they type.
  const liveSum = useMemo(
    () => drafts.filter((d) => d.enabled).reduce((acc, d) => acc + (d.percentage || 0), 0),
    [drafts]
  );

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
    if (!draft.label.trim()) {
      showToast('Label is required', 'error');
      return;
    }
    if (draft.percentage < 0 || draft.percentage > 100) {
      showToast('Percentage must be between 0 and 100', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/money-allocations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iconEmoji: draft.iconEmoji,
          label: draft.label,
          percentage: draft.percentage,
          description: draft.description && draft.description.trim() ? draft.description.trim() : null,
          colorHex: draft.colorHex,
          enabled: draft.enabled,
          sortOrder: draft.sortOrder,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }
      showToast(`Saved "${draft.label}"`, 'success');
      await load();
    } catch (error) {
      logger.error('AdminMoneyAllocations', 'Save failed', error);
      showToast(error instanceof Error ? error.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      const orderedIds = drafts.map((d) => d.id);
      const res = await authFetch(`${API_BASE_URL}/admin/money-allocations/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Order saved', 'success');
      await load();
    } catch (error) {
      logger.error('AdminMoneyAllocations', 'Reorder failed', error);
      showToast('Reorder failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async (id: number) => {
    const draft = drafts.find((d) => d.id === id);
    if (!draft) return;
    const ok = window.confirm(`Delete "${draft.label}"? This cannot be undone.`);
    if (!ok) return;
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/money-allocations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast(`Deleted "${draft.label}"`, 'success');
      await load();
    } catch (error) {
      logger.error('AdminMoneyAllocations', 'Delete failed', error);
      showToast('Delete failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const createRow = async () => {
    const label = newLabel.trim();
    const pct = Number(newPercentage);
    if (!label) {
      showToast('Label is required', 'error');
      return;
    }
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      showToast('Percentage must be between 0 and 100', 'error');
      return;
    }
    setCreating(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/money-allocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iconEmoji: '💡',
          label,
          percentage: Math.round(pct),
          description: null,
          colorHex: '#0ea5e9',
          enabled: true,
          sortOrder: (drafts.length + 1) * 10,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }
      showToast(`Created "${label}"`, 'success');
      setNewLabel('');
      setNewPercentage('');
      await load();
    } catch (error) {
      logger.error('AdminMoneyAllocations', 'Create failed', error);
      showToast(error instanceof Error ? error.message : 'Create failed', 'error');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="loading-state" style={{ padding: '2rem' }}>Loading money allocations…</div>;

  const sumOff = liveSum !== 100;

  return (
    <div className="admin-money-allocations">
      <header className="ama-header">
        <div>
          <h1>Where the money goes</h1>
          <p className="ama-sub">
            A transparent breakdown of how the foundation deploys donations. Each enabled row
            contributes to the disclosed percentage total; ideally the enabled rows sum to
            exactly 100%.
          </p>
        </div>
        {orderChanged && (
          <button className="btn-primary" onClick={saveOrder} disabled={saving} data-testid="money-allocations-save-order">
            {saving ? 'Saving…' : 'Save new order'}
          </button>
        )}
      </header>

      {!publiclyVisible && (
        <div className="ama-banner ama-banner--info" role="status">
          <strong>Not publicly visible.</strong> The foundation is not in APPROVED status, so
          this block is hidden from visitors regardless of what's saved below. Admin edits
          are still persisted — they'll go live once registration moves to APPROVED.
        </div>
      )}

      <div className={`ama-sum ${sumOff ? 'ama-sum--warn' : 'ama-sum--ok'}`} role="status">
        <span className="ama-sum-label">Enabled rows currently sum to</span>
        <span className="ama-sum-value">{liveSum}%</span>
        {sumOff && (
          <span className="ama-sum-hint">
            {liveSum < 100
              ? `Add ${100 - liveSum}% across enabled rows.`
              : `Remove ${liveSum - 100}% to balance.`}
          </span>
        )}
        {!sumOff && <span className="ama-sum-hint">Balanced — 100% disclosed.</span>}
        <span className="ama-sum-server">(last saved: {sum}%)</span>
      </div>

      <ol className="ama-list" data-testid="money-allocations-list">
        {drafts.map((m, idx) => {
          const dirty = isDirty(m);
          return (
            <li key={m.id} className={`ama-card ${!m.enabled ? 'ama-card--muted' : ''}`}>
              <div className="ama-card-order">
                <button
                  className="btn-reorder"
                  onClick={() => move(m.id, -1)}
                  disabled={idx === 0 || saving}
                  aria-label={`Move ${m.label} up`}
                >
                  ↑
                </button>
                <span className="ama-card-position">{idx + 1}</span>
                <button
                  className="btn-reorder"
                  onClick={() => move(m.id, 1)}
                  disabled={idx === drafts.length - 1 || saving}
                  aria-label={`Move ${m.label} down`}
                >
                  ↓
                </button>
              </div>

              <div className="ama-card-body">
                <div className="ama-row">
                  <div className="ama-field ama-field--icon">
                    <label htmlFor={`icon-${m.id}`}>Icon</label>
                    <input
                      id={`icon-${m.id}`}
                      type="text"
                      maxLength={16}
                      value={m.iconEmoji}
                      onChange={(e) => setField(m.id, 'iconEmoji', e.target.value)}
                    />
                  </div>
                  <div className="ama-field ama-field--label">
                    <label htmlFor={`label-${m.id}`}>
                      Label <span className="required">*</span>
                    </label>
                    <input
                      id={`label-${m.id}`}
                      type="text"
                      maxLength={120}
                      value={m.label}
                      onChange={(e) => setField(m.id, 'label', e.target.value)}
                    />
                  </div>
                  <div className="ama-field ama-field--percent">
                    <label htmlFor={`pct-${m.id}`}>Percentage</label>
                    <input
                      id={`pct-${m.id}`}
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={m.percentage}
                      onChange={(e) => setField(m.id, 'percentage', Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    />
                  </div>
                  <div className="ama-field ama-field--color">
                    <label htmlFor={`color-${m.id}`}>Colour</label>
                    <div className="ama-color-combo">
                      <input
                        id={`color-${m.id}`}
                        type="color"
                        value={m.colorHex.length === 7 ? m.colorHex : '#0ea5e9'}
                        onChange={(e) => setField(m.id, 'colorHex', e.target.value)}
                      />
                      <input
                        type="text"
                        className="ama-color-text"
                        maxLength={9}
                        value={m.colorHex}
                        onChange={(e) => setField(m.id, 'colorHex', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="ama-field">
                  <label htmlFor={`desc-${m.id}`}>Short description</label>
                  <textarea
                    id={`desc-${m.id}`}
                    rows={2}
                    maxLength={500}
                    value={m.description ?? ''}
                    onChange={(e) => setField(m.id, 'description', e.target.value)}
                    placeholder="e.g. School fees, books, uniforms, and tuition for children from low-income families."
                  />
                  <small className="field-description">{(m.description ?? '').length}/500 characters</small>
                </div>

                <div className="ama-toggles">
                  <label className="ama-toggle">
                    <input
                      type="checkbox"
                      checked={m.enabled}
                      onChange={(e) => setField(m.id, 'enabled', e.target.checked)}
                    />
                    Enabled (counts toward the 100% total)
                  </label>
                </div>

                <div className="ama-card-actions">
                  <button
                    className="btn-primary"
                    onClick={() => saveRow(m.id)}
                    disabled={!dirty || saving}
                    data-testid={`money-allocations-save-${m.id}`}
                  >
                    {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
                  </button>
                  <button
                    className="btn-danger-outline"
                    onClick={() => deleteRow(m.id)}
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

      <section className="ama-new" aria-label="Add new allocation">
        <h2>Add a new allocation</h2>
        <div className="ama-new-row">
          <div className="ama-field">
            <label htmlFor="new-label">Label</label>
            <input
              id="new-label"
              type="text"
              maxLength={120}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Library & reading programs"
            />
          </div>
          <div className="ama-field">
            <label htmlFor="new-pct">Percentage</label>
            <input
              id="new-pct"
              type="number"
              min={0}
              max={100}
              step={1}
              value={newPercentage}
              onChange={(e) => setNewPercentage(e.target.value)}
              placeholder="e.g. 10"
            />
          </div>
          <button
            className="btn-primary"
            onClick={createRow}
            disabled={creating || !newLabel.trim()}
            data-testid="money-allocations-create"
          >
            {creating ? 'Creating…' : 'Add allocation'}
          </button>
        </div>
      </section>

      {dirtyIds.length > 0 && (
        <div className="ama-dirty-banner">
          Unsaved changes on {dirtyIds.length} row{dirtyIds.length === 1 ? '' : 's'}. Click
          Save on each card to persist.
        </div>
      )}
    </div>
  );
}
