#!/bin/bash
# Start Foundation Backend with Neon Cloud Database
# This script starts the backend connected to the Neon PostgreSQL cloud database

echo "🚀 Starting Foundation Backend with Neon Database..."

# Set Neon Database Credentials
export SPRING_DATASOURCE_URL="jdbc:postgresql://ep-mute-scene-abnd9qj2-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
export SPRING_DATASOURCE_USERNAME=neondb_owner
export SPRING_DATASOURCE_PASSWORD=npg_zC7GDKo2JeUq

# Set Stripe Credentials
export STRIPE_SECRET_KEY=sk_test_51ScB6fHqvjNDXl7GRQgzrOcn56pIaGB2hHKCGsgDl9OtCzbah2HHaJvRzUhnSn0z4ZeWe3uR2d2IYG5jNiuJFQzT007wIt6KtW
export STRIPE_WEBHOOK_SECRET=whsec_3776fd7ebe8e1e6fd681768958a7012818d074866d7e79bb804b2a3f16838ff2

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to backend directory
cd "$SCRIPT_DIR"

# Stop any existing backend process
echo "🛑 Stopping any existing backend..."
pkill -9 -f "spring-boot:run" 2>/dev/null
lsof -ti:8080 | xargs kill -9 2>/dev/null
sleep 2

# Start backend
echo "✨ Starting backend with Neon database..."
mvn spring-boot:run -DskipTests

# Note: This runs in foreground. For background, add: > logs/backend.log 2>&1 &
