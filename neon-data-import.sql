--
-- PostgreSQL database dump
--

\restrict cArdBIRrLb1USZeI5tQlRn5QD27AhRiEoouSxW8aDpUbW9ONjydH6wIT8LpmKqO

-- Dumped from database version 14.20 (Homebrew)
-- Dumped by pg_dump version 14.20 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: e141057
--

INSERT INTO public.admin_users (id, active, created_at, email, full_name, last_login_at, password, role, updated_at, username) VALUES ('381aefc3-3fdb-4255-886b-1dda1a257a85', true, '2025-12-25 19:41:46.46319+00', 'admin@hopefoundation.org', 'System Administrator', '2026-01-10 18:35:54.851995+00', '$2a$12$H6bq56zIrbt/jLIVX3Z5I.lXpHUbojxi4mK6lBIEtwWmCjzl02Ej6', 'ADMIN', '2026-01-10 18:35:54.853176+00', 'admin');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: e141057
--

INSERT INTO public.categories (id, active, color, created_at, description, display_order, icon, name, slug, updated_at) VALUES ('cat-001', true, '#667eea', '2025-12-25 18:20:34.690054+00', 'Supporting schools, scholarships, and educational programs', 1, '📚', 'Education', 'education', '2025-12-25 18:20:34.690054+00');
INSERT INTO public.categories (id, active, color, created_at, description, display_order, icon, name, slug, updated_at) VALUES ('cat-002', true, '#10b981', '2025-12-25 18:20:34.690054+00', 'Fighting hunger and malnutrition', 2, '🍲', 'Food & Nutrition', 'food-nutrition', '2025-12-25 18:20:34.690054+00');
INSERT INTO public.categories (id, active, color, created_at, description, display_order, icon, name, slug, updated_at) VALUES ('cat-003', true, '#f59e0b', '2025-12-25 18:20:34.690054+00', 'Supporting farmers with resources and training', 3, '🌾', 'Agriculture', 'agriculture', '2025-12-25 18:20:34.690054+00');
INSERT INTO public.categories (id, active, color, created_at, description, display_order, icon, name, slug, updated_at) VALUES ('cat-004', true, '#ef4444', '2025-12-25 18:20:34.690054+00', 'Providing medical care and wellness programs', 4, '🏥', 'Healthcare', 'healthcare', '2025-12-25 18:20:34.690054+00');
INSERT INTO public.categories (id, active, color, created_at, description, display_order, icon, name, slug, updated_at) VALUES ('cat-005', true, '#8b5cf6', '2025-12-25 18:20:34.690054+00', 'Job training and skill development', 5, '💼', 'Skill Training', 'skill-training', '2025-12-25 18:20:34.690054+00');
INSERT INTO public.categories (id, active, color, created_at, description, display_order, icon, name, slug, updated_at) VALUES ('cat-006', true, '#ec4899', '2025-12-25 18:20:34.690054+00', 'Supporting women through education and skills', 6, '👩', 'Women Empowerment', 'women-empowerment', '2025-12-25 18:20:34.690054+00');
INSERT INTO public.categories (id, active, color, created_at, description, display_order, icon, name, slug, updated_at) VALUES ('cat-007', true, '#dc2626', '2025-12-25 18:20:34.690054+00', 'Disaster relief and emergency aid', 7, '🚨', 'Emergency Relief', 'emergency-relief', '2025-12-25 18:20:34.690054+00');
INSERT INTO public.categories (id, active, color, created_at, description, display_order, icon, name, slug, updated_at) VALUES ('cat-008', true, '#06b6d4', '2025-12-25 18:20:34.690054+00', 'Access to clean water and sanitation', 8, '💧', 'Clean Water', 'clean-water', '2025-12-25 18:20:34.690054+00');


--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: e141057
--

