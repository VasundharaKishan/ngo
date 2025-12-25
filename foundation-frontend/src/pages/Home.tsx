import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Campaign } from '../api';
import { formatCurrency, formatCurrencyCode } from '../utils/currency';
import { cmsApi, type Testimonial, type HomepageStat } from '../cmsApi';
import './Home.css';

export default function Home() {
  const [heroContent, setHeroContent] = useState<Record<string, string>>({});
  const [whyDonateContent, setWhyDonateContent] = useState<Record<string, string>>({});
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stats, setStats] = useState<HomepageStat[]>([]);
  const [featuredCampaigns, setFeaturedCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [hero, whyDonate, testimonialsData, statsData] = await Promise.all([
          cmsApi.getContent('hero'),
          cmsApi.getContent('why_donate'),
          cmsApi.getTestimonials(),
          cmsApi.getStats()
        ]);
        
        setHeroContent(hero);
        setWhyDonateContent(whyDonate);
        setTestimonials(testimonialsData);
        setStats(statsData);
      } catch (error) {
        console.error('Error loading CMS content:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadContent();
  }, []);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const data = await api.getCampaigns({ featured: true, limit: 3 });
        setFeaturedCampaigns(data.slice(0, 3));
      } catch (error) {
        console.error('Error loading featured campaigns:', error);
      }
    };

    loadFeatured();
  }, []);

  if (loading) {
    return <div className="home"><p>Loading...</p></div>;
  }

  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <h1>{heroContent.title || 'Every Act of Kindness Changes Lives'}</h1>
          <p className="hero-text">
            {heroContent.description || 'From feeding the hungry to empowering women, from educating children to providing clean water - your generosity creates ripples of hope across communities. Join thousands of donors making a real difference today.'}
          </p>
          <Link to="/campaigns" className="btn-hero">
            Explore All Campaigns →
          </Link>
        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="campaigns featured">
        <div className="container">
          <h2 className="section-title">Featured Campaigns</h2>
          {featuredCampaigns.length === 0 ? (
            <p className="no-campaigns">No featured campaigns at the moment.</p>
          ) : (
            <div className="campaign-grid">
              {featuredCampaigns.map(campaign => (
                <div key={campaign.id} className="campaign-card">
                  <div className="campaign-content">
                    <h3>{campaign.title}</h3>
                    <p className="description">{campaign.shortDescription}</p>
                    <div className="campaign-stats">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(
                              100,
                              (campaign.currentAmount || 0) / campaign.targetAmount * 100
                            ).toFixed(0)}%`
                          }}
                        />
                      </div>
                      <div className="stats-row">
                        <div className="stat">
                          <strong>{formatCurrency(campaign.currentAmount || 0, campaign.currency)}</strong>
                          <span>raised</span>
                        </div>
                        <div className="stat">
                          <strong>{formatCurrency(campaign.targetAmount, campaign.currency)}</strong>
                          <span>goal</span>
                        </div>
                      </div>
                    </div>
                    <div className="campaign-meta">
                      <span className="target">
                        Target: {formatCurrency(campaign.targetAmount, campaign.currency)} {formatCurrencyCode(campaign.currency)}
                      </span>
                    </div>
                    <Link to={`/campaigns/${campaign.id}`} className="btn-donate">
                      Donate
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Impact Statistics */}
      <section className="impact-stats">
        <div className="container">
          <div className="stats-grid">
            {stats.length > 0 ? stats.map(stat => (
              <div key={stat.id} className="stat-card">
                <h3 className="stat-number">{stat.statValue}</h3>
                <p className="stat-label">{stat.statLabel}</p>
              </div>
            )) : (
              <>
                <div className="stat-card">
                  <h3 className="stat-number">20+</h3>
                  <p className="stat-label">Active Campaigns</p>
                </div>
                <div className="stat-card">
                  <h3 className="stat-number">8</h3>
                  <p className="stat-label">Causes We Support</p>
                </div>
                <div className="stat-card">
                  <h3 className="stat-number">5,000+</h3>
                  <p className="stat-label">Lives Impacted</p>
                </div>
                <div className="stat-card">
                  <h3 className="stat-number">$750K+</h3>
                  <p className="stat-label">Funds Raised</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Why Donate Section */}
      <section className="why-donate">
        <div className="container">
          <h2 className="section-title">{whyDonateContent.title || 'Why Your Donation Matters'}</h2>
          <div className="why-grid">
            <div className="why-card">
              <h3>{whyDonateContent.card1_title || '🎯 Direct Impact'}</h3>
              <p>{whyDonateContent.card1_text || 'Every contribution directly supports our initial programs and on-ground efforts. We are committed to using funds responsibly and transparently as we grow.'}</p>
            </div>
            <div className="why-card">
              <h3>{whyDonateContent.card2_title || '🌍 Global Reach'}</h3>
              <p>{whyDonateContent.card2_text || 'We are starting with focused initiatives in India and Ireland, with a long-term vision to expand our reach responsibly.'}</p>
            </div>
            <div className="why-card">
              <h3>{whyDonateContent.card3_title || '✅ Proven Results'}</h3>
              <p>{whyDonateContent.card3_text || 'Our approach is guided by research, community needs, and measurable goals as we build our impact step by step.'}</p>
            </div>
            <div className="why-card">
              <h3>{whyDonateContent.card4_title || '🤝 Local Partners'}</h3>
              <p>{whyDonateContent.card4_text || 'We collaborate closely with local individuals and community groups to understand real needs and deliver meaningful support.'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="container">
          <h2 className="section-title">Stories from Our Donors</h2>
          <div className="testimonial-grid">
            {testimonials.length > 0 ? testimonials.map(testimonial => (
              <div key={testimonial.id} className="testimonial-card">
                <div className="quote-icon">"</div>
                <p className="testimonial-text">{testimonial.testimonialText}</p>
                <div className="testimonial-author">
                  <strong>{testimonial.authorName}</strong>
                  {testimonial.authorTitle && <span>{testimonial.authorTitle}</span>}
                </div>
              </div>
            )) : (
              <>
                <div className="testimonial-card">
                  <div className="quote-icon">"</div>
                  <p className="testimonial-text">
                    "Seeing the school we helped build brought tears to my eyes. The photos of 
                    smiling children made every dollar worth it. This is real change happening."
                  </p>
                  <div className="testimonial-author">
                    <strong>Sarah Mitchell</strong>
                    <span>Monthly Donor since 2023</span>
                  </div>
                </div>
                <div className="testimonial-card">
                  <div className="quote-icon">"</div>
                  <p className="testimonial-text">
                    "I love how transparent Hope Foundation is. Regular updates, real photos, 
                    and clear impact reports. I know my money is making a difference."
                  </p>
                  <div className="testimonial-author">
                    <strong>James Chen</strong>
                    <span>Donor since 2022</span>
                  </div>
                </div>
                <div className="testimonial-card">
                  <div className="quote-icon">"</div>
                  <p className="testimonial-text">
                    "Started with $25 and now I'm a monthly donor. The stories of transformation 
                    inspire me. Every campaign shows real people, real impact."
                  </p>
                  <div className="testimonial-author">
                    <strong>Priya Sharma</strong>
                    <span>Monthly Champion</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
