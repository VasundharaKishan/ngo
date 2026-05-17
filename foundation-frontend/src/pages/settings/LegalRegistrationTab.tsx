import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { API_BASE_URL } from '../../api';
import { authFetch } from '../../utils/auth';
import logger from '../../utils/logger';
import type { RegistrationInfo, RegistrationStatus, TabRef } from './types';
import './LegalRegistrationTab.css';

interface Props {
  showToast: (msg: string, type: 'success' | 'error') => void;
}

const EMPTY: RegistrationInfo = {
  status: 'UNREGISTERED',
  registrationNumber: null,
  section8Number: null,
  eightyGNumber: null,
  fcraNumber: null,
  panNumber: null,
  appliedDate: null,
  approvedDate: null,
  disclosureOverride: null,
  eightyGActive: false,
  fcraActive: false,
  updatedAt: null,
  updatedBy: null,
};

const STATUS_DESCRIPTIONS: Record<RegistrationStatus, { title: string; body: string }> = {
  UNREGISTERED: {
    title: 'Not registered yet',
    body: 'Public site will show "Community-led foundation · Registration in progress". 80G and FCRA claims are hidden everywhere.',
  },
  APPLIED: {
    title: 'Registration filed',
    body: 'Public site will show that an application has been submitted. Identifiers are still hidden until approval.',
  },
  APPROVED: {
    title: 'Fully registered',
    body: 'Section 8 / 80G / FCRA numbers (when entered below) become visible on the public site. 80G receipts can be issued.',
  },
};

const PAGES_AFFECTED = [
  'Home page hero subtitle',
  'Home page trust strip',
  'Footer disclosure line',
  'Donation form 80G checkbox',
  'Donation receipt email',
  'About page registration section',
  'FAQ answers on legal status',
  'Transparency page',
  'Contact page signature',
  'Recurring donation terms',
  'Corporate / CSR landing',
];

