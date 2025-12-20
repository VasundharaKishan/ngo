#!/bin/bash

echo "🚀 Starting NGO Foundation Platform..."

# Kill any existing processes
echo "🛑 Stopping any existing processes..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
lsof -ti:5174 | xargs kill -9 2>/dev/null || true

# Start backend
echo ""
echo "🔨 Starting Backend (Port 8080)..."
cd foundation-backend
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export PATH=$JAVA_HOME/bin:$PATH
/opt/homebrew/bin/mvn spring-boot:run -DskipTests > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:8080/api/campaigns > /dev/null 2>&1; then
        echo "✅ Backend started successfully!"
        break
    fi
    echo -n "."
    sleep 2
done

# Start frontend
echo ""
echo "🎨 Starting Frontend (Port 5173)..."
cd ../foundation-frontend
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ Platform started!"
echo ""
echo "📍 URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8080"
echo ""
echo "📋 Logs:"
echo "   Backend:  tail -f foundation-backend/backend.log"
echo "   Frontend: tail -f foundation-frontend/frontend.log"
echo ""
echo "🛑 To stop all services:"
echo "   lsof -ti:8080 | xargs kill -9"
echo "   lsof -ti:5173 | xargs kill -9"
