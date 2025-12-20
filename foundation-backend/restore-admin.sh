#!/bin/bash

# Script to restore admin user to the database
# This connects directly to the PostgreSQL database and runs the restore SQL

echo "🔄 Restoring admin user..."
echo ""

PGPASSWORD="npg_zC7GDKo2JeUq" psql \
  -h ep-mute-scene-abnd9qj2-pooler.eu-west-2.aws.neon.tech \
  -U neondb_owner \
  -d neondb \
  -f restore-admin.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Admin user restored successfully!"
  echo ""
  echo "📝 Login credentials:"
  echo "   Username: admin"
  echo "   Email: admin@foundation.org"
  echo "   Password: admin123"
  echo ""
  echo "⚠️  IMPORTANT: Please change the password after logging in!"
else
  echo ""
  echo "❌ Failed to restore admin user. Please check the error messages above."
  exit 1
fi
