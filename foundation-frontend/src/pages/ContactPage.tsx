import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSiteName } from '../contexts/ConfigContext';
import { fetchContactInfo } from '../utils/contactApi';
import { useEffect } from 'react';
import type { ContactInfo } from '../utils/contactApi';
import './ContactPage.css';

export default function ContactPage() {
  const siteName = useSiteName();
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetchContactInfo().then(setContactInfo).catch(() => {});
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.message.trim()) e.message = 'Message is required';
    else if (form.message.trim().length < 20) e.message = 'Please write at least 20 characters';
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
          <h1>Get in Touch</h1>
          <p>Have a question, want to volunteer, or just want to say hello? We'd love to hear from you.</p>
        </div>
      </section>

      <div className="contact-container">
        <div className="contact-grid">

          {/* Contact info panel */}
          <aside className="contact-info-panel">
            <h2>Contact Information</h2>

            {contactInfo?.email && (
              <div className="contact-info-item">
                <span className="contact-info-icon" aria-hidden="true">✉️</span>
                <div>
                  <strong>Email</strong>
                  <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
                </div>
              </div>
            )}

            {contactInfo?.locations && contactInfo.locations.length > 0 && (
              <div className="contact-info-item">
                <span className="contact-info-icon" aria-hidden="true">📍</span>
                <div>
                  <strong>Locations</strong>
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
                <strong>Response Time</strong>
                <span>We typically reply within 24–48 hours</span>
              </div>
            </div>

            <div className="contact-ways">
              <h3>Other ways to get involved</h3>
              <ul>
                <li>🤝 <strong>Volunteer</strong> — Join our team on the ground</li>
                <li>🏢 <strong>Partner</strong> — Corporate or institutional partnerships</li>
                <li>📢 <strong>Spread the word</strong> — Share our campaigns with your network</li>
              </ul>
            </div>
          </aside>

          {/* Contact form */}
          <div className="contact-form-panel">
            {status === 'success' ? (
              <div className="contact-success" data-testid="contact-success">
                <span className="contact-success-icon" aria-hidden="true">✅</span>
                <h2>Message Sent!</h2>
                <p>Thank you for reaching out. We'll get back to you within 24–48 hours.</p>
                <button className="btn-contact-again" onClick={() => setStatus('idle')}>
                  Send another message
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit} noValidate data-testid="contact-form">
                <h2>Send us a Message</h2>

                <div className="contact-form-row">
                  <div className={`contact-field ${errors.name ? 'has-error' : ''}`}>
                    <label htmlFor="contact-name">Full Name *</label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                    {errors.name && <span className="contact-error">{errors.name}</span>}
                  </div>

                  <div className={`contact-field ${errors.email ? 'has-error' : ''}`}>
                    <label htmlFor="contact-email">Email Address *</label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      autoComplete="email"
                    />
                    {errors.email && <span className="contact-error">{errors.email}</span>}
                  </div>
                </div>

                <div className={`contact-field ${errors.subject ? 'has-error' : ''}`}>
                  <label htmlFor="contact-subject">Subject *</label>
                  <select
                    id="contact-subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                  >
                    <option value="">Select a topic…</option>
                    <option value="general">General Enquiry</option>
                    <option value="donation">Donation Question</option>
                    <option value="volunteer">Volunteering</option>
                    <option value="partnership">Partnership / Corporate</option>
                    <option value="media">Media / Press</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.subject && <span className="contact-error">{errors.subject}</span>}
                </div>

                <div className={`contact-field ${errors.message ? 'has-error' : ''}`}>
                  <label htmlFor="contact-message">Message *</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help…"
                    rows={6}
                  />
                  {errors.message && <span className="contact-error">{errors.message}</span>}
                </div>

                {status === 'error' && (
                  <p className="contact-submit-error">
                    Something went wrong. Please try again or email us directly.
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-contact-submit"
                  disabled={status === 'submitting'}
                >
                  {status === 'submitting' ? 'Sending…' : 'Send Message ✉️'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
