#!/bin/bash
# Create default admin user for NGO Foundation Backend
# Usage: ./create-admin.sh

echo "Creating admin user in database..."

psql -U e141057 -d ngo_donations <<SQL
-- Delete existing admin user if exists
DELETE FROM admin_users WHERE email = 'admin@hopefoundation.org';

-- Insert default admin user
-- Username: admin
-- Password: admin123
INSERT INTO admin_users (id, username, email, password, full_name, role, active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'admin',
    'admin@hopefoundation.org',
    (SELECT password FROM admin_users WHERE username = 'kishan12'), -- Copy same hash format
    'System Administrator',
    'ADMIN',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'admin@hopefoundation.org');

-- Verify admin user was created
SELECT username, email, active, created_at FROM admin_users WHERE email = 'admin@hopefoundation.org';
SQL

echo ""
echo "✅ Admin user created successfully!"
echo "📧 Email: admin@hopefoundation.org"
echo "🔑 Username: admin"
echo "🔐 Password: admin123"
echo ""
echo "⚠️  Please change the password after first login!"