INSERT INTO public.campaigns (id, active, beneficiaries_count, created_at, currency, current_amount, description, featured, image_url, location, short_description, slug, target_amount, title, updated_at, urgent, category_id) VALUES ('camp-food-002', true, 100, '2025-12-25 18:20:34.690722+00', 'usd', 12000, 'Our community kitchen will prepare and deliver fresh, nutritious meals to 100 senior citizens daily.', false, 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800', 'Chennai', 'Feed 100 senior citizens daily', 'community-kitchen-elderly', 48000, 'Community Kitchen', '2025-12-25 18:20:34.690722+00', false, 'cat-002');
INSERT INTO public.campaigns (id, active, beneficiaries_count, created_at, currency, current_amount, description, featured, image_url, location, short_description, slug, target_amount, title, updated_at, urgent, category_id) VALUES ('camp-agri-002', true, 100, '2025-12-25 18:20:34.690722+00', 'usd', 8000, 'Empower farmers to transition to organic farming with training, seeds, and certification support.', false, 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800', 'Karnataka', 'Train 100 farmers in organic methods', 'organic-farming-training', 35000, 'Organic Farming Training', '2025-12-25 18:20:34.690722+00', false, 'cat-003');
INSERT INTO public.campaigns (id, active, beneficiaries_count, created_at, currency, current_amount, description, featured, image_url, location, short_description, slug, target_amount, title, updated_at, urgent, category_id) VALUES ('camp-health-001', true, 1000, '2025-12-25 18:20:34.690722+00', 'usd', 18000, 'Monthly medical camps in remote villages offering free consultations, medicines, and health education.', false, 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=800', 'Uttarakhand', 'Free healthcare for 1000 villagers', 'mobile-medical-camp', 55000, 'Mobile Medical Camp', '2025-12-25 18:20:34.690722+00', false, 'cat-004');
INSERT INTO public.campaigns (id, active, beneficiaries_count, created_at, currency, current_amount, description, featured, image_url, location, short_description, slug, target_amount, title, updated_at, urgent, category_id) VALUES ('camp-health-003', true, 200, '2025-12-25 18:20:34.690722+00', 'usd', 25000, 'Provide pre-natal care, safe delivery, and post-natal support to 200 pregnant women in rural areas.', false, 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800', 'Assam', 'Safe childbirth for 200 mothers', 'maternity-health-program', 70000, 'Maternity Care', '2025-12-25 18:20:34.690722+00', true, 'cat-004');
INSERT INTO public.campaigns (id, active, beneficiaries_count, created_at, currency, current_amount, description, featured, image_url, location, short_description, slug, target_amount, title, updated_at, urgent, category_id) VALUES ('camp-skill-002', true, 80, '2025-12-25 18:20:34.690722+00', 'usd', 15000, 'Professional tailoring training with sewing machines to help women start their own business.', false, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'Jaipur', 'Enable 80 women to become tailors', 'tailoring-training-women', 45000, 'Tailoring Training', '2025-12-25 18:20:34.690722+00', false, 'cat-005');
INSERT INTO public.campaigns (id, active, beneficiaries_count, created_at, currency, current_amount, description, featured, image_url, location, short_description, slug, target_amount, title, updated_at, urgent, category_id) VALUES ('camp-women-002', true, 300, '2025-12-25 18:20:34.690722+00', 'usd', 8000, 'Comprehensive self-defense training covering martial arts basics and confidence building.', false, 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800', 'Delhi', 'Train 300 girls in self-defense', 'self-defense-training', 25000, 'Self Defense Training', '2025-12-25 18:20:34.690722+00', false, 'cat-006');
INSERT INTO public.campaigns (id, active, beneficiaries_count, created_at, currency, current_amount, description, featured, image_url, location, short_description, slug, target_amount, title, updated_at, urgent, category_id) VALUES ('camp-water-002', true, 3000, '2025-12-25 18:20:34.690722+00', 'usd', 18000, 'Ensure safe drinking water for 3000 children by installing RO systems in 20 schools.', false, 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800', 'West Bengal', 'Install purifiers in 20 schools', 'water-purification-schools', 50000, 'Water Purifiers', '2025-12-25 18:20:34.690722+00', false, 'cat-008');
INSERT INTO public.campaigns (id, active, beneficiaries_count, created_at, currency, current_amount, description, featured, image_url, location, short_description, slug, target_amount, title, updated_at, urgent, category_id) VALUES ('camp-agri-001', true, NULL, '2025-12-25 18:20:34.690722+00', 'usd', 35000, 'Help farmers increase crop yield by 40% through modern drip irrigation systems.', true, 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800', 'Punjab', 'Drip irrigation for 50 small farmers', 'irrigation-system-farmers', 80000, 'Irrigation for Farmers', '2025-12-25 21:28:38.688886+00', false, 'cat-003');
INSERT INTO public.campaigns (id, active, beneficiaries_count, created_at, currency, current_amount, description, featured, image_url, location, short_description, slug, target_amount, title, updated_at, urgent, category_id) VALUES ('camp-food-001', true, NULL, '2025-12-25 18:20:34.690722+00', 'usd', 89000, 'Fight childhood hunger by providing breakfast and lunch to 500 children from slum areas. A healthy meal ensures better attendance and development.', true, 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800', 'Mumbai', 'Nutritious meals for 500 children for one year', 'daily-meals-children', 365000, 'Daily Meals for Children', '2025-12-25 21:26:42.815297+00', true, 'cat-002');
INSERT INTO public.campaigns (id, active, beneficiaries_count, created_at, currency, current_amount, description, featured, image_url, location, short_description, slug, target_amount, title, updated_at, urgent, category_id) VALUES ('camp-edu-003', true, 100, '2025-12-25 18:20:34.690722+00', 'usd', 15000, 'Set up a modern computer lab with 25 computers and high-speed internet to help students gain essential digital skills.', false, 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800', 'Bihar', 'Computer lab with internet for 100 students', 'digital-learning-lab', 40000, 'Digital Learning Lab', '2025-12-31 16:48:18.382005+00', false, 'cat-001');
INSERT INTO public.campaigns (id, active, beneficiaries_count, created_at, currency, current_amount, description, featured, image_url, location, short_description, slug, target_amount, title, updated_at, urgent, category_id) VALUES ('camp-food-003', true, 0, '2025-12-25 18:20:34.690722+00', 'usd', 22000, 'Stock food bank with essential groceries to support 200 low-income families every month.', false, 'https://images.unsplash.com/photo-1593113648728-998ad9a89cd0?w=800', 'Delhi', 'Support 200 families with monthly groceries', 'food-bank-families', 60000, 'Food Bank', '2025-12-25 21:15:54.674357+00', true, 'cat-002');
INSERT INTO public.campaigns (id, active, beneficiaries_count, created_at, currency, current_amount, description, featured, image_url, location, short_description, slug, target_amount, title, updated_at, urgent, category_id) VALUES ('camp-edu-002', true, NULL, '2025-12-25 18:20:34.690722+00', 'usd', 28000, 'This scholarship fund will cover tuition, books, and uniforms for 50 girls from low-income families.', true, 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800', 'Kerala', 'Support 50 girls to complete high school', 'scholarship-fund-girls', 75000, 'Scholarship Fund for Girls', '2025-12-25 21:29:19.07016+00', true, 'cat-001');
INSERT INTO public.campaigns (id, active, beneficiaries_count, created_at, currency, current_amount, description, featured, image_url, location, short_description, slug, target_amount, title, updated_at, urgent, category_id) VALUES ('camp-water-001', true, 0, '2025-12-25 18:20:34.690722+00', 'usd', 55000, 'Bring clean water to 10 villages. Each well will serve 150-200 people.', true, 'https://images.unsplash.com/photo-1541844053589-346841d0b34c?w=800', 'Maharashtra', 'Construct 10 wells in drought areas', 'village-water-wells', 120000, 'Village Water Wells', '2025-12-25 21:23:06.405099+00', false, 'cat-008');
INSERT INTO public.campaigns (id, active, beneficiaries_count, created_at, currency, current_amount, description, featured, image_url, location, short_description, slug, target_amount, title, updated_at, urgent, category_id) VALUES ('camp-skill-001', true, NULL, '2025-12-25 18:20:34.690722+00', 'usd', 42000, '6-month intensive program covering programming, web development, and job readiness with placement assistance.', true, 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800', 'Bangalore', 'Train 150 youth in programming', 'it-skills-youth', 90000, 'IT Skills for Youth', '2025-12-25 21:22:15.336668+00', false, 'cat-005');
INSERT INTO public.campaigns (id, active, beneficiaries_count, created_at, currency, current_amount, description, featured, image_url, location, short_description, slug, target_amount, title, updated_at, urgent, category_id) VALUES ('camp-emergency-001', true, 500, '2025-12-25 18:20:34.690722+00', 'usd', 52000, 'Urgent: Floods have displaced 500 families. They need food, water, medicines, and shelter materials.', false, 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800', 'Odisha', 'Emergency supplies for 500 families', 'flood-relief-support', 85000, 'Flood Relief', '2025-12-25 21:16:53.369184+00', true, 'cat-007');
INSERT INTO public.campaigns (id, active, beneficiaries_count, created_at, currency, current_amount, description, featured, image_url, location, short_description, slug, target_amount, title, updated_at, urgent, category_id) VALUES ('camp-health-002', true, NULL, '2025-12-25 18:20:34.690722+00', 'usd', 12000, 'Fund cataract surgeries for 100 elderly people. Each surgery costs $300 and will transform lives.', true, 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800', 'Madhya Pradesh', 'Restore vision for 100 people', 'cataract-surgery-poor', 30000, 'Cataract Surgery', '2025-12-31 16:47:27.831127+00', false, 'cat-004');
INSERT INTO public.campaigns (id, active, beneficiaries_count, created_at, currency, current_amount, description, featured, image_url, location, short_description, slug, target_amount, title, updated_at, urgent, category_id) VALUES ('camp-edu-001', true, 200, '2025-12-25 18:20:34.690722+00', 'usd', 125000, 'Help us build a fully equipped primary school with 6 classrooms, library, and playground in a rural village. This will provide quality education to 200+ children.', true, 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800', 'Rajasthan', 'Construct a primary school for 200 children', 'build-school-rural-village', 500000, 'Build School in Rural Village', '2025-12-25 21:17:18.904823+00', false, 'cat-001');
INSERT INTO public.campaigns (id, active, beneficiaries_count, created_at, currency, current_amount, description, featured, image_url, location, short_description, slug, target_amount, title, updated_at, urgent, category_id) VALUES ('camp-women-001', true, NULL, '2025-12-25 18:20:34.690722+00', 'usd', 18000, 'Interest-free microloans ($200-$500) with business training and mentorship.', true, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800', 'Gujarat', 'Microloans to 100 women entrepreneurs', 'women-entrepreneur-fund', 40000, 'Women Entrepreneur Fund', '2025-12-25 21:28:15.899566+00', false, 'cat-006');


--
-- Data for Name: carousel_images; Type: TABLE DATA; Schema: public; Owner: e141057
--

INSERT INTO public.carousel_images (id, active, alt_text, created_at, display_order, image_url, updated_at) VALUES ('carousel-001', true, 'Children enjoying nutritious meals', '2025-12-25 18:20:34.693782+00', 1, 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&auto=format&fit=crop&q=80', '2025-12-25 18:20:34.693782+00');
INSERT INTO public.carousel_images (id, active, alt_text, created_at, display_order, image_url, updated_at) VALUES ('carousel-002', true, 'Students learning in new classroom', '2025-12-25 18:20:34.693782+00', 2, 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&auto=format&fit=crop&q=80', '2025-12-25 18:20:34.693782+00');
INSERT INTO public.carousel_images (id, active, alt_text, created_at, display_order, image_url, updated_at) VALUES ('carousel-003', true, 'Women empowerment training session', '2025-12-25 18:20:34.693782+00', 3, 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&auto=format&fit=crop&q=80', '2025-12-25 18:20:34.693782+00');


--
-- Data for Name: cms_content; Type: TABLE DATA; Schema: public; Owner: e141057
--

INSERT INTO public.cms_content (id, active, content_key, content_type, content_value, created_at, display_order, section, updated_at) VALUES ('cms-hero-001', true, 'title', 'TEXT', 'Make a Difference in People''s Lives', '2025-12-25 18:20:34.691835+00', 1, 'hero', '2025-12-25 18:20:34.691835+00');
INSERT INTO public.cms_content (id, active, content_key, content_type, content_value, created_at, display_order, section, updated_at) VALUES ('cms-hero-002', true, 'subtitle', 'TEXT', 'Join us in transforming communities through education, healthcare, and sustainable development', '2025-12-25 18:20:34.691835+00', 2, 'hero', '2025-12-25 18:20:34.691835+00');
INSERT INTO public.cms_content (id, active, content_key, content_type, content_value, created_at, display_order, section, updated_at) VALUES ('cms-hero-003', true, 'cta_text', 'TEXT', 'Start Your Impact Today', '2025-12-25 18:20:34.691835+00', 3, 'hero', '2025-12-25 18:20:34.691835+00');
INSERT INTO public.cms_content (id, active, content_key, content_type, content_value, created_at, display_order, section, updated_at) VALUES ('cms-why-001', true, 'title', 'TEXT', 'Why Your Donation Matters', '2025-12-25 18:20:34.692419+00', 1, 'why_donate', '2025-12-25 18:20:34.692419+00');
INSERT INTO public.cms_content (id, active, content_key, content_type, content_value, created_at, display_order, section, updated_at) VALUES ('cms-why-002', true, 'subtitle', 'TEXT', 'Every contribution creates lasting change', '2025-12-25 18:20:34.692419+00', 2, 'why_donate', '2025-12-25 18:20:34.692419+00');
INSERT INTO public.cms_content (id, active, content_key, content_type, content_value, created_at, display_order, section, updated_at) VALUES ('cms-why-003', true, 'point1_title', 'TEXT', 'Direct Impact', '2025-12-25 18:20:34.692419+00', 3, 'why_donate', '2025-12-25 18:20:34.692419+00');
INSERT INTO public.cms_content (id, active, content_key, content_type, content_value, created_at, display_order, section, updated_at) VALUES ('cms-why-004', true, 'point1_text', 'TEXT', '100% of your donation goes directly to the cause', '2025-12-25 18:20:34.692419+00', 4, 'why_donate', '2025-12-25 18:20:34.692419+00');
INSERT INTO public.cms_content (id, active, content_key, content_type, content_value, created_at, display_order, section, updated_at) VALUES ('cms-why-005', true, 'point2_title', 'TEXT', 'Transparency', '2025-12-25 18:20:34.692419+00', 5, 'why_donate', '2025-12-25 18:20:34.692419+00');
INSERT INTO public.cms_content (id, active, content_key, content_type, content_value, created_at, display_order, section, updated_at) VALUES ('cms-why-006', true, 'point2_text', 'TEXT', 'Track how your contribution is making a difference', '2025-12-25 18:20:34.692419+00', 6, 'why_donate', '2025-12-25 18:20:34.692419+00');
INSERT INTO public.cms_content (id, active, content_key, content_type, content_value, created_at, display_order, section, updated_at) VALUES ('cms-why-007', true, 'point3_title', 'TEXT', 'Verified Causes', '2025-12-25 18:20:34.692419+00', 7, 'why_donate', '2025-12-25 18:20:34.692419+00');
INSERT INTO public.cms_content (id, active, content_key, content_type, content_value, created_at, display_order, section, updated_at) VALUES ('cms-why-008', true, 'point3_text', 'TEXT', 'All campaigns are vetted and monitored for impact', '2025-12-25 18:20:34.692419+00', 8, 'why_donate', '2025-12-25 18:20:34.692419+00');


--
-- Data for Name: contact_settings; Type: TABLE DATA; Schema: public; Owner: e141057
--

INSERT INTO public.contact_settings (id, created_at, email, locations_json, updated_at, show_in_footer) VALUES ('704f5c9f-d1e8-44bc-972a-264e2fe5b548', '2025-12-25 18:20:34.786658+00', 'yugalsavitriseva@gmail.com', '[]', '2026-01-01 13:40:40.053565+00', true);


--
-- Data for Name: donations; Type: TABLE DATA; Schema: public; Owner: e141057
--

INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('don-001', 10000, '2025-12-15 18:20:34.695093+00', 'usd', 'sarah.j@example.com', 'Sarah Johnson', 'SUCCESS', 'pi_1', 'cs_test_1', 'camp-edu-001');
INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('don-002', 25000, '2025-12-17 18:20:34.695093+00', 'usd', 'michael.c@example.com', 'Michael Chen', 'SUCCESS', 'pi_2', 'cs_test_2', 'camp-edu-001');
INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('don-003', 5000, '2025-12-18 18:20:34.695093+00', 'usd', 'emily.r@example.com', 'Emily Rodriguez', 'SUCCESS', 'pi_3', 'cs_test_3', 'camp-food-001');
INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('don-004', 15000, '2025-12-19 18:20:34.695093+00', 'usd', 'david.k@example.com', 'David Kumar', 'SUCCESS', 'pi_4', 'cs_test_4', 'camp-agri-001');
INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('don-005', 20000, '2025-12-20 18:20:34.695093+00', 'usd', 'lisa.a@example.com', 'Lisa Anderson', 'SUCCESS', 'pi_5', 'cs_test_5', 'camp-skill-001');
INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('don-006', 7500, '2025-12-21 18:20:34.695093+00', 'usd', 'james.w@example.com', 'James Wilson', 'SUCCESS', 'pi_6', 'cs_test_6', 'camp-women-001');
INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('don-007', 12000, '2025-12-22 18:20:34.695093+00', 'usd', 'maria.g@example.com', 'Maria Garcia', 'SUCCESS', 'pi_7', 'cs_test_7', 'camp-water-001');
INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('don-008', 30000, '2025-12-23 18:20:34.695093+00', 'usd', 'robert.t@example.com', 'Robert Taylor', 'SUCCESS', 'pi_8', 'cs_test_8', 'camp-health-002');
INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('don-009', 8000, '2025-12-24 18:20:34.695093+00', 'usd', 'jennifer.l@example.com', 'Jennifer Lee', 'SUCCESS', 'pi_9', 'cs_test_9', 'camp-edu-002');
INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('don-010', 50000, '2025-12-25 18:20:34.695093+00', 'usd', 'william.b@example.com', 'William Brown', 'SUCCESS', 'pi_10', 'cs_test_10', 'camp-emergency-001');
INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('11306e0c-72b9-4ba0-87f7-c908d5427c5c', 200, '2025-12-26 06:59:26.551392+00', 'eur', NULL, 'Anonymous', 'PENDING', NULL, 'cs_test_a1hdYmvNMNcK2zOWdNWXeySQ6SK7c2WM7ZtUOePrm2OcJVN2CeAAXgDuh9', 'camp-health-001');
INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('83885204-2977-4d25-8b00-15a88039f05c', 100, '2025-12-26 07:02:44.006109+00', 'eur', 'kishankumarnaukri@gmail.com', 'Kishan Kumar', 'SUCCESS', 'pi_3SiV33HqvjNDXl7G1TJ9p658', 'cs_test_a1Uc1M2XqnJhwSsomU2XeK0XaZP6pG6uZI4PuWhMzOMwx9xfiZ7W8mc0UX', 'camp-edu-003');
INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('69030d3c-269a-4dea-be9d-c61ff638d26c', 1000, '2025-12-31 13:06:47.844547+00', 'eur', 'kishankumarnaukri@gmail.com', 'Kishan Kumar', 'SUCCESS', 'pi_3SkP78HqvjNDXl7G16Ynd136', 'cs_test_a1bjLclkYDETVpqKiEVEWzrmH9zKBHl54PB2xrJdTu87OSHrnrdlrEYkyp', 'camp-agri-002');
INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('8f98ca04-b7b9-45a5-bc74-9266ab7b92f7', 500, '2026-01-04 12:27:41.073773+00', 'eur', NULL, 'Anonymous', 'SUCCESS', 'pi_3SlqPXHqvjNDXl7G07yXDsxV', 'cs_test_a1Sd70qNLTLSeKIroN6ZWsumi7PLUa3VdY1UVlLaF2zmcqVntFufxE0qBY', 'camp-food-002');
INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('bdcf9f23-85aa-4f03-a691-df8545af26db', 500, '2026-01-08 19:59:30.074579+00', 'eur', NULL, 'Anonymous', 'SUCCESS', 'pi_3SnPMyHqvjNDXl7G1lKvzJkd', 'cs_test_a1KtSRsMul4jzrntPxmtWhBc3HB7fVBnJP4OhLhFAkqpF5PeZmeOPQOQQG', 'camp-food-002');
INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('ccfcf86d-8db8-4a9f-beae-b311d14529c4', 500, '2026-01-09 05:25:02.362802+00', 'eur', NULL, 'Anonymous', 'SUCCESS', 'pi_3SnYCDHqvjNDXl7G0wdiTMxZ', 'cs_test_a1jOYVHVy1SmxSObkb1zLOlgEhMhXao0pQEyCQHnlzdTG2ktezRZRoKZks', 'camp-food-002');
INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('5bf107ff-693d-467f-9805-a149392d0cf2', 100, '2026-01-09 05:31:28.456685+00', 'eur', NULL, 'Anonymous', 'SUCCESS', 'pi_3SnYIRHqvjNDXl7G0Nu9aD1o', 'cs_test_a1SP8s7A4nGXlDfSYhq70mN3tEZZ1X63PeiAe05UlZP7vOrBcmL8t7zoZH', 'camp-food-002');
INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('1b41c4df-cd1b-439e-99f5-4d41fc60c4e4', 500, '2026-01-10 09:19:22.780635+00', 'eur', NULL, 'Anonymous', 'SUCCESS', 'pi_3SnyKfHqvjNDXl7G1dqIqqcI', 'cs_test_a1shsTkOCBVGKAjf4gDNDnacuA0t5oW7cLoptAPNBnqNSvL19AaMgTY9W4', 'camp-food-002');
INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('6504947f-a4f4-4486-9357-adf8bcd4c1a0', 100, '2026-01-10 12:59:01.725501+00', 'usd', 'kishankumarnaukri@gmail.com', 'Test Donor', 'PENDING', NULL, 'cs_test_a1UO1vCiYUuFi0eefgnC3I8E8c2zNTaOZXdvurd8ZCi7KiFD5jQTlXc57q', 'camp-food-002');
INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('964a68dc-16b2-4200-b55c-9517e0fc5f68', 500, '2026-01-10 13:00:42.195423+00', 'eur', 'kishankumarnaukri@gmail.com', 'Kishan Kumar', 'SUCCESS', 'pi_3So1mkHqvjNDXl7G1txBnW0y', 'cs_test_a11ew67p8D8m3PhWbTuknwJButB5pJJPzM6S9RxH07ugErFdwjdFdbIHnC', 'camp-food-002');
INSERT INTO public.donations (id, amount, created_at, currency, donor_email, donor_name, status, stripe_payment_intent_id, stripe_session_id, campaign_id) VALUES ('026b1252-d3c9-4c89-8ffc-ab27ed281663', 1000, '2026-01-10 13:03:52.022351+00', 'eur', 'williamy733@gmail.com', 'william', 'SUCCESS', 'pi_3So1prHqvjNDXl7G1FyCv1hU', 'cs_test_a1oQ8sTea8eJZM7o5ROdGBUTuJBhFnNCEdNmXhHy2UGGrMzIwZjjkfIfua', 'camp-food-002');


--
-- Data for Name: footer_settings; Type: TABLE DATA; Schema: public; Owner: e141057
--

INSERT INTO public.footer_settings (id, copyright_text, created_at, disclaimer_text, facebook_url, instagram_url, linkedin_url, show_get_involved, show_quick_links, tagline, twitter_url, updated_at, youtube_url) VALUES ('06562405-8399-4168-a6aa-72ffc8fd4aed', '© {year} {siteName}. All rights reserved. Registered Charity', '2026-01-01 12:58:06.052855', '{siteName} is a registered nonprofit organization. Donations are tax-deductible to the extent permitted by law.', 'https://facebook.com', 'https://instagram.com', 'https://linkedin.com', true, true, 'Empowering communities worldwide through compassion and action....', 'https://twitter.com', '2026-01-01 12:58:06.052913', 'https://youtube.com');


--
-- Data for Name: hero_slides; Type: TABLE DATA; Schema: public; Owner: e141057
--

INSERT INTO public.hero_slides (id, alt_text, created_at, enabled, focus, image_url, sort_order, updated_at, deleted_at, deleted) VALUES ('72e55827-1fe7-4770-8b52-92dc5249351f', 'children education', '2026-01-01 12:10:57.071372+00', true, 'CENTER', '/children_education.png', 10, '2026-01-01 12:12:45.259722+00', NULL, false);
INSERT INTO public.hero_slides (id, alt_text, created_at, enabled, focus, image_url, sort_order, updated_at, deleted_at, deleted) VALUES ('09149e92-8521-4781-b35e-df07519999f3', 'child nutrition', '2026-01-01 11:59:20.186727+00', true, 'CENTER', '/child_nutrition.png', 20, '2026-01-01 12:12:48.408137+00', NULL, false);


--
-- Data for Name: home_sections; Type: TABLE DATA; Schema: public; Owner: e141057
--

INSERT INTO public.home_sections (id, config_json, created_at, enabled, sort_order, type, updated_at) VALUES ('642cfd79-13af-4990-b87c-9668d26d5d45', NULL, '2026-01-01 12:14:28.256296+00', true, 10, 'hero_carousel', '2026-01-01 12:18:13.76979+00');
INSERT INTO public.home_sections (id, config_json, created_at, enabled, sort_order, type, updated_at) VALUES ('ff45851d-5dad-4de1-87de-df452a67697a', NULL, '2026-01-01 12:14:28.256296+00', false, 60, 'testimonials', '2026-01-01 12:18:13.770052+00');
INSERT INTO public.home_sections (id, config_json, created_at, enabled, sort_order, type, updated_at) VALUES ('6a604d33-1f8d-4e9a-ae4c-4b78c47aaf5d', NULL, '2026-01-01 12:14:28.256296+00', true, 20, 'featured_campaigns', '2026-01-01 12:19:43.657492+00');
INSERT INTO public.home_sections (id, config_json, created_at, enabled, sort_order, type, updated_at) VALUES ('5e9ffce7-5a73-411d-b965-dfd21cac6da2', NULL, '2026-01-01 12:14:28.256296+00', true, 30, 'hero_content', '2026-01-01 12:19:43.657608+00');
INSERT INTO public.home_sections (id, config_json, created_at, enabled, sort_order, type, updated_at) VALUES ('6e2bf8e8-e294-4801-89bc-d2071811f6e3', NULL, '2026-01-01 12:14:28.256296+00', true, 40, 'stats', '2026-01-01 12:19:43.657642+00');
INSERT INTO public.home_sections (id, config_json, created_at, enabled, sort_order, type, updated_at) VALUES ('704a150d-575f-45b4-9883-0e71f2e898c8', NULL, '2026-01-01 12:14:28.256296+00', true, 50, 'why_donate', '2026-01-01 12:19:43.657673+00');


--
-- Data for Name: homepage_stats; Type: TABLE DATA; Schema: public; Owner: e141057
--

INSERT INTO public.homepage_stats (id, active, created_at, display_order, icon, stat_label, stat_value, updated_at) VALUES ('stat-001', true, '2025-12-25 18:20:34.69269+00', 1, '👥', 'Lives Impacted', '50,000+', '2025-12-25 18:20:34.69269+00');
INSERT INTO public.homepage_stats (id, active, created_at, display_order, icon, stat_label, stat_value, updated_at) VALUES ('stat-002', true, '2025-12-25 18:20:34.69269+00', 2, '📋', 'Active Campaigns', '25', '2025-12-25 18:20:34.69269+00');
INSERT INTO public.homepage_stats (id, active, created_at, display_order, icon, stat_label, stat_value, updated_at) VALUES ('stat-003', true, '2025-12-25 18:20:34.69269+00', 3, '💰', 'Funds Raised', '$2.5M', '2025-12-25 18:20:34.69269+00');
INSERT INTO public.homepage_stats (id, active, created_at, display_order, icon, stat_label, stat_value, updated_at) VALUES ('stat-004', true, '2025-12-25 18:20:34.69269+00', 4, '✅', 'Success Rate', '95%', '2025-12-25 18:20:34.69269+00');


--
-- Data for Name: otp_tokens; Type: TABLE DATA; Schema: public; Owner: e141057
--



--
-- Data for Name: password_setup_tokens; Type: TABLE DATA; Schema: public; Owner: e141057
--



--
-- Data for Name: security_questions; Type: TABLE DATA; Schema: public; Owner: e141057
--

INSERT INTO public.security_questions (id, active, created_at, display_order, question, updated_at) VALUES ('8ed00f22-82c9-4149-9a75-2197edf36469', true, '2025-12-25 18:20:34.754566+00', 1, 'What was the name of your first pet?', '2025-12-25 18:20:34.754567+00');
INSERT INTO public.security_questions (id, active, created_at, display_order, question, updated_at) VALUES ('7c54a8ee-68a8-4606-a374-9d54ad39bf9e', true, '2025-12-25 18:20:34.763973+00', 2, 'What city were you born in?', '2025-12-25 18:20:34.763973+00');
INSERT INTO public.security_questions (id, active, created_at, display_order, question, updated_at) VALUES ('6c295cee-5324-49b2-b356-a1f3ab0d4646', true, '2025-12-25 18:20:34.764712+00', 3, 'What is your mother''s maiden name?', '2025-12-25 18:20:34.764713+00');
INSERT INTO public.security_questions (id, active, created_at, display_order, question, updated_at) VALUES ('78164156-acd8-4489-a2d2-8705df3f3080', true, '2025-12-25 18:20:34.765361+00', 4, 'What was the name of your elementary school?', '2025-12-25 18:20:34.765361+00');
INSERT INTO public.security_questions (id, active, created_at, display_order, question, updated_at) VALUES ('c2bc473f-1ee7-4ead-8136-442d469fdb9b', true, '2025-12-25 18:20:34.766079+00', 5, 'What is your favorite book?', '2025-12-25 18:20:34.766079+00');
INSERT INTO public.security_questions (id, active, created_at, display_order, question, updated_at) VALUES ('33f0592f-bc47-4e65-9039-adab5e84ec96', true, '2025-12-25 18:20:34.766844+00', 6, 'What was the make of your first car?', '2025-12-25 18:20:34.766844+00');
INSERT INTO public.security_questions (id, active, created_at, display_order, question, updated_at) VALUES ('f2c27fc3-5db8-41e7-8189-a00e58b15ed4', true, '2025-12-25 18:20:34.76746+00', 7, 'What is the name of your favorite teacher?', '2025-12-25 18:20:34.76746+00');
INSERT INTO public.security_questions (id, active, created_at, display_order, question, updated_at) VALUES ('c8194325-9725-480e-86b5-22f0ca69eb8d', true, '2025-12-25 18:20:34.768071+00', 8, 'What street did you grow up on?', '2025-12-25 18:20:34.768071+00');
INSERT INTO public.security_questions (id, active, created_at, display_order, question, updated_at) VALUES ('f5419f62-fa89-4564-84cd-5eed8dcd3289', true, '2025-12-25 18:20:34.768796+00', 9, 'What is your favorite food?', '2025-12-25 18:20:34.768796+00');
INSERT INTO public.security_questions (id, active, created_at, display_order, question, updated_at) VALUES ('317ed8c2-59eb-4120-b1cd-f41faa530621', true, '2025-12-25 18:20:34.769382+00', 10, 'What is the name of the town where you were born?', '2025-12-25 18:20:34.769382+00');


--
-- Data for Name: site_config; Type: TABLE DATA; Schema: public; Owner: e141057
--

INSERT INTO public.site_config (id, config_key, config_value, created_at, description, updated_at) VALUES ('config-002', 'campaigns_page.items_per_page', '6', '2025-12-25 18:20:34.687915+00', 'Number of campaigns to show per page on campaigns list', '2025-12-25 18:32:39.68845+00');
INSERT INTO public.site_config (id, config_key, config_value, created_at, description, updated_at) VALUES ('config-001', 'homepage.featured_campaigns_count', '4', '2025-12-25 18:20:34.687915+00', 'Number of featured campaigns to show on homepage', '2025-12-25 18:33:21.070362+00');
INSERT INTO public.site_config (id, config_key, config_value, created_at, description, updated_at) VALUES ('80e2904b-d5b8-4ddd-9ed1-34a56640f497', 'donate_popup.spotlight_campaign_id', 'camp-food-002', '2025-12-25 19:04:44.404244+00', 'Campaign ID to feature in Donate Now popup (null for automatic selection)', '2025-12-31 16:02:28.362192+00');


--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: e141057
--

INSERT INTO public.site_settings (setting_key, created_at, description, is_public, setting_type, updated_at, updated_by, setting_value) VALUES ('campaigns_page.items_per_page', '2026-01-01 07:57:34.013384+00', 'Number of campaigns per page in campaign list', true, 'INTEGER', '2026-01-01 07:57:34.013384+00', 'system', '12');
INSERT INTO public.site_settings (setting_key, created_at, description, is_public, setting_type, updated_at, updated_by, setting_value) VALUES ('site.name', '2026-01-01 07:57:34.015191+00', 'Site name displayed in header and footer', true, 'STRING', '2026-01-01 07:57:34.015191+00', 'system', 'Yugal Savitri Seva');
INSERT INTO public.site_settings (setting_key, created_at, description, is_public, setting_type, updated_at, updated_by, setting_value) VALUES ('site.tagline', '2026-01-01 07:57:34.016528+00', 'Site tagline or slogan', true, 'STRING', '2026-01-01 07:57:34.016528+00', 'system', 'Empowering communities worldwide');
INSERT INTO public.site_settings (setting_key, created_at, description, is_public, setting_type, updated_at, updated_by, setting_value) VALUES ('maintenance.mode', '2026-01-01 07:57:34.017845+00', 'Enable maintenance mode to block non-admin access', false, 'BOOLEAN', '2026-01-01 07:57:34.017845+00', 'system', 'false');
INSERT INTO public.site_settings (setting_key, created_at, description, is_public, setting_type, updated_at, updated_by, setting_value) VALUES ('donate_popup.spotlight_campaign_id', '2026-01-01 07:57:34.019641+00', 'Campaign ID to feature in Donate Now popup (empty for automatic selection)', false, 'STRING', '2026-01-01 07:57:34.019641+00', 'system', '');
INSERT INTO public.site_settings (setting_key, created_at, description, is_public, setting_type, updated_at, updated_by, setting_value) VALUES ('homepage.featured_campaigns_count', '2026-01-01 07:57:34.001955+00', 'Number of featured campaigns to show on homepage', true, 'INTEGER', '2026-01-01 12:31:16.157008+00', 'admin', '9');


--
-- Data for Name: social_media; Type: TABLE DATA; Schema: public; Owner: e141057
--

INSERT INTO public.social_media (id, active, created_at, display_order, icon, platform, updated_at, url) VALUES ('social-001', true, '2025-12-25 18:20:34.694408+00', 1, 'facebook', 'Facebook', '2025-12-25 18:20:34.694408+00', 'https://facebook.com/myfoundation');
INSERT INTO public.social_media (id, active, created_at, display_order, icon, platform, updated_at, url) VALUES ('social-002', true, '2025-12-25 18:20:34.694408+00', 2, 'twitter', 'Twitter', '2025-12-25 18:20:34.694408+00', 'https://twitter.com/myfoundation');
INSERT INTO public.social_media (id, active, created_at, display_order, icon, platform, updated_at, url) VALUES ('social-003', true, '2025-12-25 18:20:34.694408+00', 3, 'instagram', 'Instagram', '2025-12-25 18:20:34.694408+00', 'https://instagram.com/myfoundation');
INSERT INTO public.social_media (id, active, created_at, display_order, icon, platform, updated_at, url) VALUES ('social-004', true, '2025-12-25 18:20:34.694408+00', 4, 'linkedin', 'LinkedIn', '2025-12-25 18:20:34.694408+00', 'https://linkedin.com/company/myfoundation');


--
-- Data for Name: stripe_event_records; Type: TABLE DATA; Schema: public; Owner: e141057
--

INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('7cf31aa6-ef2a-4c2a-b82c-c9141ac4147d', 'evt_3SnPMyHqvjNDXl7G1fKuPxJq', '2026-01-08 19:59:45.404724+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('28dc1db3-f0e2-4d75-ba60-75d8324c86b3', 'evt_3SnPMyHqvjNDXl7G1xewsccU', '2026-01-08 19:59:45.471295+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('cb94d0c9-517c-4a74-8c99-6bf41972ef49', 'evt_1SnPMzHqvjNDXl7G8DXVhoRL', '2026-01-08 19:59:45.515883+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('11792c59-2a0f-4db3-adaf-e72cccf5793c', 'evt_3SnPMyHqvjNDXl7G1ux4EZ40', '2026-01-08 19:59:47.90908+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('019f3171-2990-41ee-bc8d-344867ec38d2', 'evt_3SnYCDHqvjNDXl7G0xffLt8I', '2026-01-09 05:25:14.812256+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('d81e6ecd-292e-45a6-91e0-47e70e820074', 'evt_3SnYCDHqvjNDXl7G0nKSvakn', '2026-01-09 05:25:14.8758+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('9cc0ff67-b148-416f-b4de-7b5f32d5e98d', 'evt_1SnYCEHqvjNDXl7G4hWn5e7D', '2026-01-09 05:25:15.208335+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('46605a02-8b70-4f29-be42-66d3682dcbd4', 'evt_3SnYCDHqvjNDXl7G0arfTaFf', '2026-01-09 05:25:15.982185+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('95fb0772-f155-4e06-b21f-3bc9092eeb44', 'evt_3SnYCDHqvjNDXl7G0UOVFZLG', '2026-01-09 05:25:17.50001+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('619d41d5-c25f-4e0c-a7e8-4553300fb369', 'evt_3SnYIRHqvjNDXl7G03mIa4ie', '2026-01-09 05:31:40.468577+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('da45bef1-8f38-48f0-9522-2048ccf51993', 'evt_3SnYIRHqvjNDXl7G03IR2i34', '2026-01-09 05:31:40.528665+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('9ef783ee-8c3e-428c-b867-826f31cabadc', 'evt_3SnYIRHqvjNDXl7G0TS3m5Q1', '2026-01-09 05:31:40.573556+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('f791385c-78a5-40fd-898e-0e837a8cf5fc', 'evt_1SnYISHqvjNDXl7G40j5jBBY', '2026-01-09 05:31:40.752069+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('331e58fe-36d9-47ca-8a55-cbbbc42349dc', 'evt_3SnYIRHqvjNDXl7G0VPsqWP6', '2026-01-09 05:31:42.87214+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('e7c5f2db-78cb-43d6-8c37-204a54798476', 'evt_3SnyKfHqvjNDXl7G13udBiyo', '2026-01-10 09:19:42.97742+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('a0f26496-504f-4609-89ee-e45e4340044f', 'evt_3SnyKfHqvjNDXl7G1gHc5Vvj', '2026-01-10 09:19:43.074207+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('b1c6c947-c090-44c6-a0f4-c9a566d0c734', 'evt_3SnyKfHqvjNDXl7G1qcw4lSl', '2026-01-10 09:19:43.07635+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('c8860c75-3b2f-4c52-9c93-ceb2058ccea7', 'evt_1SnyKgHqvjNDXl7GhA1BGztA', '2026-01-10 09:19:43.431308+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('2fee6792-883f-4459-aae0-5a113622fecd', 'evt_3SnyKfHqvjNDXl7G1OLxXKau', '2026-01-10 09:19:45.331168+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('c692c7d3-2372-4ee0-a44d-dd3dac8e44ef', 'evt_3So1mkHqvjNDXl7G1EbCC6ti', '2026-01-10 13:00:56.171042+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('6361e6a7-5180-4e6f-8820-7f70551f4db3', 'evt_3So1mkHqvjNDXl7G1kgcSPj8', '2026-01-10 13:00:56.191+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('2e7f0fc3-0f75-4ae7-bad0-85789bc0adb2', 'evt_3So1mkHqvjNDXl7G1ZpMdVMR', '2026-01-10 13:00:56.251462+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('3c8a7fa9-adaa-4461-b797-4d41f549683c', 'evt_1So1mmHqvjNDXl7GUTg9JtzU', '2026-01-10 13:00:56.311571+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('da6126eb-b01e-46d5-9e21-9aeed76e0123', 'evt_3So1mkHqvjNDXl7G1GBAXp17', '2026-01-10 13:00:58.513022+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('d4823d36-4a87-4ca4-8bff-897f3c944632', 'evt_3So1prHqvjNDXl7G1AtBjjO2', '2026-01-10 13:04:08.432796+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('0631070a-2cf6-4d67-8066-64bdc16cfe59', 'evt_3So1prHqvjNDXl7G1wVYTcAh', '2026-01-10 13:04:08.490353+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('352c6d2d-ca85-4b7f-8cef-ae29e8d646a9', 'evt_3So1prHqvjNDXl7G13EGsoax', '2026-01-10 13:04:08.731836+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('49edc2e5-9fdc-4e3a-9047-cac0045ef979', 'evt_1So1psHqvjNDXl7GfropJp2q', '2026-01-10 13:04:08.890231+00');
INSERT INTO public.stripe_event_records (id, event_id, received_at) VALUES ('c4c9455d-a8ec-4709-a09d-d567f84f1d30', 'evt_3So1prHqvjNDXl7G1LyCeCDi', '2026-01-10 13:04:10.847955+00');


--
-- Data for Name: testimonials; Type: TABLE DATA; Schema: public; Owner: e141057
--

INSERT INTO public.testimonials (id, active, author_name, author_title, created_at, display_order, testimonial_text, updated_at) VALUES ('test-001', true, 'Priya Sharma', 'Scholarship Recipient', '2025-12-25 18:20:34.693253+00', 1, 'Thanks to the scholarship fund, I completed my education and now work as a teacher, helping other students achieve their dreams.', '2025-12-25 18:20:34.693253+00');
INSERT INTO public.testimonials (id, active, author_name, author_title, created_at, display_order, testimonial_text, updated_at) VALUES ('test-002', true, 'Rajesh Kumar', 'Farmer, Punjab', '2025-12-25 18:20:34.693253+00', 2, 'The drip irrigation system increased my crop yield by 45%. My family''s income has doubled, and we can now afford better education for our children.', '2025-12-25 18:20:34.693253+00');
INSERT INTO public.testimonials (id, active, author_name, author_title, created_at, display_order, testimonial_text, updated_at) VALUES ('test-003', true, 'Anita Desai', 'Women Entrepreneur', '2025-12-25 18:20:34.693253+00', 3, 'The microloan and training helped me start my tailoring business. I now employ 3 other women from my village.', '2025-12-25 18:20:34.693253+00');


--
-- Data for Name: user_security_answers; Type: TABLE DATA; Schema: public; Owner: e141057
--



--
-- PostgreSQL database dump complete
--

\unrestrict cArdBIRrLb1USZeI5tQlRn5QD27AhRiEoouSxW8aDpUbW9ONjydH6wIT8LpmKqO

