import { NestFactory } from '@nestjs/core';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from '../src/app.module';
import { LLMConfigService } from '../src/video-transform/services/llm-config.service';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

/**
 * Script to update lesson titles with LLM-generated Thai translations
 *
 * This script reads existing microlesson_script.json files and generates
 * proper Thai titles using LLM, replacing the simple string-replacement method.
 *
 * Usage:
 *   npm run build
 *   node dist/scripts/update-lesson-titles.js [videoId] [lessonNumber]
 *
 * Examples:
 *   node dist/scripts/update-lesson-titles.js                    # Update all videos/lessons
 *   node dist/scripts/update-lesson-titles.js henIVlCPVIY        # Update all lessons in video
 *   node dist/scripts/update-lesson-titles.js henIVlCPVIY 3      # Update specific lesson
 */

interface MicrolessonScript {
  lesson: {
    title: string;
    titleTh: string;
    learningObjectives?: any[];
    keyVocabulary?: any[];
    [key: string]: any;
  };
  [key: string]: any;
}

async function updateLessonTitles(videoId?: string, lessonNumber?: number) {
  console.log('🔄 Updating Lesson Titles with LLM-generated Thai Translations\n');

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
        return fs.statSync(videoPath).isDirectory() && !item.endsWith('.zip');
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

    console.log('\n✅ All titles updated successfully!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Review the updated microlesson_script.json files');
    console.log('   2. Restart the backend server if running');
    console.log('   3. Refresh the interactive viewer to see updated titles');
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
    const scriptData: MicrolessonScript = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
    const currentTitle = scriptData.lesson.title;
    const currentTitleTh = scriptData.lesson.titleTh;

    console.log(`   📖 Current English title: "${currentTitle}"`);
    console.log(`   📖 Current Thai title: "${currentTitleTh}"`);

    // Check if Thai title looks like it needs updating (contains English words or is too similar)
    const needsUpdate = hasEnglishWords(currentTitleTh) || currentTitleTh === currentTitle;

    if (!needsUpdate) {
      console.log(`   ✓ Thai title looks good. Skipping.`);
      return;
    }

    console.log(`   🔄 Generating improved titles with LLM...`);

    // Generate new titles using LLM
    const { title, titleTh } = await generateEnhancedTitles(llm, currentTitle, scriptData.lesson.learningObjectives, scriptData.lesson.keyVocabulary);

    console.log(`   ✨ New English title: "${title}"`);
    console.log(`   ✨ New Thai title: "${titleTh}"`);

    // Update the script data
    scriptData.lesson.title = title;
    scriptData.lesson.titleTh = titleTh;

    // Create backup if it doesn't exist
    const backupPath = path.join(lessonDir, 'microlesson_script.json.backup');
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(scriptPath, backupPath);
      console.log(`   💾 Backup created: microlesson_script.json.backup`);
    }

    // Save updated file
    fs.writeFileSync(scriptPath, JSON.stringify(scriptData, null, 2));

    console.log(`   ✅ Successfully updated titles`);
  } catch (error) {
    console.error(`   ❌ Failed to process lesson_${lessonNumber}:`, error.message);
    throw error;
  }
}

async function generateEnhancedTitles(llm: any, originalTitle: string, learningObjectives?: any[], keyVocabulary?: any[]): Promise<{ title: string; titleTh: string }> {
  const prompt = PromptTemplate.fromTemplate(`
You are creating focused, engaging titles for 5-minute English microlessons for Thai college students.

Original lesson: "{originalTitle}"
Key topics: {keyTopics}
Target vocabulary: {vocabulary}

Create a microlesson title pair that includes:
1. English title (5-8 words, specific and actionable) - for learning content only
2. Thai title (primary title that students will see, natural and engaging)

Requirements for English title:
- Specific and actionable (not just "English Conversation")
- Mentions the practical skill being taught
- Appeals to Thai university students
- Indicates it's a quick, focused lesson

Requirements for Thai title:
- Natural, engaging Thai as the PRIMARY title
- Keep educational terminology accurate
- Make it appealing to Thai university students
- Use modern Thai language
- This will be the main title students see
- Must be COMPLETE THAI (no English words mixed in)

Examples:
- Thai: "สั่งกาแฟเป็นภาษาอังกฤษแบบมืออาชีพ" → English: "Ordering Coffee in English Like a Pro"
- Thai: "การสนทนาเช็คอินโรงแรมแบบง่ายๆ" → English: "Hotel Check-in Conversations Made Easy"
- Thai: "ภาษาอังกฤษร้านอาหาร: จากเมนูถึงการจ่ายเงิน" → English: "Restaurant English: From Menu to Payment"

Return ONLY valid JSON:
{{
  "title": "...",
  "titleTh": "..."
}}
`);

  const chain = prompt.pipe(llm).pipe(new StringOutputParser());

  const result = await chain.invoke({
    originalTitle,
    keyTopics: extractKeyTopics(learningObjectives),
    vocabulary: extractKeyVocabulary(keyVocabulary),
  });

  try {
    const parsedResult = JSON.parse(cleanJsonResponse(result));
    return {
      title: parsedResult.title || originalTitle,
      titleTh: parsedResult.titleTh || 'ทักษะภาษาอังกฤษที่จำเป็น',
    };
  } catch (parseError) {
    console.warn('   ⚠️  Failed to parse LLM response, using original title');
    return {
      title: originalTitle,
      titleTh: 'ทักษะภาษาอังกฤษที่จำเป็น',
    };
  }
}

function extractKeyTopics(learningObjectives?: any[]): string {
  if (!learningObjectives || learningObjectives.length === 0) {
    return 'conversation skills';
  }

  // Extract key topics from learning objectives
  const topics = learningObjectives
    .slice(0, 3)
    .map((obj) => {
      if (typeof obj === 'string') return obj;
      if (obj.statement) return obj.statement;
      if (obj.objective) return obj.objective;
      return '';
    })
    .filter(Boolean)
    .join(', ');

  return topics || 'conversation skills';
}

function extractKeyVocabulary(keyVocabulary?: any[]): string {
  if (!keyVocabulary || keyVocabulary.length === 0) {
    return 'everyday English';
  }

  const vocab = keyVocabulary
    .slice(0, 5)
    .map((v) => {
      if (typeof v === 'string') return v;
      if (v.word) return v.word;
      if (v.term) return v.term;
      return '';
    })
    .filter(Boolean)
    .join(', ');

  return vocab || 'everyday English';
}

function hasEnglishWords(text: string): boolean {
  // Check if text contains English words (not just Thai)
  const englishPattern = /[a-zA-Z]{3,}/; // 3+ consecutive English letters
  return englishPattern.test(text);
}

function cleanJsonResponse(text: string): string {
  // Remove markdown code blocks if present
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');

  // Find JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  return cleaned.trim();
}

// Parse command line arguments
const args = process.argv.slice(2);
const videoId = args[0];
const lessonNumber = args[1] ? parseInt(args[1]) : undefined;

// Validate lessonNumber if provided
if (args[1] && isNaN(lessonNumber as number)) {
  console.error('❌ Invalid lesson number. Please provide a valid number.');
  process.exit(1);
}

// Run the script
updateLessonTitles(videoId, lessonNumber).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
