-- ============================================
-- Restore Admin User Script
-- ============================================
-- This script restores the default admin user account
-- 
-- Default Credentials:
--   Username: admin
--   Email: admin@foundation.org
--   Password: admin123
-- 
-- IMPORTANT: Change the password after first login!
-- ============================================

-- First, delete any orphaned password setup tokens for admin
DELETE FROM password_setup_tokens 
WHERE admin_user_id IN (
  SELECT id FROM admin_users WHERE email = 'admin@foundation.org'
);

-- Restore or update the admin user
-- Password is: admin123 (bcrypt encoded)
INSERT INTO admin_users (id, username, email, password, full_name, role, active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin',
    'admin@foundation.org',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye1FJFQ8w8JqVF.M8zjOtLQnZnY/3e6Ta',
    'System Administrator',
    'ADMIN',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    password = EXCLUDED.password,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    active = EXCLUDED.active,
    updated_at = NOW();

-- Verify the admin user was created/updated
SELECT id, username, email, full_name, role, active, created_at
FROM admin_users
WHERE email = 'admin@foundation.org';
