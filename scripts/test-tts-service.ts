import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { TtsAudioSegmentsService } from '../src/video-transform/services/tts-audio-segments.service';

// Load environment variables
dotenv.config();

async function testTtsService() {
  console.log('🎤 Testing TTS Audio Segments Service...');
  console.log('='.repeat(60));

  try {
    const ttsService = await initialize();
    await runTtsTests(ttsService);
    console.log('\n🎉 TTS Service test completed successfully!');
  } catch (error) {
    handleTestError(error);
    process.exit(1);
  } finally {
    // cleanupTestDirectory();
  }
}

async function initialize(): Promise<TtsAudioSegmentsService> {
  // Initialize TTS service to verify it can be created
  const ttsService = new TtsAudioSegmentsService();
  console.log('✅ TTS Service initialized successfully');
  return ttsService;
}

async function runTtsTests(ttsService: TtsAudioSegmentsService): Promise<void> {
  // const testTextWithSSML =
  //   "<speak>เป้าหมายแรกของเราคือ การสื่อสารเพื่อขอคำแนะนำอย่างสุภาพในสถานที่ต่างๆ เช่น โรงแรม ร้านอาหาร โดยใช้ประโยคว่า <break time='2s'/> 'Can you recommend?'</speak>";
  // console.log(`🔤 Test text: "${testTextWithSSML}"`);

  // await testGenerateTtsAudio(ttsService, testTextWithSSML, true);

  // const testTex = 'Can you recommend?';
  // console.log(`🔤 Test text: "${testTex}"`);

  // await testGenerateTtsAudio(ttsService, testTex, 0.7, false);

  const testTex = `Here are S S M L samples. I can pause [3 second pause].
I can speak in cardinals. Your number is ten.
Or I can speak in ordinals. You are tenth in line.
Or I can even speak in digits. The digits for ten are one oh.
I can also substitute phrases, like the World Wide Web Consortium.
Finally, I can speak a paragraph with two sentences. This is sentence one. This is sentence two.`;
  console.log(`🔤 Test text: "${testTex}"`);
  await testGenerateTtsAudio(ttsService, testTex, 1, true);
}

async function testGenerateTtsAudio(ttsService: TtsAudioSegmentsService, testText: string, speed: number = 1, ssml: boolean = false): Promise<void> {
  console.log('🎵 Testing TTS audio generation...');

  // Create test directory
  const testDir = path.join(process.cwd(), 'audios');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const testAudioPath = path.join(testDir, 'test-audio.wav');

  try {
    // Test the generateTtsAudio method directly
    // Since it's private, we'll use reflection to access it
    const duration = await ttsService.generateTtsAudio(testText, testAudioPath, speed, ssml);

    console.log(`✅ TTS Audio generated successfully!`);
    console.log(`   📁 File: ${testAudioPath}`);
    console.log(`   ⏱️  Duration: ${duration.toFixed(2)} seconds`);

    // Verify the file exists and has content
    if (fs.existsSync(testAudioPath)) {
      const stats = fs.statSync(testAudioPath);
      console.log(`   📊 File size: ${stats.size} bytes`);

      if (stats.size > 0) {
        console.log('✅ Audio file generated with content');
      } else {
        console.log('❌ Audio file is empty');
      }
    } else {
      console.log('❌ Audio file was not created');
    }
  } catch (error) {
    console.error('❌ TTS audio generation failed:', error.message);
    throw error;
  }
}

function handleTestError(error: any): void {
  console.error('❌ TTS Service test failed:', error.message);

  if (error.message.includes('credentials')) {
    console.error('💡 Tip: Make sure to set up Google Cloud credentials:');
    console.error('   1. Create a service account in Google Cloud Console');
    console.error('   2. Download the JSON key file');
    console.error('   3. Place it at .credentials/gcloud_key.json');
  }

  if (error.message.includes('ffprobe')) {
    console.error('💡 Tip: Make sure FFmpeg is installed:');
    console.error('   - macOS: brew install ffmpeg');
    console.error('   - Ubuntu: sudo apt install ffmpeg');
    console.error('   - Windows: Download from https://ffmpeg.org/');
  }
}

function cleanupTestDirectory(): void {
  const testDir = path.join(process.cwd(), 'audios');
  if (fs.existsSync(testDir)) {
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
      console.log('🧹 Cleaned up test directory');
    } catch (cleanupError) {
      console.warn('⚠️  Failed to cleanup test directory:', cleanupError.message);
    }
  }
}

// Run test
testTtsService()
  .then(() => {
    console.log('='.repeat(60));
    console.log('🏁 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
