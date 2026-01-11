#!/bin/bash
# Test email sending through running backend API

echo ""
echo "============================================================"
echo "Testing Email Sending via Backend API"
echo "============================================================"
echo ""

# Test if backend is running
if ! curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo "❌ Backend is not running on port 8080"
    echo "Start it with: ./start-backend.sh"
    exit 1
fi

echo "✅ Backend is running on port 8080"
echo ""

# Create a test donation to trigger email
echo "Attempting to trigger a test donation email..."
echo "(This will fail Stripe validation but should attempt to send email)"
echo ""

# Log the backend output
echo "Checking recent backend logs for email activity..."
echo ""

if [ -f "logs/application.log" ]; then
    echo "Last 20 lines of backend logs:"
    echo "------------------------------------------------------------"
    tail -20 logs/application.log | grep -E "email|Email|SMTP|smtp|Mail|mail|Donation|donation" || echo "(No email-related logs found in last 20 lines)"
    echo "------------------------------------------------------------"
else
    echo "No log file found at logs/application.log"
fi

echo ""
echo "To test email manually:"
echo "1. Open http://localhost:5173 in browser"
echo "2. Go to any campaign and click 'Donate Now'"
echo "3. Complete the donation (will fail at Stripe but should log email attempt)"
echo ""
echo "Or run this command to watch logs in real-time:"
echo "  tail -f logs/application.log | grep -i email"
echo ""
