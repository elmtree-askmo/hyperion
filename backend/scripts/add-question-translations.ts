/**
 * Add English translations to comprehensionQuestions
 *
 * This script updates existing microlesson_script.json files to add
 * questionEn and contextEn fields to all comprehension questions.
 * Uses LLM to generate accurate English translations.
 *
 * Usage:
 *   ts-node scripts/add-question-translations.ts [videoId] [lessonNumber]
 *
 * Examples:
 *   ts-node scripts/add-question-translations.ts henIVlCPVIY 1
 *   ts-node scripts/add-question-translations.ts henIVlCPVIY   # All lessons
 *   ts-node scripts/add-question-translations.ts                # All videos
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { LLMConfigService } from '../src/video-transform/services/llm-config.service';
import * as fs from 'fs';
import * as path from 'path';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

interface ComprehensionQuestion {
  question: string;
  questionTh: string;
  questionEn?: string;
  expectedAnswer: string;
  context: string;
  contextEn?: string;
}

async function addQuestionTranslations(videoId?: string, lessonNumber?: number) {
  console.log('🔄 Adding English Translations to Comprehension Questions\n');

  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  const llmConfigService = app.get(LLMConfigService);

  // Get LLM instance
  const llm = llmConfigService.getLLM();
  if (!llm) {
    console.error('❌ LLM is required but not configured. Please set LLM_PROVIDER and API key.');
    process.exit(1);
  }

  console.log(`✅ Using ${llmConfigService.getLLMProvider()} LLM provider\n`);

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
        await processLesson(llm, videoId, lessonNumber);
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
          await processLesson(llm, videoId, lesson);
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
            await processLesson(llm, video, lesson);
          }
        }
      }
    }

    console.log('\n✅ All translations added successfully!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Review the updated microlesson_script.json files');
    console.log('   2. Restart the backend server');
    console.log('   3. Refresh the interactive viewer to see translations');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

async function processLesson(llm: any, videoId: string, lessonNumber: number): Promise<void> {
  try {
    console.log(`\n📝 Processing ${videoId}/lesson_${lessonNumber}...`);

    const lessonDir = path.join(process.cwd(), 'videos', videoId, `lesson_${lessonNumber}`);
    const scriptPath = path.join(lessonDir, 'microlesson_script.json');

    if (!fs.existsSync(scriptPath)) {
      console.error(`   ❌ microlesson_script.json not found. Skipping.`);
      return;
    }

    // Read the microlesson script
    const scriptData = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
    const questions: ComprehensionQuestion[] = scriptData.lesson.comprehensionQuestions;

    if (!questions || questions.length === 0) {
      console.log(`   ⚠️  No comprehension questions found. Skipping.`);
      return;
    }

    // Check if translations already exist
    const needsTranslation = questions.some((q) => !q.questionEn || !q.contextEn);
    if (!needsTranslation) {
      console.log(`   ✓ All questions already have translations. Skipping.`);
      return;
    }

    console.log(`   🔄 Generating translations for ${questions.length} questions...`);

    // Generate translations using LLM
    const translatedQuestions = await generateTranslations(llm, questions);

    // Update the script data
    scriptData.lesson.comprehensionQuestions = translatedQuestions;

    // Create backup
    const backupPath = path.join(lessonDir, 'microlesson_script.json.backup');
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(scriptPath, backupPath);
      console.log(`   💾 Backup created: microlesson_script.json.backup`);
    }

    // Save updated file
    fs.writeFileSync(scriptPath, JSON.stringify(scriptData, null, 2));

    console.log(`   ✅ Successfully added translations to ${translatedQuestions.length} questions`);

    // Display sample
    if (translatedQuestions.length > 0) {
      const sample = translatedQuestions[0];
      console.log(`\n   📋 Sample translation:`);
      console.log(`      Question (TH): ${sample.questionTh.substring(0, 60)}...`);
      if (sample.questionEn) {
        console.log(`      Question (EN): ${sample.questionEn.substring(0, 60)}...`);
      }
    }
  } catch (error) {
    console.error(`   ❌ Failed to process lesson_${lessonNumber}:`, error.message);
    throw error;
  }
}

async function generateTranslations(llm: any, questions: ComprehensionQuestion[]): Promise<ComprehensionQuestion[]> {
  const prompt = PromptTemplate.fromTemplate(`
You are a professional translator specializing in Thai-English language learning materials.

Translate the following comprehension questions and contexts from Thai to English.
Maintain the educational tone and clarity for English language learners.

IMPORTANT:
- Provide accurate, natural English translations
- Keep the meaning and educational intent
- Make translations clear and easy to understand
- Only translate the Thai parts, keep English phrases as-is

Questions to translate:
{questionsJson}

Return ONLY a valid JSON array with the same structure, adding "questionEn" and "contextEn" fields:
[
  {{
    "question": "original mixed Thai+English question",
    "questionTh": "original Thai question",
    "questionEn": "English translation of the question",
    "expectedAnswer": "original expected answer",
    "context": "original Thai context",
    "contextEn": "English translation of the context"
  }}
]
`);

  const chain = RunnableSequence.from([prompt, llm, new StringOutputParser()]);

  // Process questions in batches of 5 to avoid token limits
  const batchSize = 5;
  const results: ComprehensionQuestion[] = [];

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    console.log(`   ⏳ Translating batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(questions.length / batchSize)}...`);

    const result = await chain.invoke({
      questionsJson: JSON.stringify(batch, null, 2),
    });

    // Parse LLM response
    const translated = parseJsonResponse(result);
    results.push(...translated);

    // Small delay to avoid rate limits
    if (i + batchSize < questions.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

function parseJsonResponse(response: string): ComprehensionQuestion[] {
  // Remove markdown code blocks if present
  let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');

  // Find JSON array boundaries
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');

  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse LLM response:', error.message);
    console.error('Response:', cleaned.substring(0, 200));
    throw new Error('Failed to parse translations from LLM response');
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
addQuestionTranslations(videoId, lessonNumber).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
