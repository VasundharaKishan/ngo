import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSiteName } from '../contexts/ConfigContext';
import { fetchContactInfo } from '../utils/contactApi';
import type { ContactInfo } from '../utils/contactApi';
import './ContactPage.css';

export default function ContactPage() {
  const siteName = useSiteName();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

  // Pre-fill form from URL query params (e.g. from newsletter redirect)
  const subjectParam = searchParams.get('subject') || '';
  const emailParam = searchParams.get('email') || '';
  const subjectLabel = subjectParam === 'newsletter' ? 'Newsletter subscription request' : subjectParam;

  const [form, setForm] = useState({
    name: '',
    email: emailParam,
    subject: subjectLabel,
    message: subjectParam === 'newsletter' ? 'Please add me to your newsletter mailing list.' : '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetchContactInfo().then(setContactInfo).catch(() => {});
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t('contact.validation.nameRequired');
    if (!form.email.trim()) e.email = t('contact.validation.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('contact.validation.emailInvalid');
    if (!form.subject.trim()) e.subject = t('contact.validation.subjectRequired');
    if (!form.message.trim()) e.message = t('contact.validation.messageRequired');
    else if (form.message.trim().length < 20) e.message = t('contact.validation.messageTooShort');
    return e;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setStatus('submitting');
    // Simulate a short delay — replace with real API call when backend endpoint exists
    await new Promise(res => setTimeout(res, 800));
    setStatus('success');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="contact-page" data-testid="contact-page">
      <Helmet>
        <title>Contact Us | {siteName}</title>
        <meta name="description" content={`Get in touch with ${siteName}. We'd love to hear from you.`} />
      </Helmet>

      {/* Hero */}
      <section className="contact-hero">
        <div className="contact-hero-inner">
          <h1>{t('contact.heroTitle')}</h1>
          <p>{t('contact.heroSubtitle')}</p>
        </div>
      </section>

      <div className="contact-container">
        <div className="contact-grid">

          {/* Contact info panel */}
          <aside className="contact-info-panel">
            <h2>{t('contact.infoTitle')}</h2>

            {contactInfo?.email && (
              <div className="contact-info-item">
                <span className="contact-info-icon" aria-hidden="true">✉️</span>
                <div>
                  <strong>{t('contact.email')}</strong>
                  <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
                </div>
              </div>
            )}

            {contactInfo?.locations && contactInfo.locations.length > 0 && (
              <div className="contact-info-item">
                <span className="contact-info-icon" aria-hidden="true">📍</span>
                <div>
                  <strong>{t('contact.locations')}</strong>
                  {contactInfo.locations.map((loc, i) => (
                    <div key={i} className="contact-location">
                      <span className="contact-location-label">{loc.label}</span>
                      {loc.lines.map((line, li) => <span key={li}>{line}</span>)}
                      {loc.postalLabel && loc.postalCode && <span>{loc.postalLabel}: {loc.postalCode}</span>}
                      {loc.mobile && <span>Mobile: {loc.mobile}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="contact-info-item">
              <span className="contact-info-icon" aria-hidden="true">🕐</span>
              <div>
                <strong>{t('contact.responseTime')}</strong>
                <span>{t('contact.responseTimeValue')}</span>
              </div>
            </div>

            <div className="contact-ways">
              <h3>{t('contact.otherWays')}</h3>
              <ul>
                <li>🤝 {t('contact.volunteer')}</li>
                <li>🏢 {t('contact.partner')}</li>
                <li>📢 {t('contact.spread')}</li>
              </ul>
            </div>
          </aside>

          {/* Contact form */}
          <div className="contact-form-panel">
            {status === 'success' ? (
              <div className="contact-success" data-testid="contact-success">
                <span className="contact-success-icon" aria-hidden="true">✅</span>
                <h2>{t('contact.successTitle')}</h2>
                <p>{t('contact.successMessage')}</p>
                <button className="btn-contact-again" onClick={() => setStatus('idle')}>
                  {t('contact.sendAnother')}
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit} noValidate data-testid="contact-form">
                <h2>{t('contact.formTitle')}</h2>

                <div className="contact-form-row">
                  <div className={`contact-field ${errors.name ? 'has-error' : ''}`}>
                    <label htmlFor="contact-name">{t('contact.name')} *</label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      placeholder={t('contact.namePlaceholder')}
                      autoComplete="name"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? 'contact-name-error' : undefined}
                    />
                    {errors.name && (
                      <span id="contact-name-error" className="contact-error" role="alert">
                        {errors.name}
                      </span>
                    )}
                  </div>

                  <div className={`contact-field ${errors.email ? 'has-error' : ''}`}>
                    <label htmlFor="contact-email">{t('contact.emailField')} *</label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder={t('contact.emailPlaceholder')}
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'contact-email-error' : undefined}
                    />
                    {errors.email && (
                      <span id="contact-email-error" className="contact-error" role="alert">
                        {errors.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className={`contact-field ${errors.subject ? 'has-error' : ''}`}>
                  <label htmlFor="contact-subject">{t('contact.subject')} *</label>
                  <select
                    id="contact-subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    aria-invalid={!!errors.subject}
                    aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
                  >
                    <option value="">{t('contact.subjectPlaceholder')}</option>
                    <option value="general">{t('contact.subjects.general')}</option>
                    <option value="donation">{t('contact.subjects.donation')}</option>
                    <option value="volunteer">{t('contact.subjects.volunteer')}</option>
                    <option value="partnership">{t('contact.subjects.partnership')}</option>
                    <option value="media">{t('contact.subjects.media')}</option>
                    <option value="other">{t('contact.subjects.other')}</option>
                  </select>
                  {errors.subject && (
                    <span id="contact-subject-error" className="contact-error" role="alert">
                      {errors.subject}
                    </span>
                  )}
                </div>

                <div className={`contact-field ${errors.message ? 'has-error' : ''}`}>
                  <label htmlFor="contact-message">{t('contact.message')} *</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder={t('contact.messagePlaceholder')}
                    rows={6}
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? 'contact-message-error' : undefined}
                  />
                  {errors.message && (
                    <span id="contact-message-error" className="contact-error" role="alert">
                      {errors.message}
                    </span>
                  )}
                </div>

                {status === 'error' && (
                  <p className="contact-submit-error">
                    {t('contact.errorMessage')}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-contact-submit"
                  disabled={status === 'submitting'}
                >
                  {status === 'submitting' ? t('contact.sending') : `${t('contact.send')} ✉️`}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
