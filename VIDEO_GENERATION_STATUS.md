# Video Generation Status Tracking

## Overview

This document describes the video generation status tracking feature that allows monitoring the progress of video generation for each lesson in a video job.

## Database Schema Changes

### New Enum: VideoGenerationStatus

```typescript
export enum VideoGenerationStatus {
  NOT_STARTED = 'not_started',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
```

### New Fields in VideoJob Entity

1. **videoGenerationStatus** (enum)
   - Type: `VideoGenerationStatus`
   - Default: `NOT_STARTED`
   - Description: Current status of video generation

2. **videoGenerationData** (jsonb)
   - Structure:
     ```typescript
     {
       currentLesson?: string;
       generatedVideos?: Array<{
         lessonPath: string;
         outputPath: string;
         generatedAt: Date;
         success: boolean;
         error?: string;
       }>;
       totalLessons?: number;
       completedLessons?: number;
     }
     ```

## API Changes

### 1. Modified: POST `/video-transform/generate-video`

**Request Body:**

```json
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "lessonPath": "henIVlCPVIY/lesson_1",
  "outputFileName": "final_video.mp4" // optional
}
```

**Response:**

```json
{
  "success": true,
  "outputPath": "videos/henIVlCPVIY/lesson_1/final_video.mp4",
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "videoGenerationStatus": "completed",
  "currentLesson": "henIVlCPVIY/lesson_1"
}
```

### 2. New: GET `/video-transform/:id/video-generation-status`

**Description:** Get the current video generation status for a job

**Response:**

```json
{
  "videoJobId": "123e4567-e89b-12d3-a456-426614174000",
  "videoGenerationStatus": "generating",
  "currentLesson": "henIVlCPVIY/lesson_2",
  "generatedVideos": [
    {
      "lessonPath": "henIVlCPVIY/lesson_1",
      "outputPath": "videos/henIVlCPVIY/lesson_1/final_video.mp4",
      "generatedAt": "2024-01-20T10:30:00Z",
      "success": true
    }
  ],
  "totalLessons": 3,
  "completedLessons": 1
}
```

## Implementation Details

### Status Update Flow

1. **Before Generation:**
   - Status: `NOT_STARTED`
   - No generation data

2. **During Generation:**
   - Status: `GENERATING`
   - `currentLesson` updated with lesson path
   - Status saved to database immediately

3. **After Successful Generation:**
   - Status: `COMPLETED`
   - Video info added to `generatedVideos` array
   - `completedLessons` counter incremented

4. **After Failed Generation:**
   - Status: `FAILED`
   - Error info added to `generatedVideos` array with `success: false`

### Service Methods

#### `VideoTransformService.generateVideoWithStatusUpdate()`

- Generates video with real-time status updates
- Uses callback pattern to update database during generation
- Tracks generation progress in `videoGenerationData`

#### `VideoTransformService.getVideoGenerationStatus()`

- Retrieves current status and progress information
- Returns list of all generated videos
- Shows current lesson being processed

#### `RemotionVideoService.generateVideo()`

- Enhanced with optional `onStatusUpdate` callback
- Calls callback at key points:
  - Start of generation (`generating`)
  - Successful completion (`completed`)
  - Generation failure (`failed`)

## Migration

### Running the Migration

```bash
npm run migration:run
```

This will add:

- `video_generation_status` enum column (default: `not_started`)
- `video_generation_data` jsonb column (nullable)

### Rolling Back

```bash
npm run migration:revert
```

## Usage Example

### 1. Generate a Video

```bash
curl -X POST http://localhost:3000/video-transform/generate-video \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "123e4567-e89b-12d3-a456-426614174000",
    "lessonPath": "henIVlCPVIY/lesson_1",
    "outputFileName": "lesson_1_final.mp4"
  }'
```

### 2. Check Generation Status

```bash
curl -X GET http://localhost:3000/video-transform/123e4567-e89b-12d3-a456-426614174000/video-generation-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Poll for Completion

You can poll the status endpoint to track progress:

```javascript
async function waitForVideoGeneration(jobId) {
  const maxAttempts = 60; // 5 minutes with 5s interval
  const interval = 5000; // 5 seconds

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`http://localhost:3000/video-transform/${jobId}/video-generation-status`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const status = await response.json();

    if (status.videoGenerationStatus === 'completed') {
      console.log('Video generation completed!');
      return status;
    } else if (status.videoGenerationStatus === 'failed') {
      console.error('Video generation failed!');
      throw new Error('Video generation failed');
    }

    console.log(`Progress: ${status.completedLessons}/${status.totalLessons}`);
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error('Timeout waiting for video generation');
}
```

## Benefits

1. **Real-time Progress Tracking**: Monitor video generation progress in real-time
2. **Historical Record**: Keep track of all generated videos per job
3. **Error Handling**: Detailed error information for failed generations
4. **Multiple Videos**: Support for generating multiple lesson videos per job
5. **User Experience**: Better UX with progress indicators

## Future Enhancements

1. WebSocket integration for real-time status updates
2. Progress percentage calculation based on Remotion render progress
3. Ability to cancel ongoing video generation
4. Retry mechanism for failed generations
5. Queue management for multiple concurrent generations
