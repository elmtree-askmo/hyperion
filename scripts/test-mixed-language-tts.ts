import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { TtsAudioSegmentsService } from '../src/video-transform/services/tts-audio-segments.service';

// Load environment variables
dotenv.config();

interface TextPart {
  text: string;
  language: 'th' | 'en';
  speakingRate?: number;
}

async function testMixedLanguageTts() {
  console.log('🎤 Testing Mixed Language TTS with TextParts...');
  console.log('='.repeat(60));

  try {
    const ttsService = new TtsAudioSegmentsService();
    console.log('✅ TTS Service initialized successfully\n');

    // Create test directory
    const testDir = path.join(process.cwd(), 'audios', 'test-mixed-language');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Test Case 1: Simple Thai only
    console.log('Test 1: Thai only (single part)');
    const test1Parts: TextPart[] = [{ text: 'สวัสดีค่ะ ยินดีต้อนรับสู่บทเรียนวันนี้', language: 'th' }];
    await testGenerateMixedAudio(ttsService, test1Parts, path.join(testDir, 'test1_thai_only.wav'), testDir);

    // Test Case 2: Thai with English word
    console.log('\nTest 2: Thai with English vocabulary word');
    const test2Parts: TextPart[] = [
      { text: 'คำศัพท์: ', language: 'th' },
      { text: 'restaurant', language: 'en', speakingRate: 0.8 },
      { text: ' — ร้านอาหาร', language: 'th' },
    ];
    await testGenerateMixedAudio(ttsService, test2Parts, path.join(testDir, 'test2_vocab_word.wav'), testDir);

    // Test Case 3: Thai with English phrase
    console.log('\nTest 3: Thai with English phrase');
    const test3Parts: TextPart[] = [
      { text: 'เป้าหมายแรกคือ ', language: 'th' },
      { text: "I'd like to make a reservation", language: 'en', speakingRate: 0.8 },
      { text: ' และ ', language: 'th' },
      { text: 'Could you recommend a restaurant?', language: 'en', speakingRate: 0.8 },
    ];
    await testGenerateMixedAudio(ttsService, test3Parts, path.join(testDir, 'test3_phrases.wav'), testDir);

    // Test Case 4: Complex mixed content
    console.log('\nTest 4: Complex mixed content with example sentence');
    const test4Parts: TextPart[] = [
      { text: 'คำศัพท์: ', language: 'th' },
      { text: 'restaurant', language: 'en', speakingRate: 0.8 },
      { text: ' — ร้านอาหาร ใช้เมื่อพูดถึงสถานที่กินข้าว เช่น ', language: 'th' },
      { text: "Let's go to a Japanese restaurant near Siam", language: 'en', speakingRate: 0.8 },
    ];
    await testGenerateMixedAudio(ttsService, test4Parts, path.join(testDir, 'test4_complex.wav'), testDir);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 All tests completed successfully!');
    console.log(`📁 Test audio files saved in: ${testDir}`);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

async function testGenerateMixedAudio(ttsService: TtsAudioSegmentsService, textParts: TextPart[], outputPath: string, segmentsPath: string): Promise<void> {
  try {
    const segmentId = path.basename(outputPath, '.wav');

    console.log(`  📝 Text parts: ${textParts.length}`);
    textParts.forEach((part, i) => {
      const rate = part.speakingRate || (part.language === 'en' ? 0.8 : 1.0);
      console.log(`     ${i + 1}. [${part.language}] "${part.text.substring(0, 50)}${part.text.length > 50 ? '...' : ''}" (rate: ${rate})`);
    });

    const duration = await (ttsService as any).generateTtsAudioWithParts(textParts, outputPath, segmentsPath, segmentId);

    console.log(`  ✅ Generated successfully!`);
    console.log(`     📁 File: ${path.basename(outputPath)}`);
    console.log(`     ⏱️  Duration: ${duration.toFixed(2)} seconds`);

    // Verify the file
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`     📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    }
  } catch (error) {
    console.error(`  ❌ Failed:`, error.message);
    throw error;
  }
}

// Run test
testMixedLanguageTts()
  .then(() => {
    console.log('🏁 Test script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
