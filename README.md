# Hyperion

An AI-powered educational video transformation platform that converts long-form English learning YouTube videos into engaging, bite-sized micro-lessons optimized for Thai college students.

## 🎯 Overview

Hyperion is a comprehensive video learning platform consisting of three main components:

1. **Backend API** - NestJS-based REST API for video processing and content analysis
2. **Interactive Viewer** - React-based web application for viewing and interacting with lessons
3. **Remotion Video Generator** - Remotion-based video rendering engine for creating educational content

## 🏗️ Project Structure

```
hyperion/
├── backend/              # NestJS backend API
│   ├── src/             # Source code
│   ├── scripts/         # Utility scripts
│   ├── videos/          # Generated video content
│   └── package.json
├── interactive-viewer/   # React frontend for lesson viewing
│   ├── src/             # Source code
│   └── package.json
├── remotion/            # Remotion video generation
│   ├── src/             # Video components
│   └── package.json
└── docs/                # Project documentation
```

## ✨ Key Features

### Backend

- 🤖 **AI-Powered Content Analysis** - Uses LangChain and LLMs (GPT-4, OpenRouter, Groq) to analyze and segment video content
- 📺 **YouTube Integration** - Extracts metadata and transcripts from YouTube videos
- 🎙️ **Text-to-Speech** - Mixed language (English/Thai) TTS with voice synthesis
- 🖼️ **AI Image Generation** - Creates contextual images using Gemini
- 📝 **Flashcard Generation** - Automatically generates vocabulary flashcards
- 🔐 **JWT Authentication** - Secure role-based access control
- 🗄️ **PostgreSQL Database** - TypeORM with schema support and migrations
- 🐳 **Docker Support** - Containerized deployment

### Interactive Viewer

- 🎬 **Episode Navigation** - Beautiful episode browser with thumbnails
- 🎥 **Video Mode** - Watch lessons with synchronized animations and audio
- 🃏 **Interactive Flashcards** - Click-to-reveal vocabulary cards with flip animations
- ✍️ **Practice Mode** - Complete comprehension questions and exercises
- 📊 **Progress Tracking** - Visual progress tracking for completed activities
- 📱 **Responsive Design** - Optimized for desktop and mobile

### Remotion Video Generator

- 📱 **9:16 Vertical Format** - Mobile-optimized video output
- 🎬 **Animated Components** - Title cards, vocabulary cards, grammar explanations
- 🔊 **Synchronized Audio** - Word-level timing with audio segments
- 🎨 **Customizable Themes** - Configurable colors, fonts, and animations
- ⚡ **Fast Rendering** - Efficient video generation pipeline

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+ (or Docker)
- npm or yarn
- FFmpeg (for video generation)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd hyperion
   ```

2. **Set up Backend**

   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration

   # Start PostgreSQL (using Docker)
   docker-compose up postgres -d

   # Run database migrations
   npm run migration:run

   # Start backend server
   npm run start:dev
   ```

3. **Set up Interactive Viewer**

   ```bash
   cd ../interactive-viewer
   npm install
   npm run dev
   ```

4. **Set up Remotion (optional)**
   ```bash
   cd ../remotion
   npm install
   ```

### Quick Scripts

The backend includes convenient scripts for common tasks:

```bash
cd backend

# Start both backend and interactive viewer
./scripts/start-interactive-viewer.sh

# View a specific lesson
./scripts/view-lesson.sh henIVlCPVIY lesson_1

# Test services
npm run test:llm
npm run test:tts
npm run test:flashcards
npm run test:video
```

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- [Database Setup](docs/DATABASE.md) - PostgreSQL configuration and migrations
- [Flashcards Guide](docs/FLASHCARDS_QUICKSTART.md) - Flashcard generation and usage
- [Mixed Language TTS](docs/MIXED_LANGUAGE_TTS.md) - Text-to-speech setup
- [Video Generation](docs/VIDEO_GENERATION_SUMMARY.md) - Video rendering workflow
- [Remotion Usage](docs/REMOTION_USAGE.md) - Remotion configuration and customization
- [Interactive Viewer Index](docs/INTERACTIVE_VIEWER_INDEX.md) - Frontend features
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

## 🔧 Configuration

### Backend Environment Variables

Key environment variables for the backend (see `backend/.env.example`):

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=hyperion
DB_SCHEMA=public

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1d

# LLM Provider (openai/openrouter/groq)
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your_api_key_here

# Optional services
GEMINI_API_KEY=your_gemini_api_key
```

### LLM Providers

The platform supports multiple LLM providers:

| Provider   | Value        | Best For                               |
| ---------- | ------------ | -------------------------------------- |
| OpenRouter | `openrouter` | Cost-effectiveness and model diversity |
| OpenAI     | `openai`     | Highest quality results                |
| Groq       | `groq`       | Speed and low-latency inference        |

## 🌐 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login

### Video Transform

- `POST /api/v1/video-transform/analyze` - Analyze YouTube video
- `POST /api/v1/video-transform/generate-microlesson` - Generate micro-lesson
- `POST /api/v1/video-transform/generate-video` - Generate video output
- `GET /api/v1/video-transform/lessons/:videoId` - List lessons
- `GET /api/v1/video-transform/lessons/:videoId/:lessonId` - Get lesson data

### Users

- `GET /api/v1/users/profile` - Get current user profile
- `PATCH /api/v1/users/:id` - Update user

## 🎨 Video Processing Pipeline

1. **Content Analysis** - YouTube video is analyzed using LangChain and LLMs
2. **Segmentation** - Content is divided into 5-minute micro-lessons
3. **Script Generation** - Lesson scripts are created with vocabulary and grammar points
4. **Flashcard Creation** - Vocabulary flashcards are automatically generated
5. **TTS Audio** - Text-to-speech audio is generated for all segments
6. **Image Generation** - Contextual images are created using AI
7. **Synchronization** - All assets are synchronized with precise timing
8. **Video Rendering** - Final video is rendered using Remotion

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:watch
npm run test:cov

# Test individual services
npm run test:llm
npm run test:tts
npm run test:flashcards
npm run test:gemini
npm run test:video
```

## 🐳 Docker Deployment

### Using Docker Compose

```bash
cd backend
docker-compose up --build
```

This will start:

- Backend API on port 3000
- PostgreSQL database on port 5432

### Manual Docker Build

```bash
cd backend
docker build -t hyperion-backend .
docker run -p 3000:3000 hyperion-backend
```

## 📊 Tech Stack

### Backend

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **LLM Integration**: LangChain (OpenAI, OpenRouter, Groq)
- **TTS**: Google Cloud TTS
- **Image Generation**: Google Gemini
- **Video Processing**: FFmpeg, Remotion

### Frontend

- **Framework**: React 18 with TypeScript
- **Video Player**: Remotion Player
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Build Tool**: Vite

### Video Generation

- **Engine**: Remotion
- **Format**: MP4 (H.264), 9:16 vertical
- **Quality**: 1080x1920px, 30 FPS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

- LangChain for LLM orchestration
- Remotion for video generation framework
- NestJS for backend framework
- React for frontend framework

## 📧 Support

For issues, questions, or contributions, please refer to the documentation in the `docs/` directory or contact the development team.

---

**Built with ❤️ for Thai college students learning English**
