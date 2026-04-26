/**
 * Admin editor for the donation-form quick-select amounts. Renders the ordered list of
 * presets with:
 *   - Amount (shown in rupees for the admin, stored in paise to match Stripe and the public form)
 *   - Optional short label (e.g. "One month of lunches")
 *   - Enabled toggle
 *   - Default radio — exactly one row may be default; clearing all is supported too
 *   - Up/down reorder, add/delete
 *
 * The single-default invariant is enforced server-side by
 * {@code DonationPresetService.setDefault}, so the UI just sends the chosen id to
 * {@code POST /{id}/default} and reloads.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';
import logger from '../utils/logger';
import './AdminDonationPresets.css';

interface DonationPreset {
  id: number;
  amountMinorUnits: number;
  label: string | null;
  enabled: boolean;
  isDefault: boolean;
  sortOrder: number;
  updatedAt: string | null;
  updatedBy: string | null;
}

type Draft = Omit<DonationPreset, 'updatedAt' | 'updatedBy' | 'isDefault'>;

function toDraft(p: DonationPreset): Draft {
  const { updatedAt: _u, updatedBy: _ub, isDefault: _d, ...rest } = p;
  return rest;
}

/** Rupees input <-> paise storage. Empty string -> 0. */
function rupeesToPaise(rupees: string): number {
  const n = Number(rupees);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function paiseToRupeesInput(paise: number): string {
  if (!Number.isFinite(paise)) return '';
  // Admin edits in rupees without decimals for the seeded values; keep it simple.
  return (paise / 100).toString();
}

export default function AdminDonationPresets() {
  const navigate = useNavigate();
  const showToast = useToast();

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [originalsById, setOriginalsById] = useState<Map<number, Draft>>(new Map());
  const [defaultId, setDefaultId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRupees, setNewRupees] = useState('');
  const [newLabel, setNewLabel] = useState('');

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
      const res = await authFetch(`${API_BASE_URL}/admin/donation-presets`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DonationPreset[] = await res.json();
      const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      const newDrafts = sorted.map(toDraft);
      setDrafts(newDrafts);
      const map = new Map<number, Draft>();
      newDrafts.forEach((d) => map.set(d.id, { ...d }));
      setOriginalsById(map);
      const def = sorted.find((p) => p.isDefault);
      setDefaultId(def ? def.id : null);
    } catch (error) {
      logger.error('AdminDonationPresets', 'Failed to load', error);
      showToast('Failed to load donation presets', 'error');
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
      d.amountMinorUnits !== o.amountMinorUnits ||
      (d.label ?? '') !== (o.label ?? '') ||
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

  const savePreset = async (id: number) => {
    const draft = drafts.find((d) => d.id === id);
    if (!draft) return;
    if (!draft.amountMinorUnits || draft.amountMinorUnits <= 0) {
      showToast('Amount must be greater than zero', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/donation-presets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountMinorUnits: draft.amountMinorUnits,
          label: draft.label && draft.label.trim() ? draft.label.trim() : null,
          enabled: draft.enabled,
          sortOrder: draft.sortOrder,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }
      showToast(`Saved ₹${draft.amountMinorUnits / 100}`, 'success');
      await load();
    } catch (error) {
      logger.error('AdminDonationPresets', 'Save failed', error);
      showToast(error instanceof Error ? error.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      const orderedIds = drafts.map((d) => d.id);
      const res = await authFetch(`${API_BASE_URL}/admin/donation-presets/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Order saved', 'success');
      await load();
    } catch (error) {
      logger.error('AdminDonationPresets', 'Reorder failed', error);
      showToast('Reorder failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deletePreset = async (id: number) => {
    const draft = drafts.find((d) => d.id === id);
    if (!draft) return;
    const ok = window.confirm(
      `Delete ₹${draft.amountMinorUnits / 100}${draft.label ? ` (${draft.label})` : ''}? This cannot be undone.`
    );
    if (!ok) return;
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/donation-presets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Deleted preset', 'success');
      await load();
    } catch (error) {
      logger.error('AdminDonationPresets', 'Delete failed', error);
      showToast('Delete failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const createPreset = async () => {
    const amount = rupeesToPaise(newRupees);
    if (amount <= 0) {
      showToast('Enter a positive amount in rupees', 'error');
      return;
    }
    setCreating(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/donation-presets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountMinorUnits: amount,
          label: newLabel.trim() ? newLabel.trim() : null,
          enabled: true,
          sortOrder: (drafts.length + 1) * 10,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }
      showToast(`Created ₹${amount / 100}`, 'success');
      setNewRupees('');
      setNewLabel('');
      await load();
    } catch (error) {
      logger.error('AdminDonationPresets', 'Create failed', error);
      showToast(error instanceof Error ? error.message : 'Create failed', 'error');
    } finally {
      setCreating(false);
    }
  };

  const setAsDefault = async (id: number) => {
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/donation-presets/${id}/default`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }
      showToast('Default updated', 'success');
      await load();
    } catch (error) {
      logger.error('AdminDonationPresets', 'Set default failed', error);
      showToast(error instanceof Error ? error.message : 'Set default failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const clearDefault = async () => {
    const ok = window.confirm('Clear the default preset? The donation form will preselect the first enabled amount instead.');
    if (!ok) return;
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/donation-presets/default`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Cleared default', 'success');
      await load();
    } catch (error) {
      logger.error('AdminDonationPresets', 'Clear default failed', error);
      showToast('Clear default failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-state" style={{ padding: '2rem' }}>Loading donation presets…</div>;

  return (
    <div className="admin-donation-presets">
      <header className="adp-header">
        <div>
          <h1>Donation preset amounts</h1>
          <p className="adp-sub">
            The quick-select buttons on the donation form. Amounts are entered in rupees but
            stored internally in paise to match the payment processor. Exactly one preset
            may be marked "default" — that's the one preselected when a donor opens the form.
          </p>
        </div>
        {orderChanged && (
          <button className="btn-primary" onClick={saveOrder} disabled={saving} data-testid="donation-presets-save-order">
            {saving ? 'Saving…' : 'Save new order'}
          </button>
        )}
      </header>

      <ol className="adp-list" data-testid="donation-presets-list">
        {drafts.map((p, idx) => {
          const dirty = isDirty(p);
          const isDefault = defaultId === p.id;
          const canBeDefault = p.enabled;
          return (
            <li key={p.id} className={`adp-card ${!p.enabled ? 'adp-card--muted' : ''}`}>
              <div className="adp-card-order">
                <button
                  className="btn-reorder"
                  onClick={() => move(p.id, -1)}
                  disabled={idx === 0 || saving}
                  aria-label={`Move ₹${p.amountMinorUnits / 100} up`}
                >
                  ↑
                </button>
                <span className="adp-card-position">{idx + 1}</span>
                <button
                  className="btn-reorder"
                  onClick={() => move(p.id, 1)}
                  disabled={idx === drafts.length - 1 || saving}
                  aria-label={`Move ₹${p.amountMinorUnits / 100} down`}
                >
                  ↓
                </button>
              </div>

              <div className="adp-card-body">
                <div className="adp-row">
                  <div className="adp-field adp-field--amount">
                    <label htmlFor={`amount-${p.id}`}>Amount (₹)</label>
                    <input
                      id={`amount-${p.id}`}
                      type="number"
                      min="1"
                      step="1"
                      value={paiseToRupeesInput(p.amountMinorUnits)}
                      onChange={(e) => setField(p.id, 'amountMinorUnits', rupeesToPaise(e.target.value))}
                    />
                    <small className="field-description">Stored as {p.amountMinorUnits} paise.</small>
                  </div>
                  <div className="adp-field adp-field--label">
                    <label htmlFor={`label-${p.id}`}>Label (optional)</label>
                    <input
                      id={`label-${p.id}`}
                      type="text"
                      maxLength={40}
                      value={p.label ?? ''}
                      onChange={(e) => setField(p.id, 'label', e.target.value)}
                      placeholder="e.g. One month of meals"
                    />
                    <small className="field-description">Shown under the amount button.</small>
                  </div>
                </div>

                <div className="adp-toggles">
                  <label className="adp-toggle">
                    <input
                      type="checkbox"
                      checked={p.enabled}
                      onChange={(e) => setField(p.id, 'enabled', e.target.checked)}
                    />
                    Enabled
                  </label>
                  <label className={`adp-toggle ${!canBeDefault ? 'adp-toggle--disabled' : ''}`}>
                    <input
                      type="radio"
                      name="donation-preset-default"
                      checked={isDefault}
                      disabled={!canBeDefault || saving}
                      onChange={() => setAsDefault(p.id)}
                    />
                    Default (preselected on donation form)
                  </label>
                </div>

                {!canBeDefault && isDefault && (
                  <small className="adp-gate-notice">
                    This preset is the default but is currently disabled — the donation form will
                    fall back to the first enabled amount.
                  </small>
                )}

                <div className="adp-card-actions">
                  <button
                    className="btn-primary"
                    onClick={() => savePreset(p.id)}
                    disabled={!dirty || saving}
                    data-testid={`donation-presets-save-${p.id}`}
                  >
                    {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
                  </button>
                  <button
                    className="btn-danger-outline"
                    onClick={() => deletePreset(p.id)}
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

      {defaultId !== null && (
        <div className="adp-clear-default">
          <button className="btn-link" onClick={clearDefault} disabled={saving}>
            Clear default — fall back to first enabled amount
          </button>
        </div>
      )}

      <section className="adp-new" aria-label="Add new preset">
        <h2>Add a new preset</h2>
        <div className="adp-new-row">
          <div className="adp-field">
            <label htmlFor="new-rupees">Amount (₹)</label>
            <input
              id="new-rupees"
              type="number"
              min="1"
              step="1"
              value={newRupees}
              onChange={(e) => setNewRupees(e.target.value)}
              placeholder="e.g. 250"
            />
          </div>
          <div className="adp-field">
            <label htmlFor="new-label">Label (optional)</label>
            <input
              id="new-label"
              type="text"
              maxLength={40}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. One school kit"
            />
          </div>
          <button
            className="btn-primary"
            onClick={createPreset}
            disabled={creating || !newRupees.trim()}
            data-testid="donation-presets-create"
          >
            {creating ? 'Creating…' : 'Add preset'}
          </button>
        </div>
      </section>

      {dirtyIds.length > 0 && (
        <div className="adp-dirty-banner">
          Unsaved changes on {dirtyIds.length} preset{dirtyIds.length === 1 ? '' : 's'}. Click
          Save on each card to persist.
        </div>
      )}
    </div>
  );
}
