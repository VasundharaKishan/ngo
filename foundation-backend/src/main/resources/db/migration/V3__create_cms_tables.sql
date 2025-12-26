-- CMS Content Management Tables

-- General CMS Content (for hero text, footer text, etc.)
CREATE TABLE IF NOT EXISTS cms_content (
    id VARCHAR(255) PRIMARY KEY,
    section VARCHAR(100) NOT NULL,
    content_key VARCHAR(100) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content_value TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_section_key UNIQUE(section, content_key)
);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
    id VARCHAR(255) PRIMARY KEY,
    author_name VARCHAR(100) NOT NULL,
    author_title VARCHAR(200),
    testimonial_text TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Homepage Statistics
CREATE TABLE IF NOT EXISTS homepage_stats (
    id VARCHAR(255) PRIMARY KEY,
    stat_label VARCHAR(100) NOT NULL,
    stat_value VARCHAR(50) NOT NULL,
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Social Media Links
CREATE TABLE IF NOT EXISTS social_media (
    id VARCHAR(255) PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    url VARCHAR(500) NOT NULL,
    icon VARCHAR(10),
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Carousel Images
CREATE TABLE IF NOT EXISTS carousel_images (
    id VARCHAR(255) PRIMARY KEY,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(200),
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default data for CMS content
INSERT INTO cms_content (id, section, content_key, content_type, content_value, display_order, active) VALUES
('cms-001', 'hero', 'title', 'text', 'Every Act of Kindness Changes Lives', 1, true),
('cms-002', 'hero', 'description', 'text', 'From feeding the hungry to empowering women, from educating children to providing clean water - your generosity creates ripples of hope across communities. Join thousands of donors making a real difference today.', 2, true),
('cms-003', 'hero', 'cta_text', 'text', 'Explore All Causes →', 3, true),
('cms-004', 'carousel', 'title', 'text', 'See the Impact of Your Generosity', 1, true),
('cms-005', 'why_donate', 'title', 'text', 'Why Your Donation Matters', 1, true),
('cms-006', 'why_donate', 'card1_title', 'text', '🎯 Direct Impact', 2, true),
('cms-007', 'why_donate', 'card1_text', 'text', '92% of donations go directly to programs. See exactly where your money goes.', 3, true),
('cms-008', 'why_donate', 'card2_title', 'text', '🌍 Global Reach', 4, true),
('cms-009', 'why_donate', 'card2_text', 'text', 'Supporting communities in 25+ countries across Asia, Africa, and South America.', 5, true),
('cms-010', 'why_donate', 'card3_title', 'text', '✅ Proven Results', 6, true),
('cms-011', 'why_donate', 'card3_text', 'text', 'Track record of sustainable change with measurable outcomes and transparency.', 7, true),
('cms-012', 'why_donate', 'card4_title', 'text', '🤝 Local Partners', 8, true),
('cms-013', 'why_donate', 'card4_text', 'text', 'Working with trusted community leaders who know the needs firsthand.', 9, true),
('cms-014', 'testimonials', 'title', 'text', 'Stories from Our Donors', 1, true),
('cms-015', 'footer', 'foundation_name', 'text', 'Yugal Savitri Seva', 1, true),
('cms-016', 'footer', 'tagline', 'text', 'Empowering communities worldwide through compassion and action.', 2, true),
('cms-017', 'footer', 'contact_email', 'text', 'contact@hopefoundation.org', 3, true),
('cms-018', 'footer', 'contact_phone', 'text', '+1 (555) 123-4567', 4, true),
('cms-019', 'footer', 'contact_address', 'text', '123 Charity Lane, Global City', 5, true),
('cms-020', 'footer', 'copyright', 'text', '© 2025 Yugal Savitri Seva. All rights reserved. Registered Charity #12-3456789', 6, true)
ON CONFLICT (section, content_key) DO NOTHING;

-- Insert default testimonials
INSERT INTO testimonials (id, author_name, author_title, testimonial_text, display_order, active) VALUES
('test-001', 'Sarah Mitchell', 'Monthly Donor since 2023', 'Seeing the school we helped build brought tears to my eyes. The photos of smiling children made every dollar worth it. This is real change happening.', 1, true),
('test-002', 'James Chen', 'Donor since 2022', 'I love how transparent Yugal Savitri Seva is. Regular updates, real photos, and clear impact reports. I know my money is making a difference.', 2, true),
('test-003', 'Priya Sharma', 'Monthly Champion', 'Started with $25 and now I''m a monthly donor. The stories of transformation inspire me. Every campaign shows real people, real impact.', 3, true)
ON CONFLICT (id) DO NOTHING;

-- Insert default homepage stats
INSERT INTO homepage_stats (id, stat_label, stat_value, icon, display_order, active) VALUES
('stat-001', 'Active Campaigns', '20+', null, 1, true),
('stat-002', 'Causes We Support', '8', null, 2, true),
('stat-003', 'Lives Impacted', '5,000+', null, 3, true),
('stat-004', 'Funds Raised', '$750K+', null, 4, true)
ON CONFLICT (id) DO NOTHING;

-- Insert default social media links
INSERT INTO social_media (id, platform, url, icon, display_order, active) VALUES
('social-001', 'Facebook', 'https://facebook.com', 'ƒ', 1, true),
('social-002', 'Twitter', 'https://twitter.com', '✕', 2, true),
('social-003', 'Instagram', 'https://instagram.com', '◉', 3, true),
('social-004', 'YouTube', 'https://youtube.com', '▷', 4, true),
('social-005', 'LinkedIn', 'https://linkedin.com', '∷', 5, true)
ON CONFLICT (id) DO NOTHING;

-- Insert default carousel images
INSERT INTO carousel_images (id, image_url, alt_text, display_order, active) VALUES
('car-001', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1400&q=90', 'Children in classroom', 1, true),
('car-002', 'https://images.unsplash.com/photo-1509099863731-ef4bff19e808?w=1400&q=90', 'Women empowerment', 2, true),
('car-003', 'https://images.unsplash.com/photo-1544913675-7f90df398a8f?w=1400&q=90', 'Education program', 3, true),
('car-004', 'https://images.unsplash.com/photo-1548678967-f1aec58f6fb2?w=1400&q=90', 'Hunger relief', 4, true),
('car-005', 'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=1400&q=90', 'Clean water access', 5, true),
('car-006', 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=1400&q=90', 'Girls education', 6, true),
('car-007', 'https://images.unsplash.com/photo-1609619385002-ba2ff9c3b1f1?w=1400&q=90', 'Vocational training', 7, true),
('car-008', 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=1400&q=90', 'Community support', 8, true)
ON CONFLICT (id) DO NOTHING;
