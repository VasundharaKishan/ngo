/**
 * Admin viewer for contact-form submissions ({@code /admin/contact-submissions}).
 *
 * <p>Submissions flow through three statuses: NEW → READ → ARCHIVED.
 * The page shows a filterable list, lets the admin mark messages as read,
 * archive them, and add an internal note. No editing of the visitor's
 * message — what they wrote is immutable.</p>
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';
import logger from '../utils/logger';
import './AdminContactSubmissions.css';

interface Submission {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  clientIp: string | null;
  status: string; // NEW | READ | ARCHIVED
  adminNote: string | null;
  createdAt: string;
  readAt: string | null;
  readBy: string | null;
}

type StatusFilter = 'ALL' | 'NEW' | 'READ' | 'ARCHIVED';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AdminContactSubmissions() {
  const navigate = useNavigate();
  const showToast = useToast();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [noteEdits, setNoteEdits] = useState<Map<number, string>>(new Map());
  const [acting, setActing] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('adminUser');
    if (!user) {
      navigate('/admin/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const load = async (statusParam?: string) => {
    try {
      const qs = statusParam && statusParam !== 'ALL' ? `?status=${statusParam}` : '';
      const res = await authFetch(`${API_BASE_URL}/admin/contact-submissions${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Submission[] = await res.json();
      setSubmissions(data);
    } catch (error) {
      logger.error('AdminContactSubmissions', 'Failed to load', error);
      showToast('Failed to load submissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const changeFilter = (f: StatusFilter) => {
    setFilter(f);
    setLoading(true);
    load(f);
  };

  const markRead = async (id: number) => {
    setActing(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/contact-submissions/${id}/read`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Marked as read', 'success');
      await load(filter);
    } catch (error) {
      logger.error('AdminContactSubmissions', 'Mark-read failed', error);
      showToast('Failed to update status', 'error');
    } finally {
      setActing(false);
    }
  };

  const archive = async (id: number) => {
    setActing(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/contact-submissions/${id}/archive`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Archived', 'success');
      await load(filter);
    } catch (error) {
      logger.error('AdminContactSubmissions', 'Archive failed', error);
      showToast('Failed to archive', 'error');
    } finally {
      setActing(false);
    }
  };

  const saveNote = async (id: number) => {
    const note = noteEdits.get(id) ?? '';
    setActing(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/contact-submissions/${id}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim() || null }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Note saved', 'success');
      setNoteEdits((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      await load(filter);
    } catch (error) {
      logger.error('AdminContactSubmissions', 'Note save failed', error);
      showToast('Failed to save note', 'error');
    } finally {
      setActing(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const newCount = submissions.filter((s) => s.status === 'NEW').length;

  if (loading) {
    return <div className="loading-state" style={{ padding: '2rem' }}>Loading submissions…</div>;
  }

  return (
    <div className="admin-contact-submissions">
      <header className="acs-header">
        <div>
          <h1>
            Contact submissions
            {newCount > 0 && <span className="acs-badge">{newCount} new</span>}
          </h1>
          <p className="acs-sub">
            Messages from the public <code>/contact</code> form. Mark as read once
            you've reviewed, archive when done.
          </p>
        </div>
      </header>

      <div className="acs-filters" role="tablist">
        {(['ALL', 'NEW', 'READ', 'ARCHIVED'] as StatusFilter[]).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            className={`acs-filter-btn ${filter === f ? 'acs-filter-btn--active' : ''}`}
            onClick={() => changeFilter(f)}
          >
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {submissions.length === 0 && (
        <div className="acs-empty">
          {filter === 'ALL'
            ? 'No contact submissions yet.'
            : `No ${filter.toLowerCase()} submissions.`}
        </div>
      )}

      <ul className="acs-list" data-testid="contact-submissions-list">
        {submissions.map((s) => {
          const expanded = expandedId === s.id;
          const editingNote = noteEdits.has(s.id);
          const noteValue = editingNote ? noteEdits.get(s.id)! : s.adminNote ?? '';
          return (
            <li
              key={s.id}
              className={`acs-card acs-card--${s.status.toLowerCase()}`}
              data-testid={`submission-${s.id}`}
            >
              <button
                className="acs-card-header"
                onClick={() => toggleExpand(s.id)}
                aria-expanded={expanded}
              >
                <div className="acs-card-meta">
                  <span className={`acs-status-dot acs-status-dot--${s.status.toLowerCase()}`} />
                  <strong className="acs-card-name">{s.name}</strong>
                  <span className="acs-card-email">{s.email}</span>
                </div>
                <div className="acs-card-right">
                  <span className="acs-card-subject">{s.subject}</span>
                  <time className="acs-card-time" title={formatDate(s.createdAt)}>
                    {timeAgo(s.createdAt)}
                  </time>
                  <span className="acs-expand-icon" aria-hidden="true">
                    {expanded ? '−' : '+'}
                  </span>
                </div>
              </button>

              {expanded && (
                <div className="acs-card-body">
                  <div className="acs-message">
                    {s.message.split(/\n{2,}/).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>

                  <div className="acs-detail-row">
                    <span className="acs-detail-label">Received</span>
                    <span>{formatDate(s.createdAt)}</span>
                  </div>
                  {s.readAt && (
                    <div className="acs-detail-row">
                      <span className="acs-detail-label">Read by</span>
                      <span>
                        {s.readBy} · {formatDate(s.readAt)}
                      </span>
                    </div>
                  )}
                  {s.clientIp && (
                    <div className="acs-detail-row">
                      <span className="acs-detail-label">IP</span>
                      <span className="acs-ip">{s.clientIp}</span>
                    </div>
                  )}

                  <div className="acs-note-section">
                    <label htmlFor={`note-${s.id}`} className="acs-detail-label">
                      Admin note
                    </label>
                    <textarea
                      id={`note-${s.id}`}
                      rows={2}
                      value={noteValue}
                      placeholder="Internal note (not visible to the sender)"
                      onChange={(e) =>
                        setNoteEdits((prev) => new Map(prev).set(s.id, e.target.value))
                      }
                    />
                    {editingNote && noteValue !== (s.adminNote ?? '') && (
                      <button
                        className="btn-small btn-primary"
                        onClick={() => saveNote(s.id)}
                        disabled={acting}
                      >
                        Save note
                      </button>
                    )}
                  </div>

                  <div className="acs-card-actions">
                    {s.status === 'NEW' && (
                      <button
                        className="btn-small btn-primary"
                        onClick={() => markRead(s.id)}
                        disabled={acting}
                      >
                        Mark as read
                      </button>
                    )}
                    {s.status !== 'ARCHIVED' && (
                      <button
                        className="btn-small btn-secondary"
                        onClick={() => archive(s.id)}
                        disabled={acting}
                      >
                        Archive
                      </button>
                    )}
                    <a
                      href={`mailto:${s.email}?subject=Re: ${encodeURIComponent(s.subject)}`}
                      className="btn-small btn-outline"
                    >
                      Reply via email
                    </a>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
