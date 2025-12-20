#!/bin/bash

# Quick Start Script for Foundation Donation Backend
# This script helps you set up the development environment

echo "🏫 Foundation Donation Backend - Quick Start"
echo "============================================"
echo ""

# Check Java version
echo "Checking Java version..."
if command -v java &> /dev/null; then
    java_version=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
    if [ "$java_version" -ge 17 ]; then
        echo "✅ Java $java_version detected"
    else
        echo "❌ Java 17 or higher is required. Current version: $java_version"
        exit 1
    fi
else
    echo "❌ Java is not installed. Please install Java 17 or higher."
    exit 1
fi

# Check Maven
echo "Checking Maven..."
if command -v mvn &> /dev/null; then
    echo "✅ Maven detected"
else
    echo "❌ Maven is not installed. Please install Maven 3.6 or higher."
    exit 1
fi

# Check PostgreSQL
echo "Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL detected"
else
    echo "⚠️  PostgreSQL not found. Please ensure PostgreSQL is installed and running."
fi

echo ""
echo "📋 Setup Steps:"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "1. Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your actual values:"
    echo "   - STRIPE_SECRET_KEY"
    echo "   - STRIPE_WEBHOOK_SECRET"
    echo "   - Database credentials (if different)"
    echo ""
else
    echo "1. ✅ .env file already exists"
    echo ""
fi

# Ask if user wants to create database
read -p "2. Do you want to create the PostgreSQL database now? (y/n): " create_db

if [ "$create_db" = "y" ]; then
    echo ""
    echo "Creating database..."
    psql -U postgres <<EOF
CREATE DATABASE foundation_db;
CREATE USER foundation_user WITH PASSWORD 'foundation_pass';
GRANT ALL PRIVILEGES ON DATABASE foundation_db TO foundation_user;
EOF
    if [ $? -eq 0 ]; then
        echo "✅ Database created successfully"
    else
        echo "⚠️  Could not create database. You may need to run this manually:"
        echo "   psql -U postgres"
        echo "   CREATE DATABASE foundation_db;"
        echo "   CREATE USER foundation_user WITH PASSWORD 'foundation_pass';"
        echo "   GRANT ALL PRIVILEGES ON DATABASE foundation_db TO foundation_user;"
    fi
    echo ""
fi

# Build the project
read -p "3. Do you want to build the project now? (y/n): " build_project

if [ "$build_project" = "y" ]; then
    echo ""
    echo "Building project..."
    mvn clean install
    if [ $? -eq 0 ]; then
        echo "✅ Build successful"
    else
        echo "❌ Build failed. Please check the errors above."
        exit 1
    fi
    echo ""
fi

echo "🎉 Setup complete!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Update .env file with your Stripe API keys:"
echo "   - Get keys from: https://dashboard.stripe.com/test/apikeys"
echo ""
echo "2. Start the application:"
echo "   mvn spring-boot:run"
echo ""
echo "3. (Optional) Load sample data:"
echo "   psql -U foundation_user -d foundation_db -f sample-data.sql"
echo ""
echo "4. Test the API:"
echo "   curl http://localhost:8080/api/campaigns"
echo ""
echo "5. Set up Stripe webhooks:"
echo "   stripe listen --forward-to localhost:8080/api/donations/stripe/webhook"
echo ""
echo "📚 For more information, see README.md"
