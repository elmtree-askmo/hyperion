# Video Transform Module

This module transforms long-form English learning YouTube videos into series of short-form (5-minute) educational content optimized for Thai college students.

## Features

- 🎥 **YouTube Video Processing**: Extract metadata and transcripts from YouTube videos
- ✂️ **Smart Segmentation**: Break long videos into logical 5-minute segments
- 🇹🇭 **Thai Optimization**: Content specifically optimized for Thai college students
- 📚 **Educational Enhancements**:
  - Thai translations of key concepts
  - Vocabulary extraction with phonetic guides
  - Comprehension questions
  - Cultural context adaptation
  - Pronunciation guides
- 📊 **Progress Tracking**: Job status tracking and segment management
- 🔐 **Secure**: JWT authentication required for all operations

## API Endpoints

### Create Video Job

```
POST /api/v1/video-transform
```

Create a new video transformation job from a YouTube URL.

**Request Body:**

```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "title": "English Grammar Basics - Part 1",
  "description": "Transform this English grammar tutorial into digestible segments",
  "targetSegmentDuration": 300,
  "targetAudience": "thai_college_students",
  "preferences": {
    "focusOnGrammar": true,
    "includeVocabularyHighlights": true,
    "difficultyLevel": "intermediate",
    "generateQuizzes": true
  }
}
```

### Get All Video Jobs

```
GET /api/v1/video-transform?status=completed&limit=10
```

Retrieve all video transformation jobs for the current user.

### Get Specific Video Job

```
GET /api/v1/video-transform/:id
```

Get details of a specific video transformation job.

### Start Video Processing

```
POST /api/v1/video-transform/:id/start
```

Start processing a pending video transformation job.

### Get Video Segments

```
GET /api/v1/video-transform/:id/segments
```

Retrieve generated segments for a completed video job.

## Video Segment Output Structure

Each processed video generates segments with the following structure:

```json
{
  "segmentNumber": 1,
  "startTime": 0,
  "endTime": 300,
  "title": "Introduction to English Grammar",
  "content": "Video transcript content...",
  "keyTopics": ["Grammar basics", "Sentence structure"],
  "difficulty": "intermediate",
  "estimatedComprehensionTime": 360,
  "thaiTranslations": {
    "title": "การแนะนำไวยากรณ์อังกฤษ",
    "keyTopics": ["พื้นฐานไวยากรณ์", "โครงสร้างประโยค"],
    "summary": "สรุปเนื้อหาบทเรียน"
  },
  "vocabulary": [
    {
      "word": "grammar",
      "definition": "The rules of a language",
      "thaiTranslation": "ไวยากรณ์",
      "difficulty": "intermediate",
      "partOfSpeech": "noun",
      "exampleSentence": "English grammar can be challenging.",
      "phonetic": "/ˈɡræmər/"
    }
  ],
  "comprehensionQuestions": [
    {
      "question": "What is the main topic of this segment?",
      "thaiTranslation": "หัวข้อหลักของส่วนนี้คืออะไร?",
      "type": "multiple-choice",
      "options": ["Grammar", "Vocabulary", "Pronunciation", "Culture"],
      "correctAnswer": "Grammar",
      "explanation": "The segment focuses on grammar basics.",
      "thaiExplanation": "ส่วนนี้เน้นพื้นฐานไวยากรณ์"
    }
  ],
  "culturalContext": "Grammar concepts adapted for Thai learners...",
  "learningObjectives": [
    "Understand basic grammar rules",
    "Improve sentence construction",
    "Practice pronunciation"
  ],
  "pronunciationGuide": [
    {
      "word": "grammar",
      "phonetic": "/ˈɡræmər/",
      "audioTips": "Stress on the first syllable",
      "commonMistakes": ["Pronouncing the second 'a'"]
    }
  ]
}
```

## Job Status Flow

1. **PENDING** - Job created, waiting to be started
2. **PROCESSING** - Video is being analyzed and segmented
3. **COMPLETED** - Processing finished successfully, segments available
4. **FAILED** - Processing failed, check error message

## Thai Student Optimizations

The module includes specific optimizations for Thai college students:

- **Difficulty Adjustment**: Content difficulty adjusted considering Thai students' English proficiency
- **Cultural Context**: Explanations include relevant cultural context
- **Thai Translations**: Key concepts translated to Thai
- **Pronunciation Guides**: Phonetic guides with common mistakes Thai speakers make
- **Extended Learning Time**: Comprehension time estimates account for non-native speakers

## Database Schema

The module uses a `video_jobs` table with the following structure:

- `id`: UUID primary key
- `user_id`: User who created the job
- `youtube_url`: Source YouTube video URL
- `title`: Job title
- `description`: Job description
- `target_segment_duration`: Desired segment length (seconds)
- `target_audience`: Target audience type
- `status`: Current job status
- `original_duration`: Original video duration
- `output_segments`: Generated segments (JSONB)
- `preferences`: Processing preferences (JSONB)
- `error_message`: Error details if failed
- `created_at`, `updated_at`, `processed_at`: Timestamps

## Dependencies

- `ytdl-core`: YouTube video metadata extraction
- `youtube-transcript`: Transcript extraction
- NLP libraries for content analysis
- Translation services for Thai content

## Future Enhancements

- Real-time processing status updates via WebSocket
- Advanced AI-powered content analysis
- Video clip generation with timestamps
- Interactive quiz generation
- Progress tracking for individual segments
- Mobile app integration
