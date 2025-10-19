# Hyperion Documentation

> 📖 Complete documentation for the Hyperion video learning platform

## 🚀 Start Here

| If you want to...         | Read this                                                               |
| ------------------------- | ----------------------------------------------------------------------- |
| **Get started quickly**   | [Interactive Viewer Quick Start](./INTERACTIVE_VIEWER_QUICKSTART.md) ⭐ |
| **Understand the system** | [Interactive Viewer Guide](./INTERACTIVE_VIEWER_GUIDE.md)               |
| **Fix problems**          | [Troubleshooting Guide](./TROUBLESHOOTING.md)                           |

## 📚 Documentation by Topic

### Interactive Viewer (Frontend)

- **[Complete Guide](./INTERACTIVE_VIEWER_GUIDE.md)** - Everything about the interactive viewer
- [Quick Start](./INTERACTIVE_VIEWER_QUICKSTART.md) - 5-minute setup
- [Practice Features](./INTERACTIVE_PRACTICE_FEATURE.md) - Auto-pause and AI validation
- [Practice Validation](./PRACTICE_VALIDATION_FEATURE.md) - AI answer checking

### Video Processing (Backend)

- [Video Generation Pipeline](./VIDEO_GENERATION_SUMMARY.md) - How videos are created
- [Flashcards System](./FLASHCARDS_IMPLEMENTATION.md) - Vocabulary generation
- [Mixed Language TTS](./MIXED_LANGUAGE_TTS.md) - Text-to-speech

### Technical Setup

- [Database Setup](./DATABASE.md) - PostgreSQL configuration
- [Remotion Usage](./REMOTION_USAGE.md) - Video composition
- [Storage Configuration](./STORAGE_CONFIGURATION.md) - File storage options

### Deployment & Operations

- [Vercel Deployment](./VERCEL_DEPLOYMENT.md) - Production deployment
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues
- [Video Generation Status](./VIDEO_GENERATION_STATUS.md) - Job tracking

## 🎯 Common Tasks

| Task                 | Documentation                                     |
| -------------------- | ------------------------------------------------- |
| Run the viewer       | [Quick Start](./INTERACTIVE_VIEWER_QUICKSTART.md) |
| Deploy to production | [Vercel Deployment](./VERCEL_DEPLOYMENT.md)       |
| Generate videos      | [Video Generation](./VIDEO_GENERATION_SUMMARY.md) |
| Fix issues           | [Troubleshooting](./TROUBLESHOOTING.md)           |

## 📂 Project Structure

```
hyperion/
├── backend/              # NestJS backend API
│   ├── src/
│   │   ├── video-transform/    - Video processing pipeline
│   │   ├── auth/               - Authentication
│   │   └── users/              - User management
│   └── scripts/                - Utility scripts
│
├── interactive-viewer/   # React frontend
│   ├── src/
│   │   ├── components/         - UI components
│   │   ├── store/              - State management (Zustand)
│   │   ├── services/           - API calls
│   │   └── remotion/           - Remotion components for Player
│   └── dist/                   - Production build
│
├── remotion/             # Remotion video generation
│   └── src/
│       ├── components/         - Video components (cards, animations)
│       └── styles/             - Theme and styling
│
└── docs/                 # Documentation (you are here)
    ├── README.md               - This file
    ├── INTERACTIVE_VIEWER_GUIDE.md
    ├── INTERACTIVE_PRACTICE_FEATURE.md
    └── ...
```

## 🔑 Key Concepts

### System Architecture

1. **Backend (NestJS)**:

   - Processes YouTube videos
   - Generates micro-lessons with LLM
   - Creates flashcards and practice questions
   - Provides REST API

2. **Interactive Viewer (React)**:

   - Displays lessons with Remotion Player
   - Auto-pause for vocabulary and practice
   - AI-powered answer validation
   - Progress tracking

3. **Remotion**:
   - Video composition and rendering
   - Animated cards and transitions
   - Audio synchronization

### Data Flow

```
YouTube Video
    ↓
Backend Pipeline:
    → Transcript extraction
    → Content analysis (LLM)
    → Micro-lesson generation
    → Flashcard generation
    → TTS audio generation
    → Synchronization
    ↓
JSON Files + Audio/Images
    ↓
Interactive Viewer:
    → Remotion Player
    → Auto-pause overlays
    → AI validation
```

## 🛠️ Technology Stack

### Backend

- **NestJS** - Node.js framework
- **TypeORM** - Database ORM
- **PostgreSQL** - Database
- **LangChain** - LLM integration
- **Google Cloud TTS** - Text-to-speech

### Frontend

- **React 18** - UI library
- **TypeScript** - Type safety
- **Remotion Player** - Video playback
- **Zustand** - State management
- **Framer Motion** - Animations
- **Vite** - Build tool

### Video Generation

- **Remotion** - Video composition
- **FFmpeg** - Video encoding

## 📊 Current Status (October 2025)

### ✅ Implemented Features

- [x] YouTube video to micro-lessons pipeline
- [x] Interactive viewer with Remotion Player
- [x] Vocabulary auto-pause overlay
- [x] Practice auto-pause with replay
- [x] AI-powered answer validation
- [x] Flashcard generation
- [x] Thai-English mixed TTS
- [x] Episode navigation
- [x] Progress tracking
- [x] Mobile-optimized 9:16 video format

### 🚧 In Development

- [ ] Voice recording for practice
- [ ] Speech recognition for pronunciation
- [ ] Progress persistence (localStorage/backend)
- [ ] Spaced repetition algorithm
- [ ] Mobile app (React Native)

## 📝 Contributing

When updating documentation:

1. **Keep it current**: Update docs when features change
2. **Be specific**: Include code examples and screenshots
3. **Cross-reference**: Link to related documents
4. **Test examples**: Verify all code examples work
5. **Update this index**: Add new docs to the tables above

## 🔄 Documentation Changelog

### v2.0 (October 19, 2025)

- ✨ Created comprehensive Interactive Viewer Guide
- ✨ Added Interactive Viewer Quick Start
- ✨ Updated Interactive Practice Feature documentation
- ✨ Added new Documentation Index (this file)
- 🗑️ Removed outdated Flashcard Mode docs (feature removed)
- 🗑️ Removed duplicate quick start guides
- 🗑️ Consolidated implementation summaries

### v1.0 (October 2025)

- Initial documentation set
- Feature-specific guides
- Setup and troubleshooting docs

## 📞 Need Help?

1. **Check the docs** - Most questions are answered here
2. **Troubleshooting** - See [Troubleshooting Guide](./TROUBLESHOOTING.md)
3. **Code examples** - Look in component files for real implementations
4. **Ask the team** - Reach out if you're stuck

---

**Last Updated**: October 19, 2025  
**Version**: 2.0  
**Maintained by**: Hyperion Development Team
