import { Injectable, Logger } from '@nestjs/common';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { LLMConfigService } from './llm-config.service';
import * as fs from 'fs';
import * as path from 'path';

interface FlashcardConfig {
  enabled: boolean;
  maxRetries: number;
  timeoutMs: number;
}

export interface Flashcard {
  word: string;
  definition: string;
  thaiDefinition: string;
  thaiTranslation: string;
  pronunciation: string;
  phonetic: string;
  memoryHook: string;
  contextExample: string;
  partOfSpeech: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

@Injectable()
export class FlashcardsService {
  private readonly logger = new Logger(FlashcardsService.name);
  private readonly llm;
  private config: FlashcardConfig;
  private readonly videosDir = path.join(process.cwd(), 'videos');

  constructor(private readonly llmConfigService: LLMConfigService) {
    // Get LLM instance from the config service
    this.llm = this.llmConfigService.getLLM();

    // Production configuration
    this.config = {
      enabled: true,
      maxRetries: 2,
      timeoutMs: 30000, // 30 seconds timeout
    };
  }

  /**
   * Generate vocabulary flashcards for a specific lesson
   */
  async generateFlashcards(videoId: string, lessonNumber: number): Promise<Flashcard[]> {
    if (!this.config.enabled) {
      throw new Error('Flashcard generation is disabled');
    }

    // Check if flashcards already exist
    const lessonDir = path.join(this.videosDir, videoId, `lesson_${lessonNumber}`);
    const flashcardsPath = path.join(lessonDir, 'flashcards.json');
    if (fs.existsSync(flashcardsPath)) {
      const flashcards = JSON.parse(fs.readFileSync(flashcardsPath, 'utf8')).flashcards;
      this.logger.log(`✅ Loaded ${flashcards.length} flashcards from file`);
      return flashcards;
    }

    this.logger.log(`🃏 Generating flashcards for video ${videoId}, lesson ${lessonNumber}...`);

    try {
      // Read the microlesson script file
      const scriptPath = path.join(lessonDir, 'microlesson_script.json');

      if (!fs.existsSync(scriptPath)) {
        throw new Error(`Microlesson script not found for lesson ${lessonNumber}`);
      }

      const microlessonScript = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));

      // Extract vocabulary from the script
      const keyVocabulary = microlessonScript.lesson?.keyVocabulary || [];

      if (keyVocabulary.length === 0) {
        this.logger.warn('No vocabulary found in microlesson script');
        return [];
      }

      // Generate enhanced flashcards using LLM
      const flashcards = await this.createEnhancedFlashcards(keyVocabulary, microlessonScript.lesson);

      // Save flashcards to file
      const flashcardsPath = path.join(lessonDir, 'flashcards.json');
      fs.writeFileSync(flashcardsPath, JSON.stringify({ flashcards }, null, 2));

      this.logger.log(`✅ Generated ${flashcards.length} flashcards`);

