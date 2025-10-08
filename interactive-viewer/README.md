# Interactive Lesson Viewer

An interactive web application for viewing and interacting with language learning lessons. Built with React, Remotion Player, and Framer Motion.

## Features

### 🎥 Video Mode

- Watch lessons with synchronized animations and audio
- **Interactive Flashcards**: Click to reveal vocabulary cards with:
  - Word pronunciation and phonetic spelling
  - Thai translation and definition
  - Memory hooks and context examples
  - Flip animation to see front/back
  - Expandable details panel
- **Auto-pause**: Video automatically pauses when reaching interactive segments
- **Sidebar Navigation**: Quick jump to any vocabulary word in the lesson
- **Progress Tracking**: See which flashcards you've already revealed

### ✍️ Practice Mode

- Complete comprehension questions and exercises
- **Interactive Practice Cards**:
  - Read context and situation
  - Type your answer in a text area
  - View hints and expected answers
  - See model answers after submission
- **Vocabulary Review**: Access all flashcards in an interactive gallery
- Track completed practices

### 📊 Progress Tracking

- Visual progress bar showing completion
- Flashcards completed counter
- Practices completed counter
- Persistent progress during session

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Remotion Player** - Video playback with React compositions
- **Framer Motion** - Smooth animations
- **Zustand** - State management
- **Vite** - Build tool and dev server

## Getting Started

### Installation

```bash
cd interactive-viewer
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3001`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Architecture

### Directory Structure

```
interactive-viewer/
├── src/
│   ├── components/         # React components
│   │   ├── InteractiveFlashcard.tsx   # Flashcard with flip animation
│   │   ├── InteractivePractice.tsx    # Practice exercise component
│   │   └── LessonViewer.tsx           # Main viewer with player
│   ├── store/             # Zustand state management
│   │   └── lessonStore.ts
│   ├── services/          # API and data services
│   │   └── lessonService.ts
│   ├── types/             # TypeScript type definitions
│   │   └── lesson.ts
│   ├── styles/            # Global styles
│   │   └── global.css
│   ├── App.tsx            # Root component
│   └── main.tsx           # Entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

### State Management

The app uses Zustand for state management with the following key state:

- `lessonData`: Current lesson content
- `currentTime`: Video playback time
- `isPlaying`: Video playback state
- `interactiveSegments`: List of interactive elements with timing
- `activeSegment`: Current interactive segment at playback time
- `userProgress`: Tracking of completed flashcards and practices

### Data Loading

The app loads lesson data from two sources:

1. **API Endpoint** (preferred): `/api/video-transform/lessons/:videoId/:lessonId`
2. **Static Files** (fallback): `/videos/:videoId/:lessonId/` directory

Required files:

- `microlesson_script.json` - Lesson structure and content
- `flashcards.json` - Vocabulary flashcards
- `audio_segments.json` - Audio timing information
- `final_synchronized_lesson.json` - Synchronized timing data

## Usage

### Video Mode

1. Click the "📺 Video Mode" button
2. Watch the lesson video
3. When a vocabulary word appears, the video auto-pauses
4. Click on the flashcard to reveal the translation
5. Click "Show More Details" to see memory hooks and examples
6. Click "Continue Lesson" to resume the video
7. Use the sidebar to jump to specific vocabulary words

### Practice Mode

1. Click the "✍️ Practice Mode" button
2. Read the context and question
3. Type your answer in the text area
4. Click "💡 Show Hint" if you need help
5. Click "Submit Answer" when ready
6. Review the model answer
7. Scroll down to review all vocabulary flashcards

### Keyboard Shortcuts

- **Space**: Play/Pause video
- **Double-click**: Enter fullscreen
- **Ctrl+Enter**: Submit practice answer

## Customization

### Styling

Colors and themes can be customized in:

- `src/styles/global.css` - Global styles
- `src/components/*.css` - Component-specific styles

### Animations

Animation timings can be adjusted in:

- `src/components/InteractiveFlashcard.tsx` - Flashcard flip duration
- `src/components/InteractivePractice.tsx` - Practice reveal animations
- `src/components/LessonViewer.tsx` - Overlay transitions

## Integration with Backend

### API Endpoints

The app expects the following API endpoints:

#### Get Lesson Data

```
GET /api/video-transform/lessons/:videoId/:lessonId
```

Response:

```json
{
  "microlessonScript": { ... },
  "flashcards": [ ... ],
  "audioSegments": [ ... ],
  "finalSynchronizedLesson": { ... }
}
```

#### List Available Lessons

```
GET /api/video-transform/lessons/:videoId
```

Response:

```json
{
  "lessons": ["lesson_1", "lesson_2", "lesson_3"]
}
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

Proprietary