const LegalRegistrationTab = forwardRef<TabRef, Props>(({ showToast }, ref) => {
  const [info, setInfo] = useState<RegistrationInfo>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/registration`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: RegistrationInfo = await res.json();
      setInfo(data);
    } catch (error) {
      logger.error('LegalRegistrationTab', 'Failed to load registration info', error);
      showToast('Failed to load registration info', 'error');
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    try {
      const payload = {
        status: info.status,
        registrationNumber: info.registrationNumber ?? null,
        section8Number: info.section8Number ?? null,
        eightyGNumber: info.eightyGNumber ?? null,
        fcraNumber: info.fcraNumber ?? null,
        panNumber: info.panNumber ?? null,
        appliedDate: info.appliedDate ?? null,
        approvedDate: info.approvedDate ?? null,
        disclosureOverride: info.disclosureOverride ?? null,
      };
      const res = await authFetch(`${API_BASE_URL}/admin/registration`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(errBody || `HTTP ${res.status}`);
      }
      const saved: RegistrationInfo = await res.json();
      setInfo(saved);
      showToast('Registration status saved', 'success');
    } catch (error) {
      logger.error('LegalRegistrationTab', 'Failed to save registration info', error);
      const msg = error instanceof Error ? error.message : 'Failed to save';
      showToast(msg, 'error');
    }
  };

  useImperativeHandle(ref, () => ({ save }));

  const setField = <K extends keyof RegistrationInfo>(key: K, value: RegistrationInfo[K]) => {
    setInfo((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="loading-state">Loading registration info…</div>;

  const isApproved = info.status === 'APPROVED';
  const certsLocked = !isApproved;

  return (
    <div className="tab-panel legal-reg-tab">
      <h2>Legal / Registration</h2>
      <p className="tab-description">
        This single setting drives conditional content across the public site. Change it carefully —
        only mark the foundation as Registered once you have the certificates in hand.
      </p>

      {/* Status selection */}
      <div className="settings-section">
        <h3>Registration status</h3>
        <div className="status-cards" role="radiogroup" aria-label="Registration status">
          {(['UNREGISTERED', 'APPLIED', 'APPROVED'] as RegistrationStatus[]).map((s) => (
            <label
              key={s}
              className={`status-card ${info.status === s ? 'selected' : ''}`}
              data-testid={`registration-status-${s}`}
            >
              <input
                type="radio"
                name="registration-status"
                value={s}
                checked={info.status === s}
                onChange={() => setField('status', s)}
              />
              <div className="status-card-body">
                <strong>{STATUS_DESCRIPTIONS[s].title}</strong>
                <p>{STATUS_DESCRIPTIONS[s].body}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Warning when UNREGISTERED */}
      {info.status === 'UNREGISTERED' && (
        <div className="warning-banner" role="status">
          <strong>Public claims locked.</strong> While in this state, the public site cannot
          show 80G / FCRA / Section 8 numbers. All “registered” badges are hidden automatically.
        </div>
      )}

      {/* Identifiers */}
      <div className="settings-section">
        <h3>Identifiers</h3>

        <div className="form-group">
          <label htmlFor="reg-number">Primary registration number</label>
          <input
            id="reg-number"
            type="text"
            value={info.registrationNumber ?? ''}
            onChange={(e) => setField('registrationNumber', e.target.value || null)}
            placeholder="e.g. U85300DL2026NPL123456"
          />
          <small className="field-description">Shown publicly only when status is Registered.</small>
        </div>

        <div className="form-group">
          <label htmlFor="pan">PAN</label>
          <input
            id="pan"
            type="text"
            maxLength={10}
            value={info.panNumber ?? ''}
            onChange={(e) => setField('panNumber', e.target.value.toUpperCase() || null)}
            placeholder="AAAAA9999A"
          />
          <small className="field-description">5 letters, 4 digits, 1 letter. Used on 80G receipts.</small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="section8">
              Section 8 number {certsLocked && <span className="locked-tag">locked</span>}
            </label>
            <input
              id="section8"
              type="text"
              value={info.section8Number ?? ''}
              onChange={(e) => setField('section8Number', e.target.value || null)}
              disabled={certsLocked}
              placeholder={certsLocked ? 'Available after approval' : 'e.g. SEC8/2026/0001'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="eighty-g">
              80G certificate number {certsLocked && <span className="locked-tag">locked</span>}
            </label>
            <input
              id="eighty-g"
              type="text"
              value={info.eightyGNumber ?? ''}
              onChange={(e) => setField('eightyGNumber', e.target.value || null)}
              disabled={certsLocked}
              placeholder={certsLocked ? 'Available after approval' : 'e.g. AAATY1234F/80G'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="fcra">
              FCRA number {certsLocked && <span className="locked-tag">locked</span>}
            </label>
            <input
              id="fcra"
              type="text"
              value={info.fcraNumber ?? ''}
              onChange={(e) => setField('fcraNumber', e.target.value || null)}
              disabled={certsLocked}
              placeholder={certsLocked ? 'Available after approval' : 'FCRA reg. number'}
            />
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="settings-section">
        <h3>Dates</h3>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="applied-date">Applied on</label>
            <input
              id="applied-date"
              type="date"
              value={info.appliedDate ?? ''}
              onChange={(e) => setField('appliedDate', e.target.value || null)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="approved-date">Approved on</label>
            <input
              id="approved-date"
              type="date"
              value={info.approvedDate ?? ''}
              onChange={(e) => setField('approvedDate', e.target.value || null)}
              disabled={certsLocked}
            />
          </div>
        </div>
      </div>

      {/* Disclosure override */}
      <div className="settings-section">
        <h3>Public disclosure line</h3>
        <div className="form-group">
          <label htmlFor="disclosure">Custom disclosure (optional)</label>
          <textarea
            id="disclosure"
            rows={3}
            maxLength={2000}
            value={info.disclosureOverride ?? ''}
            onChange={(e) => setField('disclosureOverride', e.target.value || null)}
            placeholder="Leave blank to use the default disclosure for the selected status."
          />
          <small className="field-description">
            Default (Unregistered): "Community-led foundation · Registration in progress."<br />
            Default (Applied): "Section 8 registration filed · awaiting approval."<br />
            Default (Registered): "Registered under Section 8 of the Companies Act, 2013."
          </small>
        </div>
      </div>

      {/* Pages affected sidebar */}
      <aside className="pages-affected">
        <h4>Pages updated when you save</h4>
        <ul>
          {PAGES_AFFECTED.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <small>Changes go live immediately on Save.</small>
      </aside>
    </div>
  );
});

LegalRegistrationTab.displayName = 'LegalRegistrationTab';

export default LegalRegistrationTab;