      return flashcards;
    } catch (error) {
      this.logger.error('❌ Flashcard generation failed:', error);
      throw new Error(`Flashcard generation failed: ${error.message}`);
    }
  }

  /**
   * Generate flashcards for all lessons in a video
   */
  async generateFlashcardsForAllLessons(videoId: string): Promise<{ [lesson: string]: Flashcard[] }> {
    this.logger.log(`🃏 Generating flashcards for all lessons in video ${videoId}...`);

    const allFlashcards: { [lesson: string]: Flashcard[] } = {};
    const videoDir = path.join(this.videosDir, videoId);

    // Find all lesson directories
    const dirs = fs.readdirSync(videoDir, { withFileTypes: true });
    const lessonDirs = dirs.filter((dir) => dir.isDirectory() && dir.name.startsWith('lesson_'));

    for (const lessonDir of lessonDirs) {
      const lessonNumber = parseInt(lessonDir.name.replace('lesson_', ''), 10);

      try {
        const flashcards = await this.generateFlashcards(videoId, lessonNumber);
        allFlashcards[`lesson_${lessonNumber}`] = flashcards;
      } catch (error) {
        this.logger.error(`Failed to generate flashcards for lesson ${lessonNumber}:`, error.message);
      }
    }

    return allFlashcards;
  }

  /**
   * Create enhanced flashcards using LLM
   */
  private async createEnhancedFlashcards(vocabulary: any[], lessonContext: any): Promise<Flashcard[]> {
    this.logger.log('📝 Creating LLM-enhanced flashcards...');

    const prompt = PromptTemplate.fromTemplate(`
You are creating vocabulary flashcards for Thai college students learning English. 
ALL explanations must be in Thai language.

Lesson Title: {lessonTitle}
Vocabulary Words: {vocabularyWords}

For each word, create a comprehensive flashcard with:
1. word: The English word
2. definition: Clear English definition of the word
3. thaiDefinition: Thai translation of the definition (detailed explanation in Thai)
4. thaiTranslation: Simple Thai translation (single word or short phrase)
5. pronunciation: Thai phonetic pronunciation (easy for Thais to read)
6. phonetic: IPA or simplified phonetic notation
7. memoryHook: Creative Thai memory technique using Thai phonetics, visual associations, or cultural references - IN THAI
8. contextExample: Practical example sentence using REAL Thai locations/situations - IN ENGLISH with Thai explanation
9. partOfSpeech: noun/verb/adjective/adverb/etc.
10. difficulty: easy/medium/hard (based on Thai learners' perspective)

CRITICAL REQUIREMENTS:
- All explanations and memory hooks must be in Thai
- Pronunciation must be written in Thai script (ออกเสียง)
- Use authentic Thai contexts in examples (TRUE Coffee, BTS, Big C, Central World, etc.)
- Make memory hooks fun and culturally relevant

Examples of good pronunciation guides:
- "recommend" → "เรค-คอม-เมนด์" or "เร-คะ-เมนด์"
- "vegetarian" → "เว-จิ-แท-เรียน" or "เวจ-จี้-แท-เรี่ยน"
- "restaurant" → "เรส-เตอ-รองต์" or "เรส-เท่อ-ร้อนท์"

Examples of good definitions:
- "recommend" → definition: "to suggest that someone or something would be good or suitable for a particular purpose"
- "vegetarian" → definition: "a person who does not eat meat or fish, or a diet that does not include meat or fish"

Examples of good memory hooks (in Thai):
- "coffee" → "คอฟฟี่ เสียงเหมือน 'กบเฟี้ย' นึกถึงกบที่ดื่มกาแฟที่ TRUE Coffee"
- "hotel" → "โฮเทล เสียงเหมือน 'โห เทล' คิดว่า 'โห! Novotel ใหญ่จัง'"

Return ONLY valid JSON array:
[
  {{
    "word": "English word",
    "definition": "Clear English definition",
    "thaiDefinition": "คำนิยามภาษาไทยที่อธิบายความหมายอย่างละเอียด",
    "thaiTranslation": "คำแปลภาษาไทย",
    "pronunciation": "การออกเสียงเป็นไทย",
    "phonetic": "/ˈfəʊnətɪk/ or simplified",
    "memoryHook": "เทคนิคการจำเป็นภาษาไทย",
    "contextExample": "English example sentence - คำอธิบายภาษาไทย",
    "partOfSpeech": "noun",
    "difficulty": "easy"
  }}
]
`);

    const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());

    const result = await chain.invoke({
      lessonTitle: lessonContext?.title || 'English Lesson',
      vocabularyWords: vocabulary.map((v) => `${v.word} (${v.thaiTranslation})`).join(', '),
    });

    try {
      const flashcards = JSON.parse(this.cleanJsonResponse(result));

      // Validate and enrich flashcards
      return flashcards.map((card: any) => ({
        word: card.word || '',
        definition: card.definition || '',
        thaiDefinition: card.thaiDefinition || '',
        thaiTranslation: card.thaiTranslation || '',
        pronunciation: card.pronunciation || '',
        phonetic: card.phonetic || '',
        memoryHook: card.memoryHook || '',
        contextExample: card.contextExample || '',
        partOfSpeech: card.partOfSpeech || 'noun',
        difficulty: card.difficulty || 'medium',
      }));
    } catch (parseError) {
      this.logger.error('Failed to parse LLM flashcards response:', parseError);

      // Fallback: create basic flashcards from vocabulary
      return vocabulary.map((v) => ({
        word: v.word,
        definition: '',
        thaiDefinition: '',
        thaiTranslation: v.thaiTranslation || '',
        pronunciation: this.generateBasicPronunciation(v.word),
        phonetic: '',
        memoryHook: v.memoryHook || '',
        contextExample: v.contextExample || '',
        partOfSpeech: 'noun',
        difficulty: 'medium' as const,
      }));
    }
  }

  /**
   * Generate basic Thai pronunciation for English words (fallback)
   */
  private generateBasicPronunciation(word: string): string {
    // Simple phonetic mapping for common patterns
    const pronunciationMap: { [key: string]: string } = {
      recommend: 'เรค-คอม-เมนด์',
      vegetarian: 'เว-จิ-แท-เรียน',
      restaurant: 'เรส-เตอ-รองต์',
      recommendation: 'เรค-คะ-เมน-เด-ชัน',
      hotel: 'โฮ-เทล',
      coffee: 'คอฟ-ฟี่',
      station: 'สเต-ชัน',
      shopping: 'ช็อป-ปิ้ง',
    };

    return pronunciationMap[word.toLowerCase()] || word;
  }

  /**
   * Clean JSON response from LLM
   */
  private cleanJsonResponse(response: string): string {
    let cleaned = response.trim();

    // Remove markdown code block markers
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // Remove leading text, keep only JSON part
    const jsonStartIndex = cleaned.search(/[[{]/);
    if (jsonStartIndex > 0) {
      cleaned = cleaned.substring(jsonStartIndex);
    }

    // Remove trailing text
    const jsonEndIndex = cleaned.lastIndexOf('}') + 1;
    const bracketEndIndex = cleaned.lastIndexOf(']') + 1;
    const endIndex = Math.max(jsonEndIndex, bracketEndIndex);

    if (endIndex > 0) {
      cleaned = cleaned.substring(0, endIndex);
    }

    return cleaned;
  }

  /**
   * Configuration methods
   */
  updateConfig(newConfig: Partial<FlashcardConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig() {
    return {
      enabled: this.config.enabled,
      maxRetries: this.config.maxRetries,
      timeoutMs: this.config.timeoutMs,
    };
  }

  /**
   * Get flashcards for a specific lesson
   */
  async getFlashcards(videoId: string, lessonNumber: number): Promise<Flashcard[]> {
    const lessonDir = path.join(this.videosDir, videoId, `lesson_${lessonNumber}`);
    const flashcardsPath = path.join(lessonDir, 'flashcards.json');

    if (!fs.existsSync(flashcardsPath)) {
      // Generate flashcards if they don't exist
      return this.generateFlashcards(videoId, lessonNumber);
    }

    const flashcardsData = JSON.parse(fs.readFileSync(flashcardsPath, 'utf8'));
    return flashcardsData.flashcards || [];
  }
}
