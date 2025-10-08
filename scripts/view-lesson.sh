#!/bin/bash

# Quick script to view a specific lesson
# Usage: ./view-lesson.sh [videoId] [lessonId]
# Example: ./view-lesson.sh henIVlCPVIY lesson_1

VIDEO_ID="${1:-henIVlCPVIY}"
LESSON_ID="${2:-lesson_1}"

echo "🎬 Interactive Lesson Viewer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📺 Video ID: $VIDEO_ID"
echo "📚 Lesson: $LESSON_ID"
echo ""

# Check if lesson exists
LESSON_PATH="videos/$VIDEO_ID/$LESSON_ID"
if [ ! -d "$LESSON_PATH" ]; then
    echo "❌ Error: Lesson not found at $LESSON_PATH"
    echo ""
    echo "Available videos:"
    ls -d videos/*/ 2>/dev/null | xargs -n 1 basename | sed 's/^/  • /'
    echo ""
    exit 1
fi

# Check required files
echo "✅ Checking lesson files..."
MISSING_FILES=0

for file in "microlesson_script.json" "flashcards.json" "audio_segments.json"; do
    if [ -f "$LESSON_PATH/$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (missing)"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ -f "$LESSON_PATH/final_synchronized_lesson.json" ]; then
    echo "  ✓ final_synchronized_lesson.json"
else
    echo "  ⚠ final_synchronized_lesson.json (optional, but recommended)"
fi

echo ""

if [ $MISSING_FILES -gt 0 ]; then
    echo "❌ Error: Missing required files!"
    echo "Please generate the lesson data first."
    exit 1
fi

# Update App.tsx to load the specified lesson
echo "📝 Configuring viewer to load $VIDEO_ID/$LESSON_ID..."

APP_FILE="interactive-viewer/src/App.tsx"
if [ -f "$APP_FILE" ]; then
    # Backup original
    cp "$APP_FILE" "$APP_FILE.backup"
    
    # Update the lesson loading line
    sed -i.tmp "s/loadLessonData('[^']*', '[^']*')/loadLessonData('$VIDEO_ID', '$LESSON_ID')/" "$APP_FILE"
    rm "$APP_FILE.tmp" 2>/dev/null
    
    echo "  ✓ Updated $APP_FILE"
else
    echo "  ⚠ Warning: $APP_FILE not found"
fi

echo ""
echo "🚀 Starting servers..."
echo ""

# Check if backend is running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✓ Backend already running on port 3000"
else
    echo "⚡ Starting backend..."
    npm run start:dev > backend.log 2>&1 &
    BACKEND_PID=$!
    echo "  Backend PID: $BACKEND_PID"
    sleep 3
fi

# Check if frontend is running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "✓ Frontend already running on port 3001"
else
    # Install dependencies if needed
    if [ ! -d "interactive-viewer/node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        cd interactive-viewer
        npm install
        cd ..
    fi
    
    echo "⚡ Starting frontend..."
    cd interactive-viewer
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "  Frontend PID: $FRONTEND_PID"
    cd ..
    sleep 2
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Ready!"
echo ""
echo "🌐 Open in browser:"
echo "   👉 http://localhost:3001"
echo ""
echo "📊 API endpoints:"
echo "   • http://localhost:3000/api/video-transform/lessons/$VIDEO_ID"
echo "   • http://localhost:3000/api/video-transform/lessons/$VIDEO_ID/$LESSON_ID"
echo ""
echo "📋 Logs:"
echo "   • Backend:  tail -f backend.log"
echo "   • Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop:"
echo "   • Press Ctrl+C"
if [ ! -z "$BACKEND_PID" ]; then
    echo "   • Or run: kill $BACKEND_PID $FRONTEND_PID"
fi
echo ""

# Open browser (Mac)
if command -v open &> /dev/null; then
    sleep 2
    open http://localhost:3001
fi

# Wait for user
wait

