/**
 * Admin editor for FAQs ({@code /admin/faqs}). Each card lets the admin set the
 * question, answer, optional category, and enabled state. Reorder, add, delete,
 * and save-per-row mirror the {@code AdminStories} pattern.
 *
 * <p>FAQs are NOT registration-gated, so there is no "publicly visible" banner.
 * Admin must consciously disable individual FAQs whose claims depend on registration
 * status (e.g. the 80G tax-deductibility entry, which the seed migration leaves
 * disabled by default).</p>
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';
import logger from '../utils/logger';
import './AdminFaqs.css';

interface Faq {
  id: number;
  question: string;
  answer: string;
  category: string | null;
  enabled: boolean;
  sortOrder: number;
  updatedAt: string | null;
  updatedBy: string | null;
}

type Draft = Omit<Faq, 'updatedAt' | 'updatedBy'>;

function toDraft(f: Faq): Draft {
  const { updatedAt: _u, updatedBy: _ub, ...rest } = f;
  return rest;
}

const ANSWER_SOFT_LIMIT = 1200; // characters — past this the card warns admin

export default function AdminFaqs() {
  const navigate = useNavigate();
  const showToast = useToast();

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [originalsById, setOriginalsById] = useState<Map<number, Draft>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');

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
      const res = await authFetch(`${API_BASE_URL}/admin/faqs`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Faq[] = await res.json();
      const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      const newDrafts = sorted.map(toDraft);
      setDrafts(newDrafts);
      const map = new Map<number, Draft>();
      newDrafts.forEach((d) => map.set(d.id, { ...d }));
      setOriginalsById(map);
    } catch (error) {
      logger.error('AdminFaqs', 'Failed to load', error);
      showToast('Failed to load FAQs', 'error');
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
      d.question !== o.question ||
      d.answer !== o.answer ||
      (d.category ?? '') !== (o.category ?? '') ||
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
    if (!draft.question.trim()) {
      showToast('Question is required', 'error');
      return;
    }
    if (!draft.answer.trim()) {
      showToast('Answer is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/faqs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: draft.question.trim(),
          answer: draft.answer.trim(),
          category: draft.category?.trim() ? draft.category.trim() : null,
          enabled: draft.enabled,
          sortOrder: draft.sortOrder,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }
      showToast(`Saved "${truncate(draft.question, 40)}"`, 'success');
      await load();
    } catch (error) {
      logger.error('AdminFaqs', 'Save failed', error);
      showToast(error instanceof Error ? error.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      const orderedIds = drafts.map((d) => d.id);
      const res = await authFetch(`${API_BASE_URL}/admin/faqs/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Order saved', 'success');
      await load();
    } catch (error) {
      logger.error('AdminFaqs', 'Reorder failed', error);
      showToast('Reorder failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async (id: number) => {
    const draft = drafts.find((d) => d.id === id);
    if (!draft) return;
    const ok = window.confirm(`Delete "${truncate(draft.question, 60)}"? This cannot be undone.`);
    if (!ok) return;
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/faqs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Deleted', 'success');
      await load();
    } catch (error) {
      logger.error('AdminFaqs', 'Delete failed', error);
      showToast('Delete failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const createRow = async () => {
    const question = newQuestion.trim();
    if (!question) {
      showToast('Question is required', 'error');
      return;
    }
    setCreating(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/faqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          answer: 'Write the answer here. Keep it brief — a paragraph or two at most.',
          category: null,
          enabled: false,
          sortOrder: (drafts.length + 1) * 10,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }
      showToast('FAQ created — fill in the answer and enable it', 'success');
      setNewQuestion('');
      await load();
    } catch (error) {
      logger.error('AdminFaqs', 'Create failed', error);
      showToast(error instanceof Error ? error.message : 'Create failed', 'error');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="loading-state" style={{ padding: '2rem' }}>Loading FAQs…</div>;
  }

  return (
    <div className="admin-faqs">
      <header className="af-header">
        <div>
          <h1>FAQs</h1>
          <p className="af-sub">
            Question-and-answer entries shown on the public <code>/faq</code> page.
            Disable any entry that makes claims your foundation can't yet support
            (for example tax-deductibility before 80G certification arrives).
          </p>
        </div>
        {orderChanged && (
          <button
            className="btn-primary"
            onClick={saveOrder}
            disabled={saving}
            data-testid="faqs-save-order"
          >
            {saving ? 'Saving…' : 'Save new order'}
          </button>
        )}
      </header>

      <ol className="af-list" data-testid="faqs-list">
        {drafts.map((f, idx) => {
          const dirty = isDirty(f);
          const overSoftLimit = f.answer.length > ANSWER_SOFT_LIMIT;
          return (
            <li key={f.id} className={`af-card ${!f.enabled ? 'af-card--muted' : ''}`}>
              <div className="af-card-order">
                <button
                  className="btn-reorder"
                  onClick={() => move(f.id, -1)}
                  disabled={idx === 0 || saving}
                  aria-label="Move up"
                >
                  ↑
                </button>
                <span className="af-card-position">{idx + 1}</span>
                <button
                  className="btn-reorder"
                  onClick={() => move(f.id, 1)}
                  disabled={idx === drafts.length - 1 || saving}
                  aria-label="Move down"
                >
                  ↓
                </button>
              </div>

              <div className="af-card-body">
                <div className="af-row af-row--top">
                  <div className="af-field af-field--question">
                    <label htmlFor={`question-${f.id}`}>
                      Question <span className="required">*</span>
                    </label>
                    <input
                      id={`question-${f.id}`}
                      type="text"
                      maxLength={500}
                      value={f.question}
                      onChange={(e) => setField(f.id, 'question', e.target.value)}
                    />
                  </div>
                  <label className="af-toggle">
                    <input
                      type="checkbox"
                      checked={f.enabled}
                      onChange={(e) => setField(f.id, 'enabled', e.target.checked)}
                    />
                    <span>Enabled</span>
                  </label>
                </div>

                <div className="af-field">
                  <label htmlFor={`answer-${f.id}`}>
                    Answer <span className="required">*</span>
                  </label>
                  <textarea
                    id={`answer-${f.id}`}
                    rows={5}
                    value={f.answer}
                    onChange={(e) => setField(f.id, 'answer', e.target.value)}
                  />
                  <span className={`af-counter ${overSoftLimit ? 'af-counter--warn' : ''}`}>
                    {f.answer.length} characters
                    {overSoftLimit && ` — over ${ANSWER_SOFT_LIMIT}, consider trimming for readability`}
                  </span>
                </div>

                <div className="af-row af-row--bottom">
                  <div className="af-field">
                    <label htmlFor={`category-${f.id}`}>Category</label>
                    <input
                      id={`category-${f.id}`}
                      type="text"
                      maxLength={80}
                      list={`af-categories-${f.id}`}
                      placeholder="About us / Donations / Programmes…"
                      value={f.category ?? ''}
                      onChange={(e) => setField(f.id, 'category', e.target.value || null)}
                    />
                    {knownCategories.length > 0 && (
                      <datalist id={`af-categories-${f.id}`}>
                        {knownCategories.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    )}
                  </div>
                </div>

                <div className="af-card-actions">
                  <button
                    className="btn-primary"
                    onClick={() => saveRow(f.id)}
                    disabled={!dirty || saving}
                    data-testid={`save-faq-${f.id}`}
                  >
                    {dirty ? 'Save changes' : 'Saved'}
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => deleteRow(f.id)}
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

      <div className="af-new">
        <h2>Add a new FAQ</h2>
        <div className="af-new-row">
          <div className="af-field">
            <label htmlFor="new-faq-question">Question</label>
            <input
              id="new-faq-question"
              type="text"
              maxLength={500}
              placeholder="Type the question donors are asking"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={createRow} disabled={creating}>
            {creating ? 'Creating…' : 'Add FAQ'}
          </button>
        </div>
        <p className="af-new-hint">
          New FAQs start <strong>disabled</strong> with placeholder text. Fill in the
          answer, set a category, then toggle Enabled.
        </p>
      </div>
    </div>
  );
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}
