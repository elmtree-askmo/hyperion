import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { LLMConfigService } from '../src/video-transform/services/llm-config.service';
import { TtsAudioSegmentsService } from '../src/video-transform/services/tts-audio-segments.service';
import { SynchronizedLessonService } from '../src/video-transform/services/synchronized-lesson.service';
import * as fs from 'fs';
import * as path from 'path';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

interface TextPart {
  text: string;
  language: 'th' | 'en';
  speakingRate?: number;
  englishTranslation?: string;
  thaiTranslation?: string;
}

interface AudioSegment {
  id: string;
  text: string;
  textParts?: TextPart[];
  screenElement?: string;
  description?: string;
  visualDescription?: string;
  backgroundImageDescription?: string;
  vocabWord?: string;
}

interface AudioSegmentsData {
  audioSegments: AudioSegment[];
}

/**
 * Script to add Thai translations to English phrases in practice_card segments
 * This updates existing audio_segments.json files with thaiTranslation fields
 */
class AddThaiTranslationsScript {
  private llmConfigService: LLMConfigService;
  private ttsService: TtsAudioSegmentsService;
  private syncService: SynchronizedLessonService;
  private llm: any;

  async initialize() {
    console.log('🚀 Initializing services...\n');
    const app = await NestFactory.createApplicationContext(AppModule);

    this.llmConfigService = app.get(LLMConfigService);
    this.ttsService = app.get(TtsAudioSegmentsService);
    this.syncService = app.get(SynchronizedLessonService);

    if (!this.llmConfigService.isLLMAvailable()) {
      throw new Error('❌ LLM is required but not available. Please configure LLM_PROVIDER in .env');
    }

    this.llm = this.llmConfigService.getLLM();

    if (!this.llm) {
      throw new Error('❌ Failed to get LLM instance');
    }

    console.log(`✅ LLM initialized: ${this.llmConfigService.getLLMProvider()}\n`);
  }

  /**
   * Generate Thai translation for an English phrase using LLM
   */
  async generateThaiTranslation(englishPhrase: string, context: string): Promise<string> {
    const prompt = `You are an expert English-Thai translator specializing in educational content for Thai college students learning English.

TASK: Translate the following English phrase into natural, colloquial Thai.

ENGLISH PHRASE:
${englishPhrase}

CONTEXT:
${context}

TRANSLATION GUIDELINES:
1. Provide a natural, conversational Thai translation
2. Use language that Thai college students would actually use in real-life situations
3. Include appropriate politeness particles (ครับ/ค่ะ) where natural
4. Make it sound like something a Thai person would actually say in that situation
5. Keep it concise and practical

Return ONLY the Thai translation, nothing else.`;

    const promptTemplate = PromptTemplate.fromTemplate(prompt);
    const chain = RunnableSequence.from([promptTemplate, this.llm, new StringOutputParser()]);

    const result = await chain.invoke({});
    return result.trim();
  }

