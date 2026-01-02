import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/constants';
import '../styles/AdminCMS.css';

interface Testimonial {
  id: string;
  authorName: string;
  authorTitle: string;
  testimonialText: string;
  displayOrder: number;
  active: boolean;
}

interface HomepageStat {
  id: string;
  statLabel: string;
  statValue: string;
  icon: string | null;
  displayOrder: number;
  active: boolean;
}

interface SocialMedia {
  id: string;
  platform: string;
  url: string;
  icon: string;
  displayOrder: number;
  active: boolean;
}

interface CarouselImage {
  id: string;
  imageUrl: string;
  altText: string | null;
  displayOrder: number;
  active: boolean;
}

type ContentType = 'testimonials' | 'stats' | 'social-media' | 'carousel';

function AdminCMS() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ContentType>('testimonials');
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stats, setStats] = useState<HomepageStat[]>([]);
  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Check authentication
  useEffect(() => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
    }
  }, [navigate]);

  useEffect(() => {
    loadContent();
  }, [activeTab]);

  const loadContent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = sessionStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/admin/cms/${activeTab}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load content');

      const data = await response.json();

      switch (activeTab) {
        case 'testimonials':
          setTestimonials(data.sort((a: Testimonial, b: Testimonial) => a.displayOrder - b.displayOrder));
          break;
        case 'stats':
          setStats(data.sort((a: HomepageStat, b: HomepageStat) => a.displayOrder - b.displayOrder));
          break;
        case 'social-media':
          setSocialMedia(data.sort((a: SocialMedia, b: SocialMedia) => a.displayOrder - b.displayOrder));
          break;
        case 'carousel':
          setCarouselImages(data.sort((a: CarouselImage, b: CarouselImage) => a.displayOrder - b.displayOrder));
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const token = sessionStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/admin/cms/${activeTab}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete');

      await loadContent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleSave = async (data: any, id?: string) => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const url = id 
        ? `${API_BASE_URL}/admin/cms/${activeTab}/${id}` 
        : `${API_BASE_URL}/admin/cms/${activeTab}`;
      
      const response = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to save');

      await loadContent();
      setEditingId(null);
      setIsCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const renderTestimonials = () => (
    <div className="content-section">
      <div className="section-header">
        <h2>Testimonials Management</h2>
        <button 
          className="btn-primary" 
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
        >
          + Add Testimonial
        </button>
      </div>

      {isCreating && (
        <TestimonialForm 
          onSave={handleSave} 
          onCancel={() => setIsCreating(false)} 
        />
      )}

      <div className="content-grid">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="content-card">
            {editingId === testimonial.id ? (
              <TestimonialForm 
                testimonial={testimonial}
                onSave={(data) => handleSave(data, testimonial.id)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="card-header">
                  <span className={`status-badge ${testimonial.active ? 'active' : 'inactive'}`}>
                    {testimonial.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="order-badge">Order: {testimonial.displayOrder}</span>
                </div>
                <h3>{testimonial.authorName}</h3>
                <p className="subtitle">{testimonial.authorTitle}</p>
                <p className="testimonial-text">"{testimonial.testimonialText}"</p>
                <div className="card-actions">
                  <button 
                    className="btn-secondary" 
                    onClick={() => setEditingId(testimonial.id)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-danger" 
                    onClick={() => handleDelete(testimonial.id)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="content-section">
      <div className="section-header">
        <h2>Homepage Statistics</h2>
        <button 
          className="btn-primary" 
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
        >
          + Add Stat
        </button>
      </div>

      {isCreating && (
        <StatForm 
          onSave={handleSave} 
          onCancel={() => setIsCreating(false)} 
        />
      )}

      <div className="content-grid">
        {stats.map((stat) => (
          <div key={stat.id} className="content-card">
            {editingId === stat.id ? (
              <StatForm 
                stat={stat}
                onSave={(data) => handleSave(data, stat.id)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="card-header">
                  <span className={`status-badge ${stat.active ? 'active' : 'inactive'}`}>
                    {stat.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="order-badge">Order: {stat.displayOrder}</span>
                </div>
                {stat.icon && <div className="stat-icon">{stat.icon}</div>}
                <h3>{stat.statValue}</h3>
                <p>{stat.statLabel}</p>
                <div className="card-actions">
                  <button 
                    className="btn-secondary" 
                    onClick={() => setEditingId(stat.id)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-danger" 
                    onClick={() => handleDelete(stat.id)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderSocialMedia = () => (
    <div className="content-section">
      <div className="section-header">
        <h2>Social Media Links</h2>
        <button 
          className="btn-primary" 
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
        >
          + Add Link
        </button>
      </div>

      {isCreating && (
        <SocialMediaForm 
          onSave={handleSave} 
          onCancel={() => setIsCreating(false)} 
        />
      )}

      <div className="content-grid">
        {socialMedia.map((social) => (
          <div key={social.id} className="content-card">
            {editingId === social.id ? (
              <SocialMediaForm 
                socialMedia={social}
                onSave={(data) => handleSave(data, social.id)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="card-header">
                  <span className={`status-badge ${social.active ? 'active' : 'inactive'}`}>
                    {social.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="order-badge">Order: {social.displayOrder}</span>
                </div>
                <div className="social-icon">{social.icon}</div>
                <h3>{social.platform}</h3>
                <a href={social.url} target="_blank" rel="noopener noreferrer" className="social-url">
                  {social.url}
                </a>
                <div className="card-actions">
                  <button 
                    className="btn-secondary" 
                    onClick={() => setEditingId(social.id)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-danger" 
                    onClick={() => handleDelete(social.id)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderCarousel = () => (
    <div className="content-section">
      <div className="section-header">
        <h2>Carousel Images</h2>
        <button 
          className="btn-primary" 
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
        >
          + Add Image
        </button>
      </div>

      {isCreating && (
        <CarouselForm 
          onSave={handleSave} 
          onCancel={() => setIsCreating(false)} 
        />
      )}

      <div className="content-grid">
        {carouselImages.map((image) => (
          <div key={image.id} className="content-card">
            {editingId === image.id ? (
              <CarouselForm 
                image={image}
                onSave={(data) => handleSave(data, image.id)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="card-header">
                  <span className={`status-badge ${image.active ? 'active' : 'inactive'}`}>
                    {image.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="order-badge">Order: {image.displayOrder}</span>
                </div>
                <img src={image.imageUrl} alt={image.altText || 'Carousel image'} className="carousel-preview" />
                <p className="image-alt">{image.altText || 'No alt text'}</p>
                <div className="card-actions">
                  <button 
                    className="btn-secondary" 
                    onClick={() => setEditingId(image.id)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-danger" 
                    onClick={() => handleDelete(image.id)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-cms">
      <h1>CMS Content Management</h1>
      {error && <div className="error-message">{error}</div>}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'testimonials' ? 'active' : ''}`}
          onClick={() => setActiveTab('testimonials')}
        >
          Testimonials
        </button>
        <button 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
        <button 
          className={`tab ${activeTab === 'social-media' ? 'active' : ''}`}
          onClick={() => setActiveTab('social-media')}
        >
          Social Media
        </button>
        <button 
          className={`tab ${activeTab === 'carousel' ? 'active' : ''}`}
          onClick={() => setActiveTab('carousel')}
        >
          Carousel
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'testimonials' && renderTestimonials()}
        {activeTab === 'stats' && renderStats()}
        {activeTab === 'social-media' && renderSocialMedia()}
        {activeTab === 'carousel' && renderCarousel()}
      </div>
    </div>
  );
}

// Form Components

function TestimonialForm({ testimonial, onSave, onCancel }: {
  testimonial?: Testimonial;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    authorName: testimonial?.authorName || '',
    authorTitle: testimonial?.authorTitle || '',
    testimonialText: testimonial?.testimonialText || '',
    displayOrder: testimonial?.displayOrder || 0,
    active: testimonial?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="edit-form">
      <input
        type="text"
        placeholder="Author Name"
        value={formData.authorName}
        onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Author Title"
        value={formData.authorTitle}
        onChange={(e) => setFormData({ ...formData, authorTitle: e.target.value })}
      />
      <textarea
        placeholder="Testimonial Text"
        value={formData.testimonialText}
        onChange={(e) => setFormData({ ...formData, testimonialText: e.target.value })}
        rows={4}
        required
      />
      <input
        type="number"
        placeholder="Display Order"
        value={formData.displayOrder}
        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
      />
      <label>
        <input
          type="checkbox"
          checked={formData.active}
          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
        />
        Active
      </label>
      <div className="form-actions">
        <button type="submit" className="btn-primary">Save</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function StatForm({ stat, onSave, onCancel }: {
  stat?: HomepageStat;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    statLabel: stat?.statLabel || '',
    statValue: stat?.statValue || '',
    icon: stat?.icon || '',
    displayOrder: stat?.displayOrder || 0,
    active: stat?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="edit-form">
      <input
        type="text"
        placeholder="Stat Label"
        value={formData.statLabel}
        onChange={(e) => setFormData({ ...formData, statLabel: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Stat Value"
        value={formData.statValue}
        onChange={(e) => setFormData({ ...formData, statValue: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Icon (emoji or text)"
        value={formData.icon || ''}
        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
      />
      <input
        type="number"
        placeholder="Display Order"
        value={formData.displayOrder}
        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
      />
      <label>
        <input
          type="checkbox"
          checked={formData.active}
          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
        />
        Active
      </label>
      <div className="form-actions">
        <button type="submit" className="btn-primary">Save</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function SocialMediaForm({ socialMedia, onSave, onCancel }: {
  socialMedia?: SocialMedia;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    platform: socialMedia?.platform || '',
    url: socialMedia?.url || '',
    icon: socialMedia?.icon || '',
    displayOrder: socialMedia?.displayOrder || 0,
    active: socialMedia?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="edit-form">
      <input
        type="text"
        placeholder="Platform (e.g., Facebook, Twitter)"
        value={formData.platform}
        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
        required
      />
      <input
        type="url"
        placeholder="URL"
        value={formData.url}
        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Icon (emoji or symbol)"
        value={formData.icon}
        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
        required
      />
      <input
        type="number"
        placeholder="Display Order"
        value={formData.displayOrder}
        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
      />
      <label>
        <input
          type="checkbox"
          checked={formData.active}
          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
        />
        Active
      </label>
      <div className="form-actions">
        <button type="submit" className="btn-primary">Save</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function CarouselForm({ image, onSave, onCancel }: {
  image?: CarouselImage;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    imageUrl: image?.imageUrl || '',
    altText: image?.altText || '',
    displayOrder: image?.displayOrder || 0,
    active: image?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="edit-form">
      <input
        type="url"
        placeholder="Image URL"
        value={formData.imageUrl}
        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Alt Text"
        value={formData.altText || ''}
        onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
      />
      <input
        type="number"
        placeholder="Display Order"
        value={formData.displayOrder}
        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
      />
      <label>
        <input
          type="checkbox"
          checked={formData.active}
          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
        />
        Active
      </label>
      <div className="form-actions">
        <button type="submit" className="btn-primary">Save</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default AdminCMS;
