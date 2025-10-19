# Interactive Viewer Complete Guide

## 📚 Overview

The Interactive Viewer is a React-based web application that provides an engaging, interactive learning experience for Thai college students learning English. It combines Remotion video playback with interactive vocabulary cards and practice exercises.

**Key Features:**

- 🎥 Remotion Player-based video playback
- 📚 Automatic vocabulary pause overlays
- ✍️ Practice phrase auto-pause for pronunciation
- 📝 AI-powered answer validation
- 🎯 Progress tracking
- 📱 Episode navigation sidebar
- 🌐 Two learning modes

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Backend server running on port 3000
- Lesson data in `backend/videos/{videoId}/lesson_{number}/`

### Installation & Start

```bash
# 1. Install dependencies
cd interactive-viewer
npm install

# 2. Start development server
npm run dev

# 3. Open browser
http://localhost:3001
```

Or use the convenience script from project root:

```bash
./start-interactive-viewer.sh
```

## 🎮 Learning Modes

### 📺 Video Mode (Default)

Watch the lesson video with automatic interactive pauses.

**Features:**

- Remotion Player with full video controls
- **Vocabulary Auto-Pause**: Video automatically pauses at the end of each vocabulary card segment
  - Shows flashcard overlay with word details
  - Flip to see Thai translation
  - Auto-reveals flashcard
  - Click "Continue" to resume
- **Practice Auto-Pause**: Video pauses after English phrases in practice segments
  - Displays phrase for pronunciation practice
  - Replay button to hear phrase again
  - Mark as practiced to track progress
- **Episode Sidebar**: Left sidebar showing all episodes with thumbnails
- **Vocabulary Sidebar**: Right sidebar listing all vocabulary words
  - Click any word to jump to that point in video
  - Shows completion status

**User Flow:**

1. Video plays normally through content
2. At vocabulary card → Auto-pause → Flashcard overlay appears
3. Review word, flip card for translation
4. Click "Continue" → Video resumes
5. At practice phrase → Auto-pause → Practice overlay appears
6. Practice speaking, replay if needed
7. Mark as practiced → Video resumes

### ✍️ Practice Mode

Review all comprehension questions and test understanding.

**Features:**

- All practice questions listed vertically
- Text input for answers
- Hint system
- **AI Answer Validation**:
  - Submit answer to backend API
  - LLM evaluates semantic correctness
  - Bilingual feedback (Thai & English)
  - Try again if incorrect
- Progress tracking
- Navigation dots between questions

**User Flow:**

1. Read context and question
2. Type answer
3. View hint (optional)
4. Submit answer
5. Get AI validation feedback
6. Try again if incorrect or move to next question

## 🎨 Key Components

### LessonViewer Component

Main orchestrator component managing the entire learning experience.

**Location:** `interactive-viewer/src/components/LessonViewer.tsx`

**Responsibilities:**

- Remotion Player integration
- Mode switching (Video/Practice)
- Auto-pause detection for vocabulary and practice
- Overlay management
- Episode navigation
- Progress tracking

### InteractiveFlashcard Component

Flashcard component with flip animation and expandable details.

**Location:** `interactive-viewer/src/components/InteractiveFlashcard.tsx`

**Features:**

- Locked/unlocked states
- Click to reveal word
- Flip to show translation
- Expandable details panel with:
  - Definition
  - Thai definition
  - Memory hook
  - Context example

### PracticePauseOverlay Component

Overlay shown when video pauses for pronunciation practice.

**Location:** `interactive-viewer/src/components/PracticePauseOverlay.tsx`

**Features:**

- Phrase display
- Replay button (with speaker icon)
- Practice instructions
- Mark as practiced button
- Recording placeholder (future feature)

### InteractivePractice Component

Practice question component with AI validation.

**Location:** `interactive-viewer/src/components/InteractivePractice.tsx`

**Features:**

- Context and situation display
- Question text
- Text area for answer
- Hint toggle
- Submit answer with API call
- Validation feedback display
- Try again functionality

## 🗂️ State Management (Zustand)

**Store:** `interactive-viewer/src/store/lessonStore.ts`

### Key State Properties

```typescript
{
  lessonData: LessonData | null;
  currentVideoId: string;
  currentLessonId: string;
  isPlaying: boolean;
  videoEnded: boolean;

  // Auto-pause states
  isPracticePaused: boolean;
  currentPracticePhrase: string | null;
  isVocabularyPaused: boolean;
  currentVocabularyWord: string | null;

  // Progress tracking
  userProgress: {
    completedFlashcards: string[];
    completedPractices: string[];
    practicedPhrases: string[];
    reviewedVocabulary: string[];
    quizAnswers: Record<string, string>;
  };
}
```

### Key Actions