  /**
   * Add Thai translations to practice_card segments in audio_segments.json
   */
  async addThaiTranslationsToAudioSegments(videoId: string, lessonNumber: number): Promise<{ updated: boolean; segmentsUpdated: number }> {
    const lessonDir = path.join(process.cwd(), 'videos', videoId, `lesson_${lessonNumber}`);
    const audioSegmentsPath = path.join(lessonDir, 'audio_segments.json');

    if (!fs.existsSync(audioSegmentsPath)) {
      console.log(`⚠️  audio_segments.json not found: ${audioSegmentsPath}`);
      return { updated: false, segmentsUpdated: 0 };
    }

    // Read existing audio segments
    const audioSegmentsData: AudioSegmentsData = JSON.parse(fs.readFileSync(audioSegmentsPath, 'utf-8'));

    let segmentsUpdated = 0;
    let translationsAdded = 0;

    // Process each segment
    for (const segment of audioSegmentsData.audioSegments) {
      // Only process practice_card segments
      if (segment.screenElement !== 'practice_card') {
        continue;
      }

      if (!segment.textParts || segment.textParts.length === 0) {
        continue;
      }

      let segmentModified = false;

      // Check each textPart
      for (const textPart of segment.textParts) {
        // Only process English parts that don't already have thaiTranslation
        if (textPart.language === 'en' && !textPart.thaiTranslation) {
          console.log(`\n📝 Generating Thai translation for:`);
          console.log(`   Segment: ${segment.id}`);
          console.log(`   English: ${textPart.text}`);

          try {
            // Generate Thai translation
            const thaiTranslation = await this.generateThaiTranslation(textPart.text, segment.description || segment.text);

            textPart.thaiTranslation = thaiTranslation;
            translationsAdded++;
            segmentModified = true;

            console.log(`   ✅ Thai: ${thaiTranslation}`);
          } catch (error) {
            console.error(`   ❌ Failed to generate translation: ${error.message}`);
          }

          // Add a small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (segmentModified) {
        segmentsUpdated++;
      }
    }

    if (translationsAdded > 0) {
      // Create backup
      const backupPath = audioSegmentsPath.replace('.json', '.backup.json');
      fs.copyFileSync(audioSegmentsPath, backupPath);
      console.log(`\n💾 Backup created: ${backupPath}`);

      // Save updated audio segments
      fs.writeFileSync(audioSegmentsPath, JSON.stringify(audioSegmentsData, null, 2));
      console.log(`✅ Updated audio_segments.json with ${translationsAdded} Thai translations`);

      return { updated: true, segmentsUpdated };
    }

    return { updated: false, segmentsUpdated: 0 };
  }

  /**
   * Process a single lesson
   */
  async processLesson(videoId: string, lessonNumber: number): Promise<boolean> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📚 Processing Lesson ${lessonNumber}`);
    console.log(`${'='.repeat(60)}\n`);

    // Step 1: Add Thai translations to audio_segments.json
    console.log('Step 1: Adding Thai translations to audio_segments.json...');
    const { updated, segmentsUpdated } = await this.addThaiTranslationsToAudioSegments(videoId, lessonNumber);

    if (!updated) {
      console.log(`ℹ️  No translations needed for lesson ${lessonNumber}`);
      return false;
    }

    console.log(`\n✅ Updated ${segmentsUpdated} segments`);

    // Step 2: Regenerate TTS audio with updated textParts
    console.log('\nStep 2: Regenerating TTS audio files...');
    try {
      await this.ttsService.generateTtsAudioSegmentsForEpisode(videoId, lessonNumber);
      console.log('✅ TTS audio regenerated');
    } catch (error) {
      console.error(`❌ Failed to regenerate TTS: ${error.message}`);
      return false;
    }

    // Step 3: Regenerate synchronized lesson
    console.log('\nStep 3: Regenerating synchronized lesson...');
    try {
      await this.syncService.generateSynchronizedLessonForEpisode(videoId, lessonNumber);
      console.log('✅ Synchronized lesson regenerated');
    } catch (error) {
      console.error(`❌ Failed to regenerate synchronized lesson: ${error.message}`);
      return false;
    }

    console.log(`\n✅ Successfully updated lesson ${lessonNumber}`);
    return true;
  }

  /**
   * Process all lessons for a video
   */
  async processVideo(videoId: string): Promise<void> {
    const videoDir = path.join(process.cwd(), 'videos', videoId);

    if (!fs.existsSync(videoDir)) {
      console.log(`❌ Video directory not found: ${videoDir}`);
      return;
    }

    // Find all lesson directories
    const entries = fs.readdirSync(videoDir, { withFileTypes: true });
    const lessonDirs = entries
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('lesson_'))
      .map((entry) => entry.name)
      .sort();

    if (lessonDirs.length === 0) {
      console.log(`⚠️  No lesson directories found in ${videoDir}`);
      return;
    }

    console.log(`\n📹 Found ${lessonDirs.length} lessons for video ${videoId}`);

    let successCount = 0;
    let skipCount = 0;

    for (const lessonDir of lessonDirs) {
      const lessonNumber = parseInt(lessonDir.replace('lesson_', ''));
      const success = await this.processLesson(videoId, lessonNumber);

      if (success) {
        successCount++;
      } else {
        skipCount++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Summary for ${videoId}:`);
    console.log(`   ✅ Updated: ${successCount} lessons`);
    console.log(`   ⏭️  Skipped: ${skipCount} lessons`);
    console.log(`${'='.repeat(60)}\n`);
  }

  /**
   * Process all videos
   */
  async processAllVideos(): Promise<void> {
    const videosDir = path.join(process.cwd(), 'videos');

    if (!fs.existsSync(videosDir)) {
      console.log(`❌ Videos directory not found: ${videosDir}`);
      return;
    }

    const entries = fs.readdirSync(videosDir, { withFileTypes: true });
    const videoDirs = entries
      .filter((entry) => entry.isDirectory())
      .filter((entry) => {
        // Check if directory contains lesson folders
        const videoPath = path.join(videosDir, entry.name);
        const subEntries = fs.readdirSync(videoPath, { withFileTypes: true });
        return subEntries.some((sub) => sub.isDirectory() && sub.name.startsWith('lesson_'));
      })
      .map((entry) => entry.name);

    if (videoDirs.length === 0) {
      console.log(`⚠️  No video directories with lessons found`);
      return;
    }

    console.log(`\n🎬 Found ${videoDirs.length} videos with lessons\n`);

    for (const videoId of videoDirs) {
      await this.processVideo(videoId);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('🔧 Add Thai Translations to Practice Phrases');
  console.log(`${'='.repeat(60)}\n`);

  const args = process.argv.slice(2);
  const videoId = args[0];
  const lessonNumber = args[1] ? parseInt(args[1]) : undefined;

  const script = new AddThaiTranslationsScript();

  try {
    await script.initialize();

    if (videoId && lessonNumber) {
      // Process specific lesson
      console.log(`📚 Mode: Single Lesson`);
      console.log(`📹 Video ID: ${videoId}`);
      console.log(`📖 Lesson Number: ${lessonNumber}\n`);
      await script.processLesson(videoId, lessonNumber);
    } else if (videoId) {
      // Process all lessons for a video
      console.log(`📚 Mode: All Lessons for Video`);
      console.log(`📹 Video ID: ${videoId}\n`);
      await script.processVideo(videoId);
    } else {
      // Process all videos
      console.log(`📚 Mode: All Videos and Lessons\n`);
      await script.processAllVideos();
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ Script completed successfully!');
    console.log(`${'='.repeat(60)}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
