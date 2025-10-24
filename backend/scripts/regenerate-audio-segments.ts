/**
 * Regenerate audio segments with improved text splitting
 *
 * This script regenerates the audio_segments.json files for existing lessons
 * to update the textParts with better splitting for intro and conclusion segments.
 * Each Thai text part will have its own English translation for display purposes.
 *
 * Usage:
 *   ts-node scripts/regenerate-audio-segments.ts [videoId] [lessonNumber]
 *
 * Examples:
 *   ts-node scripts/regenerate-audio-segments.ts henIVlCPVIY 1
 *   ts-node scripts/regenerate-audio-segments.ts henIVlCPVIY   # All lessons
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AudioSegmentsService } from '../src/video-transform/services/audio-segments.service';
import * as fs from 'fs';
import * as path from 'path';

async function regenerateAudioSegments(videoId?: string, lessonNumber?: number) {
  console.log('🔄 Regenerating Audio Segments with Improved Text Splitting\n');
  console.log('⚠️  WARNING: This will delete existing audio_segments.json files');
  console.log('   Make sure you have backups if needed!\n');

  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  const audioSegmentsService = app.get(AudioSegmentsService);

  const videosDir = path.join(process.cwd(), 'videos');

  try {
    if (videoId) {
      // Process specific video
      const videoDir = path.join(videosDir, videoId);

      if (!fs.existsSync(videoDir)) {
        console.error(`❌ Video directory not found: ${videoDir}`);
        process.exit(1);
      }

      if (lessonNumber) {
        // Process specific lesson
        await processLesson(audioSegmentsService, videoId, lessonNumber);
      } else {
        // Process all lessons in the video
        const lessons = fs
          .readdirSync(videoDir)
          .filter((item) => /^lesson_\d+$/.test(item))
          .map((item) => parseInt(item.replace('lesson_', '')))
          .sort((a, b) => a - b);

        if (lessons.length === 0) {
          console.error(`❌ No lessons found in ${videoDir}`);
          process.exit(1);
        }

        console.log(`📚 Found ${lessons.length} lessons in ${videoId}\n`);

        for (const lesson of lessons) {
          await processLesson(audioSegmentsService, videoId, lesson);
        }
      }
    } else {
      // Process all videos and lessons
      const videos = fs.readdirSync(videosDir).filter((item) => {
        const videoPath = path.join(videosDir, item);
        return fs.statSync(videoPath).isDirectory() && item !== 'Archive.zip';
      });

      if (videos.length === 0) {
        console.error(`❌ No videos found in ${videosDir}`);
        process.exit(1);
      }

      console.log(`📚 Found ${videos.length} videos\n`);

      for (const video of videos) {
        const videoDir = path.join(videosDir, video);
        const lessons = fs
          .readdirSync(videoDir)
          .filter((item) => /^lesson_\d+$/.test(item))
          .map((item) => parseInt(item.replace('lesson_', '')))
          .sort((a, b) => a - b);

        if (lessons.length > 0) {
          console.log(`\n📹 Processing ${video} (${lessons.length} lessons)`);
          for (const lesson of lessons) {
            await processLesson(audioSegmentsService, video, lesson);
          }
        }
      }
    }

    console.log('\n✅ All audio segments regenerated successfully!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Regenerate TTS audio files if needed: npm run test:tts');
    console.log('   2. Regenerate synchronized lessons: ts-node scripts/regenerate-synchronized-lessons.ts');
    console.log('   3. Restart the backend server');
    console.log('   4. Refresh the interactive viewer');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

async function processLesson(service: AudioSegmentsService, videoId: string, lessonNumber: number): Promise<void> {
  try {
    console.log(`\n📝 Processing ${videoId}/lesson_${lessonNumber}...`);

    const lessonDir = path.join(process.cwd(), 'videos', videoId, `lesson_${lessonNumber}`);
    const audioSegmentsPath = path.join(lessonDir, 'audio_segments.json');

    // Check if microlesson_script.json exists
    const scriptPath = path.join(lessonDir, 'microlesson_script.json');
    if (!fs.existsSync(scriptPath)) {
      console.error(`   ❌ microlesson_script.json not found. Skipping.`);
      return;
    }

    // Delete existing audio_segments.json to force regeneration
    if (fs.existsSync(audioSegmentsPath)) {
      console.log(`   🗑️  Deleting old audio_segments.json...`);
      fs.unlinkSync(audioSegmentsPath);
    }

    // Call the service to regenerate audio segments
    const result = await service.generateAudioSegmentsForEpisode(videoId, lessonNumber);

    // Count text parts in intro and conclusion
    const introSegment = result.audioSegments.find((seg) => seg.id === 'intro');
    const conclusionSegment = result.audioSegments.find((seg) => seg.id === 'conclusion');

    console.log(`   ✅ Successfully regenerated audio_segments.json`);
    console.log(`   📊 Total segments: ${result.audioSegments.length}`);

    if (introSegment) {
      console.log(`   📝 Intro textParts: ${introSegment.textParts?.length || 0}`);
    }

    if (conclusionSegment) {
      console.log(`   📝 Conclusion textParts: ${conclusionSegment.textParts?.length || 0}`);
    }
  } catch (error) {
    console.error(`   ❌ Failed to process lesson_${lessonNumber}:`, error.message);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const videoId = args[0];
const lessonNumber = args[1] ? parseInt(args[1]) : undefined;

if (args.length === 0) {
  console.log('No arguments provided. Processing all videos and lessons...\n');
} else if (args.length === 1) {
  console.log(`Processing all lessons for video: ${videoId}\n`);
} else {
  console.log(`Processing lesson ${lessonNumber} for video: ${videoId}\n`);
}

// Run the script
regenerateAudioSegments(videoId, lessonNumber).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