- `setLessonData()` - Load lesson and create interactive segments
- `completePracticePhrase()` - Mark phrase as practiced
- `markVocabularyReviewed()` - Mark vocabulary as reviewed
- `revealFlashcard()` - Mark flashcard as revealed
- `completePractice()` - Mark practice question as completed
- `resetProgress()` - Clear all progress

## 🔄 Auto-Pause System

### Vocabulary Auto-Pause

**When:** At the end of each `vocabulary_card` segment

**Detection Logic:**

```typescript
// Check every 100ms
if (
  currentTime >= vocabSegment.endTime - 0.05 &&
  !userProgress.reviewedVocabulary.includes(word)
) {
  // Pause video
  // Show vocabulary overlay with flashcard
  // Auto-reveal flashcard
}
```

**Cooldown:** 1.5 seconds to prevent immediate re-trigger

**Skip Condition:** User just clicked vocabulary sidebar (3-second skip window)

### Practice Auto-Pause

**When:** At the end of each English phrase in `practice_card` segments

**Detection Logic:**

```typescript
// For each practice_card segment
for (textPartTiming of segment.textPartTimings) {
  if (
    timing.language === "en" &&
    currentTime >= timing.endTime - 0.05 &&
    !userProgress.practicedPhrases.includes(timing.text)
  ) {
    // Pause video
    // Show practice overlay
  }
}
```

**Cooldown:** 0.5 seconds per phrase to prevent re-trigger

**Replay:** Allows user to seek back and replay phrase

## 🌐 API Integration

### Backend Endpoints

**Base URL:** `http://localhost:3000`

#### Get Episodes Metadata

```
GET /api/v1/video-transform/lessons/:videoId/episodes

Response:
{
  episodes: [
    {
      episodeNumber: 1,
      title: "Episode 1 Title",
      titleTh: "ชื่อบทที่ 1",
      thumbnail: "/videos/.../thumbnail.png",
      duration: 300
    },
    ...
  ]
}
```

#### Get Lesson Data

```
GET /api/v1/video-transform/lessons/:videoId/:lessonId

Response: {
  lesson: {...},
  flashcards: [...],
  audioSegments: [...]
}
```

#### Validate Practice Answer

```
POST /video-transform/validate-practice-answer

Request:
{
  context: "string",
  question: "string",
  expectedAnswer: "string",
  userAnswer: "string"
}

Response:
{
  isCorrect: true,
  feedbackTh: "ยอดเยี่ยม!...",
  feedbackEn: "Excellent!...",
  evaluation: "..."
}
```

## 📊 Data Structure

### Lesson Data

Required files in `videos/{videoId}/lesson_{number}/`:

1. **final_synchronized_lesson.json** - Main lesson structure

   ```json
   {
     "lesson": {
       "title": "English title",
       "titleTh": "ชื่อภาษาไทย",
       "episodeNumber": 1,
       "totalEpisodes": 3,
       "segmentBasedTiming": [
         {
           "startTime": 0,
           "endTime": 10,
           "screenElement": "vocabulary_card",
           "vocabWord": "recommend",
           "textPartTimings": [...]
         }
       ],
       "comprehensionQuestions": [...]
     }
   }
   ```

2. **flashcards.json** - Vocabulary flashcards

   ```json
   {
     "flashcards": [
       {
         "word": "recommend",
         "pronunciation": "เรค-คอม-เมนด์",
         "phonetic": "/ˌrekəˈmend/",
         "thaiTranslation": "แนะนำ",
         "thaiDefinition": "...",
         "memoryHook": "...",
         "contextExample": "..."
       }
     ]
   }
   ```

