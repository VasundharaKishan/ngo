-- Sample data for comprehensive multi-cause donation platform

-- Insert Site Configuration
INSERT INTO site_config (id, config_key, config_value, description, created_at, updated_at)
VALUES 
    ('config-001', 'homepage.featured_campaigns_count', '3', 'Number of featured campaigns to show on homepage', NOW(), NOW()),
    ('config-002', 'campaigns_page.items_per_page', '12', 'Number of campaigns to show per page on campaigns list', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Categories
INSERT INTO categories (id, name, slug, description, icon, color, active, display_order, created_at, updated_at)
VALUES 
    ('cat-001', 'Education', 'education', 'Supporting schools, scholarships, and educational programs', '📚', '#667eea', true, 1, NOW(), NOW()),
    ('cat-002', 'Food & Nutrition', 'food-nutrition', 'Fighting hunger and malnutrition', '🍲', '#10b981', true, 2, NOW(), NOW()),
    ('cat-003', 'Agriculture', 'agriculture', 'Supporting farmers with resources and training', '🌾', '#f59e0b', true, 3, NOW(), NOW()),
    ('cat-004', 'Healthcare', 'healthcare', 'Providing medical care and wellness programs', '🏥', '#ef4444', true, 4, NOW(), NOW()),
    ('cat-005', 'Skill Training', 'skill-training', 'Job training and skill development', '💼', '#8b5cf6', true, 5, NOW(), NOW()),
    ('cat-006', 'Women Empowerment', 'women-empowerment', 'Supporting women through education and skills', '👩', '#ec4899', true, 6, NOW(), NOW()),
    ('cat-007', 'Emergency Relief', 'emergency-relief', 'Disaster relief and emergency aid', '🚨', '#dc2626', true, 7, NOW(), NOW()),
    ('cat-008', 'Clean Water', 'clean-water', 'Access to clean water and sanitation', '💧', '#06b6d4', true, 8, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Education Campaigns
INSERT INTO campaigns (id, title, slug, short_description, description, target_amount, current_amount, currency, category_id, image_url, location, beneficiaries_count, active, featured, urgent, created_at, updated_at)
VALUES 
    ('camp-edu-001', 'Build School in Rural Village', 'build-school-rural-village',
     'Construct a primary school for 200 children',
     'Help us build a fully equipped primary school with 6 classrooms, library, and playground in a rural village. This will provide quality education to 200+ children.',
     500000, 125000, 'usd', 'cat-001', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800',
     'Rajasthan', 200, true, true, false, NOW(), NOW()),
    
    ('camp-edu-002', 'Scholarship Fund for Girls', 'scholarship-fund-girls',
     'Support 50 girls to complete high school',
     'This scholarship fund will cover tuition, books, and uniforms for 50 girls from low-income families.',
     75000, 28000, 'usd', 'cat-001', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
     'Kerala', 50, true, true, false, NOW(), NOW()),
    
    ('camp-edu-003', 'Digital Learning Lab', 'digital-learning-lab',
     'Computer lab with internet for 100 students',
     'Set up a modern computer lab with 25 computers and high-speed internet to help students gain essential digital skills.',
     40000, 15000, 'usd', 'cat-001', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800',
     'Bihar', 100, true, false, false, NOW(), NOW()),

-- Food & Nutrition Campaigns
    ('camp-food-001', 'Daily Meals for Children', 'daily-meals-children',
     'Nutritious meals for 500 children for one year',
     'Fight childhood hunger by providing breakfast and lunch to 500 children from slum areas. A healthy meal ensures better attendance and development.',
     365000, 89000, 'usd', 'cat-002', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
     'Mumbai', 500, true, true, true, NOW(), NOW()),
    
    ('camp-food-002', 'Community Kitchen', 'community-kitchen-elderly',
     'Feed 100 senior citizens daily',
     'Our community kitchen will prepare and deliver fresh, nutritious meals to 100 senior citizens daily.',
     48000, 12000, 'usd', 'cat-002', 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800',
     'Chennai', 100, true, false, false, NOW(), NOW()),
    
    ('camp-food-003', 'Food Bank', 'food-bank-families',
     'Support 200 families with monthly groceries',
     'Stock food bank with essential groceries to support 200 low-income families every month.',
     60000, 22000, 'usd', 'cat-002', 'https://images.unsplash.com/photo-1593113648728-998ad9a89cd0?w=800',
     'Delhi', 200, true, false, true, NOW(), NOW()),

-- Agriculture Campaigns
    ('camp-agri-001', 'Irrigation for Farmers', 'irrigation-system-farmers',
     'Drip irrigation for 50 small farmers',
     'Help farmers increase crop yield by 40% through modern drip irrigation systems.',
     80000, 35000, 'usd', 'cat-003', 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800',
     'Punjab', 50, true, true, false, NOW(), NOW()),
    
    ('camp-agri-002', 'Organic Farming Training', 'organic-farming-training',
     'Train 100 farmers in organic methods',
     'Empower farmers to transition to organic farming with training, seeds, and certification support.',
     35000, 8000, 'usd', 'cat-003', 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800',
     'Karnataka', 100, true, false, false, NOW(), NOW()),

-- Healthcare Campaigns
    ('camp-health-001', 'Mobile Medical Camp', 'mobile-medical-camp',
     'Free healthcare for 1000 villagers',
     'Monthly medical camps in remote villages offering free consultations, medicines, and health education.',
     55000, 18000, 'usd', 'cat-004', 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=800',
     'Uttarakhand', 1000, true, false, false, NOW(), NOW()),
    
    ('camp-health-002', 'Cataract Surgery', 'cataract-surgery-poor',
     'Restore vision for 100 people',
     'Fund cataract surgeries for 100 elderly people. Each surgery costs $300 and will transform lives.',
     30000, 12000, 'usd', 'cat-004', 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800',
     'Madhya Pradesh', 100, true, true, false, NOW(), NOW()),
    
    ('camp-health-003', 'Maternity Care', 'maternity-health-program',
     'Safe childbirth for 200 mothers',
     'Provide pre-natal care, safe delivery, and post-natal support to 200 pregnant women in rural areas.',
     70000, 25000, 'usd', 'cat-004', 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800',
     'Assam', 200, true, false, true, NOW(), NOW()),

-- Skill Development Campaigns
    ('camp-skill-001', 'IT Skills for Youth', 'it-skills-youth',
     'Train 150 youth in programming',
     '6-month intensive program covering programming, web development, and job readiness with placement assistance.',
     90000, 42000, 'usd', 'cat-005', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
     'Bangalore', 150, true, true, false, NOW(), NOW()),
    
    ('camp-skill-002', 'Tailoring Training', 'tailoring-training-women',
     'Enable 80 women to become tailors',
     'Professional tailoring training with sewing machines to help women start their own business.',
     45000, 15000, 'usd', 'cat-005', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
     'Jaipur', 80, true, false, false, NOW(), NOW()),

-- Women Empowerment Campaigns
    ('camp-women-001', 'Women Entrepreneur Fund', 'women-entrepreneur-fund',
     'Microloans to 100 women entrepreneurs',
     'Interest-free microloans ($200-$500) with business training and mentorship.',
     40000, 18000, 'usd', 'cat-006', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800',
     'Gujarat', 100, true, true, false, NOW(), NOW()),
    
    ('camp-women-002', 'Self Defense Training', 'self-defense-training',
     'Train 300 girls in self-defense',
     'Comprehensive self-defense training covering martial arts basics and confidence building.',
     25000, 8000, 'usd', 'cat-006', 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800',
     'Delhi', 300, true, false, false, NOW(), NOW()),

-- Emergency Relief Campaigns
    ('camp-emergency-001', 'Flood Relief', 'flood-relief-support',
     'Emergency supplies for 500 families',
     'Urgent: Floods have displaced 500 families. They need food, water, medicines, and shelter materials.',
     85000, 52000, 'usd', 'cat-007', 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800',
     'Odisha', 500, true, false, true, NOW(), NOW()),

-- Clean Water Campaigns
    ('camp-water-001', 'Village Water Wells', 'village-water-wells',
     'Construct 10 wells in drought areas',
     'Bring clean water to 10 villages. Each well will serve 150-200 people.',
     120000, 55000, 'usd', 'cat-008', 'https://images.unsplash.com/photo-1541844053589-346841d0b34c?w=800',
     'Maharashtra', 1500, true, true, false, NOW(), NOW()),
    
    ('camp-water-002', 'Water Purifiers', 'water-purification-schools',
     'Install purifiers in 20 schools',
     'Ensure safe drinking water for 3000 children by installing RO systems in 20 schools.',
     50000, 18000, 'usd', 'cat-008', 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800',
     'West Bengal', 3000, true, false, false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- CMS Content (Hero Section)
INSERT INTO cms_content (id, section, content_key, content_value, content_type, active, display_order, created_at, updated_at)
VALUES
    ('cms-hero-001', 'hero', 'title', 'Make a Difference in People''s Lives', 'TEXT', true, 1, NOW(), NOW()),
    ('cms-hero-002', 'hero', 'subtitle', 'Join us in transforming communities through education, healthcare, and sustainable development', 'TEXT', true, 2, NOW(), NOW()),
    ('cms-hero-003', 'hero', 'cta_text', 'Start Your Impact Today', 'TEXT', true, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- CMS Content (Why Donate Section)
INSERT INTO cms_content (id, section, content_key, content_value, content_type, active, display_order, created_at, updated_at)
VALUES
    ('cms-why-001', 'why_donate', 'title', 'Why Your Donation Matters', 'TEXT', true, 1, NOW(), NOW()),
    ('cms-why-002', 'why_donate', 'subtitle', 'Every contribution creates lasting change', 'TEXT', true, 2, NOW(), NOW()),
    ('cms-why-003', 'why_donate', 'point1_title', 'Direct Impact', 'TEXT', true, 3, NOW(), NOW()),
    ('cms-why-004', 'why_donate', 'point1_text', '100% of your donation goes directly to the cause', 'TEXT', true, 4, NOW(), NOW()),
    ('cms-why-005', 'why_donate', 'point2_title', 'Transparency', 'TEXT', true, 5, NOW(), NOW()),
    ('cms-why-006', 'why_donate', 'point2_text', 'Track how your contribution is making a difference', 'TEXT', true, 6, NOW(), NOW()),
    ('cms-why-007', 'why_donate', 'point3_title', 'Verified Causes', 'TEXT', true, 7, NOW(), NOW()),
    ('cms-why-008', 'why_donate', 'point3_text', 'All campaigns are vetted and monitored for impact', 'TEXT', true, 8, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Homepage Stats
INSERT INTO homepage_stats (id, stat_label, stat_value, icon, active, display_order, created_at, updated_at)
VALUES
    ('stat-001', 'Lives Impacted', '50,000+', '👥', true, 1, NOW(), NOW()),
    ('stat-002', 'Active Campaigns', '25', '📋', true, 2, NOW(), NOW()),
    ('stat-003', 'Funds Raised', '$2.5M', '💰', true, 3, NOW(), NOW()),
    ('stat-004', 'Success Rate', '95%', '✅', true, 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Testimonials
INSERT INTO testimonials (id, author_name, author_title, testimonial_text, active, display_order, created_at, updated_at)
VALUES
    ('test-001', 'Priya Sharma', 'Scholarship Recipient', 
     'Thanks to the scholarship fund, I completed my education and now work as a teacher, helping other students achieve their dreams.', 
     true, 1, NOW(), NOW()),
    ('test-002', 'Rajesh Kumar', 'Farmer, Punjab', 
     'The drip irrigation system increased my crop yield by 45%. My family''s income has doubled, and we can now afford better education for our children.', 
     true, 2, NOW(), NOW()),
    ('test-003', 'Anita Desai', 'Women Entrepreneur', 
     'The microloan and training helped me start my tailoring business. I now employ 3 other women from my village.', 
     true, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Carousel Images
INSERT INTO carousel_images (id, image_url, alt_text, active, display_order, created_at, updated_at)
VALUES
    ('carousel-001', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&auto=format&fit=crop&q=80', 
     'Children enjoying nutritious meals', true, 1, NOW(), NOW()),
    ('carousel-002', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&auto=format&fit=crop&q=80', 
     'Students learning in new classroom', true, 2, NOW(), NOW()),
    ('carousel-003', 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&auto=format&fit=crop&q=80', 
     'Women empowerment training session', true, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Social Media Links
INSERT INTO social_media (id, platform, url, icon, active, display_order, created_at, updated_at)
VALUES
    ('social-001', 'Facebook', 'https://facebook.com/myfoundation', 'facebook', true, 1, NOW(), NOW()),
    ('social-002', 'Twitter', 'https://twitter.com/myfoundation', 'twitter', true, 2, NOW(), NOW()),
    ('social-003', 'Instagram', 'https://instagram.com/myfoundation', 'instagram', true, 3, NOW(), NOW()),
    ('social-004', 'LinkedIn', 'https://linkedin.com/company/myfoundation', 'linkedin', true, 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample donations
INSERT INTO donations (id, donor_name, donor_email, amount, currency, status, campaign_id, stripe_session_id, stripe_payment_intent_id, created_at)
VALUES 
    ('don-001', 'Sarah Johnson', 'sarah.j@example.com', 10000, 'usd', 'SUCCESS', 'camp-edu-001', 'cs_test_1', 'pi_1', NOW() - INTERVAL '10 days'),
    ('don-002', 'Michael Chen', 'michael.c@example.com', 25000, 'usd', 'SUCCESS', 'camp-edu-001', 'cs_test_2', 'pi_2', NOW() - INTERVAL '8 days'),
    ('don-003', 'Emily Rodriguez', 'emily.r@example.com', 5000, 'usd', 'SUCCESS', 'camp-food-001', 'cs_test_3', 'pi_3', NOW() - INTERVAL '7 days'),
    ('don-004', 'David Kumar', 'david.k@example.com', 15000, 'usd', 'SUCCESS', 'camp-agri-001', 'cs_test_4', 'pi_4', NOW() - INTERVAL '6 days'),
    ('don-005', 'Lisa Anderson', 'lisa.a@example.com', 20000, 'usd', 'SUCCESS', 'camp-skill-001', 'cs_test_5', 'pi_5', NOW() - INTERVAL '5 days'),
    ('don-006', 'James Wilson', 'james.w@example.com', 7500, 'usd', 'SUCCESS', 'camp-women-001', 'cs_test_6', 'pi_6', NOW() - INTERVAL '4 days'),
    ('don-007', 'Maria Garcia', 'maria.g@example.com', 12000, 'usd', 'SUCCESS', 'camp-water-001', 'cs_test_7', 'pi_7', NOW() - INTERVAL '3 days'),
    ('don-008', 'Robert Taylor', 'robert.t@example.com', 30000, 'usd', 'SUCCESS', 'camp-health-002', 'cs_test_8', 'pi_8', NOW() - INTERVAL '2 days'),
    ('don-009', 'Jennifer Lee', 'jennifer.l@example.com', 8000, 'usd', 'SUCCESS', 'camp-edu-002', 'cs_test_9', 'pi_9', NOW() - INTERVAL '1 day'),
    ('don-010', 'William Brown', 'william.b@example.com', 50000, 'usd', 'SUCCESS', 'camp-emergency-001', 'cs_test_10', 'pi_10', NOW())
ON CONFLICT (id) DO NOTHING;
