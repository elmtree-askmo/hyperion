import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AudioSegmentsService } from '../src/video-transform/services/audio-segments.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test script to verify English translation feature for Thai text parts
 *
 * This script:
 * 1. Generates audio segments with English translations for Thai text
 * 2. Verifies that all Thai textParts have englishTranslation field
 * 3. Displays sample translations for verification
 *
 * Usage:
 *   cd backend
 *   npm run build
 *   node dist/scripts/test-english-translation.js <videoId> <lessonNumber>
 *
 * Example:
 *   node dist/scripts/test-english-translation.js henIVlCPVIY 1
 */

async function testEnglishTranslation() {
  console.log('🧪 Testing English Translation Feature\n');

  // Get command line arguments
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('❌ Error: Missing required arguments');
    console.error('Usage: node dist/scripts/test-english-translation.js <videoId> <lessonNumber>');
    console.error('Example: node dist/scripts/test-english-translation.js henIVlCPVIY 1');
    process.exit(1);
  }

  const videoId = args[0];
  const lessonNumber = parseInt(args[1], 10);

  if (isNaN(lessonNumber) || lessonNumber < 1) {
    console.error('❌ Error: Lesson number must be a positive integer');
    process.exit(1);
  }

  console.log(`📹 Video ID: ${videoId}`);
  console.log(`📚 Lesson Number: ${lessonNumber}\n`);

  try {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Get the AudioSegmentsService
    const audioSegmentsService = app.get(AudioSegmentsService);

    console.log('🔄 Generating audio segments with English translations...\n');

    // Generate audio segments (this will create englishTranslation fields)
    const result = await audioSegmentsService.generateAudioSegmentsForEpisode(videoId, lessonNumber);

    console.log(`✅ Generated ${result.audioSegments.length} audio segments\n`);

    // Read the generated audio_segments.json file
    const lessonDir = path.join(process.cwd(), 'videos', videoId, `lesson_${lessonNumber}`);
    const audioSegmentsPath = path.join(lessonDir, 'audio_segments.json');

    if (!fs.existsSync(audioSegmentsPath)) {
      console.error('❌ Error: audio_segments.json file not found');
      await app.close();
      process.exit(1);
    }

    const audioSegmentsData = JSON.parse(fs.readFileSync(audioSegmentsPath, 'utf8'));

    // Verify English translations
    console.log('🔍 Verifying English translations...\n');

    let totalTextParts = 0;
    let thaiTextParts = 0;
    let translatedParts = 0;
    let missingTranslations = 0;

    const samples: Array<{ thai: string; english: string; segmentId: string }> = [];

    for (const segment of audioSegmentsData.audioSegments) {
      if (segment.textParts && Array.isArray(segment.textParts)) {
        for (const part of segment.textParts) {
          totalTextParts++;

          if (part.language === 'th') {
            thaiTextParts++;

            if (part.englishTranslation) {
              translatedParts++;

              // Collect samples (first 5)
              if (samples.length < 5) {
                samples.push({
                  thai: part.text,
                  english: part.englishTranslation,
                  segmentId: segment.id,
                });
              }
            } else {
              missingTranslations++;
              console.warn(`⚠️  Missing translation in segment "${segment.id}": "${part.text.substring(0, 50)}..."`);
            }
          }
        }
      }
    }

    // Display statistics
    console.log('📊 Statistics:');
    console.log(`   Total text parts: ${totalTextParts}`);
    console.log(`   Thai text parts: ${thaiTextParts}`);
    console.log(`   Translated parts: ${translatedParts}`);
    console.log(`   Missing translations: ${missingTranslations}\n`);

    // Display sample translations
    if (samples.length > 0) {
      console.log('📝 Sample Translations:\n');

      samples.forEach((sample, index) => {
        console.log(`${index + 1}. Segment: ${sample.segmentId}`);
        console.log(`   Thai: ${sample.thai.substring(0, 80)}${sample.thai.length > 80 ? '...' : ''}`);
        console.log(`   English: ${sample.english.substring(0, 80)}${sample.english.length > 80 ? '...' : ''}`);
        console.log('');
      });
    }

    // Final verdict
    if (missingTranslations === 0 && thaiTextParts > 0) {
      console.log('✅ SUCCESS: All Thai text parts have English translations!');
    } else if (missingTranslations > 0) {
      console.log(`❌ FAILURE: ${missingTranslations} Thai text parts are missing English translations`);
    } else {
      console.log('⚠️  WARNING: No Thai text parts found in the lesson');
    }

    // Close the application
    await app.close();

    console.log('\n✨ Test completed!\n');
    process.exit(missingTranslations > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testEnglishTranslation().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