3. **audio_segments.json** - Audio metadata
4. **lesson_segments/** - Individual audio/image files

## 🎯 Progress Tracking

### What is Tracked

- **Flashcards Revealed**: Words unlocked and viewed
- **Practices Completed**: Questions answered
- **Phrases Practiced**: Practice phrases marked as practiced
- **Vocabulary Reviewed**: Vocabulary overlays acknowledged

### Storage

Currently stored in Zustand store (session-based, resets on page reload).

**Future Enhancement**: Persist to localStorage or backend API.

## 🎨 Styling & Theme

### CSS Architecture

```
interactive-viewer/src/
├── App.css                         - Global app styles
├── styles/global.css              - CSS variables and resets
└── components/
    ├── LessonViewer.css           - Main viewer layout
    ├── InteractiveFlashcard.css   - Flashcard styles
    ├── InteractivePractice.css    - Practice question styles
    └── PracticePauseOverlay.css   - Overlay styles
```

### Design System

**Colors:**

- Primary: Purple gradient (#667eea → #764ba2)
- Success: Green gradient (#10b981 → #059669)
- Error: Red gradient (#ef4444 → #dc2626)
- Background: Dark blue (#0f172a, #1e293b)

**Typography:**

- English: 'Inter', system fonts
- Thai: 'Noto Sans Thai', system fonts

**Responsive Breakpoints:**

- Desktop: > 1024px
- Tablet: 768px - 1024px
- Mobile: < 768px

## 🚀 Performance

### Optimization Strategies

1. **Memoization**: Player inputProps memoized with useMemo
2. **Debouncing**: Auto-pause checks every 100ms (not every frame)
3. **Ref-based tracking**: Vocabulary click tracking with useRef
4. **Conditional rendering**: Overlays only rendered when active

### Bundle Size

- Initial load: ~2-3 MB (includes Remotion Player)
- Each lesson data: ~100-500 KB

## 🐛 Troubleshooting

### Video Not Pausing for Vocabulary

**Causes:**

- Word already reviewed
- User just clicked vocabulary sidebar
- Timing offset incorrect

**Solutions:**

- Check `userProgress.reviewedVocabulary` in React DevTools
- Clear progress: refresh page
- Verify `vocabWord` field in segment data

### Practice Overlay Not Showing

**Causes:**

- Phrase already practiced
- Not in `practice_card` segment
- Language not marked as 'en'

**Solutions:**

- Check `userProgress.practicedPhrases`
- Verify `screenElement === 'practice_card'`
- Check `textPartTimings[].language === 'en'`

### Episodes Not Loading

**Causes:**

- Backend not running
- API endpoint not found
- CORS issues

**Solutions:**

- Verify backend running on port 3000
- Check endpoint: `/api/v1/video-transform/lessons/{videoId}/episodes`
- Check browser console for network errors

### Answer Validation Failing

**Causes:**

- LLM API key not configured
- Network timeout
- Rate limit exceeded

**Solutions:**

- Check backend `.env` for LLM_PROVIDER and API keys
- Increase timeout in service configuration
- Wait and retry if rate limited

## 📈 Future Enhancements

### Planned Features

1. **Voice Recording**

   - Web Audio API integration
   - Record and compare pronunciation
   - Download recordings

2. **Progress Persistence**

   - LocalStorage for offline persistence
   - Backend API for cross-device sync
   - Analytics dashboard

3. **Spaced Repetition**

   - SRS algorithm for flashcards
   - Adaptive review scheduling
   - Performance-based recommendations

4. **Social Features**

   - Share progress with friends
   - Leaderboards
   - Study groups

5. **Mobile App**
   - React Native version
   - Offline mode
   - Push notifications for reminders

## 📝 Development

### Project Structure

```
interactive-viewer/
├── src/
│   ├── components/
│   │   ├── LessonViewer.tsx          - Main viewer
│   │   ├── InteractiveFlashcard.tsx  - Flashcard component
│   │   ├── InteractivePractice.tsx   - Practice component
│   │   ├── PracticePauseOverlay.tsx  - Practice overlay
│   │   └── *.css                     - Component styles
│   ├── store/
│   │   └── lessonStore.ts            - Zustand state management
│   ├── services/
│   │   └── lessonService.ts          - API calls
│   ├── types/
│   │   └── lesson.ts                 - TypeScript types
│   ├── remotion/                     - Remotion components
│   │   └── components/
│   │       └── LessonComposition.tsx
│   ├── App.tsx                       - Root component
│   └── main.tsx                      - Entry point
├── public/                           - Static assets
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Adding New Features

1. **New Component:**

   - Create component in `src/components/`
   - Add corresponding CSS file
   - Import in LessonViewer or App

2. **New State:**

   - Add properties to LessonState interface
   - Add actions in lessonStore
   - Update components to use new state

3. **New API Endpoint:**
   - Add function in lessonService.ts
   - Call from component
   - Handle loading/error states

## 🧪 Testing

### Manual Testing Checklist

- [ ] Video playback starts/stops correctly
- [ ] Vocabulary overlay appears at correct times
- [ ] Flashcards flip and reveal properly
- [ ] Practice overlay appears after English phrases
- [ ] Replay button works for practice phrases
- [ ] Episode navigation switches lessons
- [ ] Vocabulary sidebar navigation jumps correctly
- [ ] Practice mode shows all questions
- [ ] Answer validation returns feedback
- [ ] Progress tracking updates correctly
- [ ] Mode switching works smoothly
- [ ] Responsive layout on mobile/tablet

### Browser Compatibility

Tested on:

- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

## 📚 Related Documentation

- [Backend API Documentation](../backend/README.backend.md)
- [Remotion Usage Guide](./REMOTION_USAGE.md)
- [Database Schema](./DATABASE.md)
- [TTS System](./MIXED_LANGUAGE_TTS.md)
- [Video Generation](./VIDEO_GENERATION_SUMMARY.md)

## 🤝 Contributing

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use functional components with hooks
- Prefer const over let
- Use descriptive variable names
- Add comments for complex logic

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

## 📄 License

Part of the Hyperion project. See root LICENSE file for details.

---

**Last Updated:** October 19, 2025  
**Version:** 2.0  
**Status:** ✅ Production Ready
