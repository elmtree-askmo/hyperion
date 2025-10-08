#!/bin/bash

# Start Interactive Lesson Viewer
# This script starts both backend and frontend servers

echo "🚀 Starting Interactive Lesson Viewer..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

if [ ! -d "interactive-viewer/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd interactive-viewer
    npm install
    cd ..
fi

# Check if backend is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Backend is already running on port 3000"
else
    echo "🔧 Starting backend server on port 3000..."
    npm run start:dev > backend.log 2>&1 &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    sleep 3
fi

# Check if frontend is already running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Frontend is already running on port 3001"
else
    echo "🎨 Starting frontend server on port 3001..."
    cd interactive-viewer
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
    cd ..
fi

echo ""
echo "✅ Servers started!"
echo ""
echo "📝 Access the application at:"
echo "   Frontend: http://localhost:3001"
echo "   Backend:  http://localhost:3000"
echo ""
echo "📋 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop the servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   or press Ctrl+C"
echo ""

# Open browser (optional)
if command -v open &> /dev/null
then
    echo "🌐 Opening browser..."
    sleep 2
    open http://localhost:3001
elif command -v xdg-open &> /dev/null
then
    echo "🌐 Opening browser..."
    sleep 2
    xdg-open http://localhost:3001
fi

# Wait for user to stop
echo "Press Ctrl+C to stop all servers..."
wait

