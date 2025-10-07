# Remotion Video Generation System

This system generates educational micro-lesson videos using Remotion.dev with synchronized animations, typography, and audio.

## Features

- **9:16 Vertical Format**: Optimized for mobile viewing (1080x1920px)
- **30 FPS**: Smooth animations
- **H.264 Encoding**: Universal compatibility
- **Synchronized Audio**: Word-level timing with audio segments
- **Animated Components**:
  - Title cards with lesson information
  - Vocabulary flashcards with definitions and pronunciation
  - Grammar explanation cards
  - Practice exercises with word highlighting
  - Objective cards for learning goals
  - Outro cards with lesson summary

## Requirements

- Node.js 20+
- FFmpeg (installed automatically with `ffmpeg-static`)
- All lesson data files in the correct format

## Installation

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

## Usage

### 1. Preview Video (Development)

To preview the video in the browser with hot reload:

```bash
npm run remotion:preview
```

This will open a browser window where you can see the video composition.

### 2. Generate Video via API

Use the NestJS API endpoint to generate videos:

```bash
POST /video-transform/generate-video
{
  "lessonPath": "henIVlCPVIY/lesson_1",
  "outputFileName": "final_video.mp4"
}
```

### 3. Generate Video via Script

Run the test script to generate a video:

```bash
npm run test:video
```

### 4. Manual Rendering

To manually render a video:

```bash
cd remotion
npx remotion render Lesson output.mp4 --props props.json
```

## Project Structure

```
remotion/
├── src/
│   ├── components/
│   │   ├── TitleCard.tsx          # Title card component
│   │   ├── VocabularyCard.tsx     # Vocabulary flashcard
│   │   ├── GrammarCard.tsx        # Grammar explanation
│   │   ├── ObjectiveCard.tsx      # Learning objective
│   │   ├── PracticeCard.tsx       # Practice exercise
│   │   ├── OutroCard.tsx          # Lesson summary
│   │   └── LessonComposition.tsx  # Main composition
│   ├── styles/
│   │   └── theme.ts               # Theme and styling
│   ├── utils/
│   │   └── animation.ts           # Animation utilities
│   ├── Root.tsx                   # Remotion root
│   └── index.ts                   # Entry point
├── remotion.config.ts             # Remotion configuration
└── tsconfig.json                  # TypeScript config
```

## Input Data Format

The system expects the following JSON files in the lesson directory:

### 1. `final_synchronized_lesson.json`

Contains timing information for all segments:

```json
{
  "lesson": {
    "segmentBasedTiming": [
      {
        "startTime": 0,
        "endTime": 18.08,
        "duration": 18.08,
        "screenElement": "title_card",
        "audioUrl": "/videos/lesson_1/lesson_segments/intro.wav",
        "text": "...",
        "vocabWord": "optional"
      }
    ]
  }
}
```

### 2. `microlesson_script.json`

Contains lesson metadata and content:

```json
{
  "lesson": {
    "title": "Lesson Title",
    "titleTh": "ชื่อบทเรียน",
    "duration": 300,
    "learningObjectives": [...],
    "keyVocabulary": [...],
    "grammarPoints": [...]
  },
  "seriesInfo": {
    "episodeNumber": 1,
    "totalEpisodes": 3,
    ...
  }
}
```

### 3. `flashcards.json`

Vocabulary flashcard data:

```json
{
  "flashcards": [
    {
      "word": "recommend",
      "thaiTranslation": "แนะนำ",
      "pronunciation": "เรค-คอม-เมนด์",
      "definition": "...",
      "thaiDefinition": "...",
      "memoryHook": "...",
      "contextExample": "..."
    }
  ]
}
```

### 4. `audio_segments.json`

Audio segment metadata (optional):

```json
{
  "audioSegments": [
    {
      "id": "intro",
      "text": "...",
      "screenElement": "title_card",
      "visualDescription": "...",
      "backgroundImageDescription": "..."
    }
  ]
}
```

## Video Specifications

| Specification    | Value                | Rationale               |
| ---------------- | -------------------- | ----------------------- |
| Aspect Ratio     | 9:16 (1080x1920px)   | Mobile-optimized        |
| Duration         | 5 minutes (300s)     | Optimal attention span  |
| Frame Rate       | 30 FPS               | Smooth animations       |
| Format           | MP4 (H.264)          | Universal compatibility |
| Audio            | 44.1kHz, 128kbps AAC | High-quality audio      |
| File Size Target | < 50MB               | Fast mobile loading     |

## Content Structure

1. **Title Card** (5-10s): Lesson title and series context
2. **Objective Cards** (30-60s): Learning objectives
3. **Vocabulary Section** (60-90s): Key words with definitions
4. **Grammar Points** (30-60s): Grammar structures with examples
5. **Practice Exercises** (120-180s): Interactive practice with word highlighting
6. **Outro Card** (15-30s): Summary and next lesson preview

## Customization

### Theme

Edit `src/styles/theme.ts` to customize colors, fonts, and styling:

```typescript
export const theme = {
  colors: {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    // ...
  },
  fonts: {
    primary: 'Noto Sans Thai, Inter, sans-serif',
    // ...
  },
};
```

### Animations

Modify animation utilities in `src/utils/animation.ts`:

```typescript
export const useSlideIn = (delay = 0) => {
  // Custom animation logic
};
```

## Troubleshooting

### Issue: Audio not playing

- Ensure audio files exist at the specified paths
- Check audio format (WAV recommended)
- Verify file permissions

### Issue: Video generation fails

- Check that all required JSON files exist
- Validate JSON structure
- Check console logs for specific errors

### Issue: Slow rendering

- Reduce video duration
- Simplify animations
- Increase concurrency in `remotion.config.ts`:
  ```typescript
  Config.setConcurrency(2); // Increase for faster rendering
  ```

## Performance Tips

1. **Use static files**: Place audio/images in the `public` folder
2. **Optimize images**: Compress images before using
3. **Limit animation complexity**: Simpler animations render faster
4. **Use caching**: Remotion caches frames automatically

## API Integration

The video generation service integrates with the NestJS backend:

```typescript
// src/video-transform/services/remotion-video.service.ts
@Injectable()
export class RemotionVideoService {
  async generateVideo(lessonPath: string, outputPath: string) {
    // Generate video using Remotion CLI
  }
}
```

## Future Enhancements

- [ ] Real-time progress tracking
- [ ] Background image generation using AI
- [ ] Character animations for conversations
- [ ] Interactive quizzes within videos
- [ ] Multi-language support
- [ ] Cloud rendering with Remotion Lambda

## Resources

- [Remotion Documentation](https://www.remotion.dev/docs)
- [Remotion Examples](https://www.remotion.dev/showcase)
- [React Documentation](https://react.dev)

## License

MIT
