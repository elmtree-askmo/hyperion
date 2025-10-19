# Interactive Viewer - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites

- Node.js 18+ installed
- Backend server with lesson data
- Terminal/Command line access

### Step 1: Install Dependencies

```bash
cd interactive-viewer
npm install
```

### Step 2: Start Backend (if not already running)

In a separate terminal:

```bash
cd backend
npm run start:dev
```

Backend should start on `http://localhost:3000`

### Step 3: Start Interactive Viewer

```bash
# Still in interactive-viewer directory
npm run dev
```

Frontend will start on `http://localhost:3001` and open automatically in your browser.

### Step 4: Start Learning!

The viewer will load the default lesson (`henIVlCPVIY/lesson_1`).

---

## 📖 Basic Usage

### Video Mode (Default)

1. **Watch Video**:

   - Click play on the Remotion Player
   - Video plays with synchronized audio

2. **Vocabulary Auto-Pause**:

   - Video automatically pauses at vocabulary cards
   - Flashcard overlay appears
   - Click to flip card and see translation
   - Click "Continue" to resume

3. **Practice Auto-Pause**:

   - Video pauses after English phrases
   - Practice overlay shows the phrase
   - Click 🔊 to replay phrase
   - Click "Mark as Practiced" to continue

4. **Navigate Episodes**:

   - Use left sidebar to browse all episodes
   - Click any episode thumbnail to switch
   - Current episode highlighted

5. **Jump to Vocabulary**:
   - Use right sidebar to see all vocabulary
   - Click any word to jump to that point
   - ✓ indicates words you've reviewed

### Practice Mode

1. **Switch Mode**:
   - Click "✍️ Practice Mode" button at top
2. **Complete Questions**:
   - Read context and question
   - Type your answer
   - Click "Show Hint" if needed
3. **Submit & Validate**:

   - Click "Submit Answer"
   - Get bilingual AI feedback
   - Try again if incorrect

4. **Navigate Questions**:
   - Use navigation dots or buttons
   - Track progress as you complete

---

## 🔧 Configuration

### Change Lesson

Edit `interactive-viewer/src/store/lessonStore.ts`:

```typescript
// Line ~53
currentVideoId: "YOUR_VIDEO_ID",
currentLessonId: "YOUR_LESSON_ID",
```

### Change API URL

Set environment variable:

```bash
# .env or .env.local
VITE_API_URL=http://your-backend-url:3000
```

Or edit `interactive-viewer/src/components/LessonViewer.tsx`:

```typescript
// Line ~12
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://your-backend:3000";
```

---

## 🐛 Common Issues

### Issue: "Loading..." never finishes

**Cause**: Backend not running or lesson data not found

**Solution**:

```bash
# Check backend is running
curl http://localhost:3000/api/v1/video-transform/lessons/henIVlCPVIY/lesson_1

# Verify lesson files exist
ls backend/videos/henIVlCPVIY/lesson_1/
```

### Issue: Video not playing

**Cause**: Remotion composition error or missing data

**Solution**:

- Check browser console for errors
- Verify `final_synchronized_lesson.json` exists
- Check that audio files are in `lesson_segments/` directory

### Issue: Auto-pause not working

**Cause**: Already completed that item or incorrect data structure

**Solution**:

- Refresh page to reset progress
- Check segment has `vocabWord` (for vocabulary pause)
- Check segment has `textPartTimings` with `language: 'en'` (for practice pause)

### Issue: Port 3001 already in use

**Solution**:

```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in vite.config.ts
server: {
  port: 3002  // Or any available port
}
```

### Issue: CORS errors

**Cause**: Backend not configured for frontend origin

**Solution**:

- Check backend CORS settings allow `http://localhost:3001`
- Or use proxy configuration in `vite.config.ts`

---

## 📚 Next Steps

### Learn More

- Read [Complete Guide](./INTERACTIVE_VIEWER_GUIDE.md) for full documentation
- Explore [Practice Features](./INTERACTIVE_PRACTICE_FEATURE.md) for auto-pause details
- Check [API Documentation](./INTERACTIVE_VIEWER_GUIDE.md#api-integration) for backend integration

### Customize

- Modify theme colors in component CSS files
- Adjust auto-pause behavior in `LessonViewer.tsx`
- Add custom components as needed

### Deploy

```bash
# Build production version
npm run build

# Test production build locally
npm run preview

# Deploy dist/ directory to hosting service
```

---

## 🎯 Quick Reference

### Key Commands

```bash
# Development
npm run dev          # Start dev server (port 3001)

# Build
npm run build        # Build for production
npm run preview      # Preview production build

# Linting
npm run lint         # Check code quality
```

### Key Files

```
interactive-viewer/
├── src/
│   ├── App.tsx                        - Root component
│   ├── components/
│   │   └── LessonViewer.tsx           - Main viewer
│   ├── store/
│   │   └── lessonStore.ts             - State management
│   └── services/
│       └── lessonService.ts           - API calls
├── vite.config.ts                     - Vite configuration
└── package.json                       - Dependencies
```

### API Endpoints

```
GET  /api/v1/video-transform/lessons/:videoId/episodes
GET  /api/v1/video-transform/lessons/:videoId/:lessonId
POST /video-transform/validate-practice-answer
```

### Default Lesson Structure

```
backend/videos/henIVlCPVIY/lesson_1/
├── final_synchronized_lesson.json     - Main lesson data
├── flashcards.json                    - Vocabulary cards
├── audio_segments.json                - Audio metadata
└── lesson_segments/                   - Audio & image files
    ├── intro.wav
    ├── vocab1.wav
    ├── practice1.wav
    └── ...
```

---

## 💡 Tips

1. **Reset Progress**: Refresh page to clear session progress
2. **Debug Panel**: In dev mode, look for debug info panel (if enabled)
3. **Browser DevTools**: Open console (F12) to see detailed logs
4. **Network Tab**: Check API calls in browser Network tab
5. **React DevTools**: Install extension to inspect component state

---

## 🆘 Need Help?

### Documentation

- [Complete Guide](./INTERACTIVE_VIEWER_GUIDE.md)
- [Practice Features](./INTERACTIVE_PRACTICE_FEATURE.md)
- [Practice Validation](./PRACTICE_VALIDATION_FEATURE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

### Check Backend

```bash
# Backend health check
curl http://localhost:3000

# List available lessons
curl http://localhost:3000/api/v1/video-transform/lessons/henIVlCPVIY
```

### Common Error Messages

| Error              | Meaning                | Solution                          |
| ------------------ | ---------------------- | --------------------------------- |
| "Loading..." stuck | Backend not responding | Start backend server              |
| "No lesson data"   | Lesson files missing   | Check `backend/videos/` directory |
| CORS error         | Cross-origin blocked   | Configure backend CORS            |
| 404 on API call    | Endpoint not found     | Check API URL and endpoint path   |

---

## ✨ Features Checklist

After starting, you should be able to:

- [ ] See lesson title and episode information
- [ ] Play video with Remotion Player
- [ ] Navigate between episodes using left sidebar
- [ ] See vocabulary list in right sidebar
- [ ] Experience vocabulary auto-pause with flashcard overlay
- [ ] Experience practice auto-pause with practice overlay
- [ ] Use replay button to hear phrases again
- [ ] Switch to Practice Mode
- [ ] Complete questions and get AI validation
- [ ] Track progress (flashcards, practices, phrases)

If any of these don't work, refer to the troubleshooting section above.

---

**Ready to start?** Run `npm run dev` and enjoy your interactive learning experience! 🎉

**Last Updated**: October 19, 2025  
**Version**: 2.0
