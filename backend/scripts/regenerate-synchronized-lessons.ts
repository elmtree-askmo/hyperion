/**
 * Regenerate synchronized lesson files to use optimized WebP images
 *
 * This script regenerates the final_synchronized_lesson.json files for existing lessons
 * to update the backgroundUrl paths from PNG to optimized WebP format.
 *
 * Usage:
 *   ts-node scripts/regenerate-synchronized-lessons.ts [videoId] [lessonNumber]
 *
 * Examples:
 *   ts-node scripts/regenerate-synchronized-lessons.ts henIVlCPVIY 1
 *   ts-node scripts/regenerate-synchronized-lessons.ts henIVlCPVIY   # All lessons
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SynchronizedLessonService } from '../src/video-transform/services/synchronized-lesson.service';
import * as fs from 'fs';
import * as path from 'path';

async function regenerateSynchronizedLessons(videoId?: string, lessonNumber?: number) {
  console.log('🔄 Regenerating Synchronized Lessons with WebP Images\n');

  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  const synchronizedLessonService = app.get(SynchronizedLessonService);

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
        await processLesson(synchronizedLessonService, videoId, lessonNumber);
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
          await processLesson(synchronizedLessonService, videoId, lesson);
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
            await processLesson(synchronizedLessonService, video, lesson);
          }
        }
      }
    }

    console.log('\n✅ All synchronized lessons regenerated successfully!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Check the updated final_synchronized_lesson.json files');
    console.log("   2. Restart the backend server if it's running");
    console.log('   3. Refresh the interactive viewer to see optimized images');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

async function processLesson(service: SynchronizedLessonService, videoId: string, lessonNumber: number): Promise<void> {
  try {
    console.log(`\n📝 Processing ${videoId}/lesson_${lessonNumber}...`);

    // Call the service to regenerate the synchronized lesson
    await service.generateSynchronizedLessonForEpisode(videoId, lessonNumber);

    console.log(`   ✅ Successfully regenerated lesson_${lessonNumber}`);

    // Check if WebP images exist
    const lessonDir = path.join(process.cwd(), 'videos', videoId, `lesson_${lessonNumber}`);
    const segmentsDir = path.join(lessonDir, 'lesson_segments');

    if (fs.existsSync(segmentsDir)) {
      const webpFiles = fs.readdirSync(segmentsDir).filter((f) => f.endsWith('.webp'));
      const pngFiles = fs.readdirSync(segmentsDir).filter((f) => f.endsWith('.png'));

      console.log(`   📊 Images: ${pngFiles.length} PNG, ${webpFiles.length} WebP`);

      if (webpFiles.length === 0 && pngFiles.length > 0) {
        console.log(`   ⚠️  Warning: No WebP images found. Run image optimization first.`);
      }
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
regenerateSynchronizedLessons(videoId, lessonNumber).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
