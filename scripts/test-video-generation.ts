/**
 * Test script for Remotion video generation
 */
import { RemotionVideoService } from '../src/video-transform/services/remotion-video.service';
import { Logger } from '@nestjs/common';

const logger = new Logger('VideoGenerationTest');

async function testVideoGeneration() {
  logger.log('Starting video generation test...');

  const service = new RemotionVideoService();

  // Test with lesson 1
  const lessonPath = 'henIVlCPVIY/lesson_1';
  const outputPath = `videos/${lessonPath}/test_final_video.mp4`;

  logger.log(`Lesson path: ${lessonPath}`);
  logger.log(`Output path: ${outputPath}`);

  try {
    const result = await service.generateVideo(lessonPath, outputPath);

    if (result.success) {
      logger.log('✅ Video generation successful!');
      logger.log(`Output file: ${result.outputPath}`);
    } else {
      logger.error('❌ Video generation failed');
      logger.error(`Error: ${result.error}`);
    }
  } catch (error) {
    logger.error('❌ Unexpected error during video generation');
    logger.error(error);
  }
}

// Run the test
testVideoGeneration()
  .then(() => {
    logger.log('Test completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Test failed:', error);
    process.exit(1);
  });
