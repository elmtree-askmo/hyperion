import { Injectable, Logger } from '@nestjs/common';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { LLMConfigService } from './llm-config.service';

interface LLMEnhancedMicrolessonConfig {
  enabled: boolean;
  maxRetries: number;
  timeoutMs: number;
}

@Injectable()
export class LLMEnhancedMicrolessonService {
  private readonly logger = new Logger(LLMEnhancedMicrolessonService.name);
  private readonly llm;
  private config: LLMEnhancedMicrolessonConfig;

  constructor(private readonly llmConfigService: LLMConfigService) {
    // Get LLM instance from the config service
    this.llm = this.llmConfigService.getLLM();

    // Production configuration - LLM approach
    this.config = {
      enabled: true,
      maxRetries: 2,
      timeoutMs: 30000, // 30 seconds timeout
    };
  }

  async generateEnhancedMicrolessonScript(videoId: string, lessonAnalysis: any): Promise<any> {
    if (!this.config.enabled) {
      throw new Error('LLM enhancement is disabled');
    }

    this.logger.log('🤖 Generating LLM-enhanced microlesson script...');

    try {
      // 并行生成所有部分 - 纯LLM方案，包括标题
      const [titles, objectives, vocabulary, questions, memoryHooks] = await Promise.all([
        this.generateEnhancedTitles(lessonAnalysis),
        this.generateEnhancedObjectives(lessonAnalysis),
        this.generateEnhancedVocabulary(lessonAnalysis),
        this.generateEnhancedQuestions(lessonAnalysis),
        this.generateEnhancedMemoryHooks(lessonAnalysis),
      ]);

      return {
        enhancedTitle: titles.title,
        enhancedTitleTh: titles.titleTh,
        enhancedObjectives: objectives,
        enhancedVocabulary: vocabulary,
        enhancedQuestions: questions,
        enhancedMemoryHooks: memoryHooks,
        errors: [],
      };
    } catch (error) {
      this.logger.error('❌ LLM enhancement failed:', error);
      throw new Error(`LLM microlesson generation failed: ${error.message}`);
    }
  }

  private async generateEnhancedTitles(lessonAnalysis: any): Promise<{ title: string; titleTh: string }> {
    this.logger.log('📝 Generating LLM-enhanced microlesson titles...');

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
npp
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

    const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());

    const result = await chain.invoke({
      originalTitle: lessonAnalysis.title,
      keyTopics:
        lessonAnalysis.segments
          ?.map((s) => s.keyTopics)
          .flat()
          .slice(0, 5)
          .join(', ') || 'conversation skills',
      vocabulary:
        lessonAnalysis.vocabulary
          ?.slice(0, 5)
          .map((v) => v.word)
          .join(', ') || 'everyday English',
    });

    try {
      const parsedResult = JSON.parse(this.cleanJsonResponse(result));
      return {
        title: parsedResult.title || 'Essential English Skills',
        titleTh: parsedResult.titleTh || 'ทักษะภาษาอังกฤษที่จำเป็น',
      };
    } catch (parseError) {
      console.warn('Failed to parse LLM titles response:', parseError);
      // Fallback titles
      return {
        title: 'Essential English Skills',
        titleTh: 'ทักษะภาษาอังกฤษที่จำเป็น',
      };
    }
  }

  private async generateEnhancedObjectives(lessonAnalysis: any): Promise<any[]> {
    this.logger.log('🎯 Generating LLM-enhanced learning objectives...');

    const prompt = PromptTemplate.fromTemplate(`
You are an expert English teacher creating learning objectives for Thai college students. ALL explanations must be in Thai language, with English only for phrases students need to learn.

Video Content: {title}
Key Topics: {keyTopics}
Vocabulary: {vocabulary}
Target Audience: Thai college students (early English learners)

Create 1-2 enhanced learning objectives that include:
1. Clear statement in Thai with English phrase to learn
2. 5 step-by-step explanations in Thai language
3. 2-3 Thai context examples with REAL Thai locations and brands
4. Thai pronunciation guides for English phrases
5. 3-4 summary points in Thai

CRITICAL: All explanations, instructions, and descriptions must be in Thai. Only the English phrases students need to practice should be in English.

MUST use authentic Thai locations/brands in examples:
- Coffee shops: TRUE Coffee, Amazon Coffee, Café Amazon, Starbucks Siam
- Shopping: Big C, Lotus, Central World, MBK, Chatuchak Market
- Transport: BTS Skytrain, MRT, Airport Rail Link, Grab, Bolt
- Food: 7-Eleven, Family Mart, Terminal 21 Food Court, Or Tor Kor Market
- Hotels: Novotel, Centara, Dusit Thani, Ibis Bangkok
- Universities: Chulalongkorn, Thammasat, Mahidol, Kasetsart

Focus on practical, real-world applications that Thai students actually encounter.

Return ONLY valid JSON in this format:
[
  {{
    "statement": "เรียนรู้การใช้ [English phrase] ในสถานการณ์จริงในประเทศไทย",
    "statementTh": "เรียนรู้การสื่อสารเป็นภาษาอังกฤษในบริบทวัฒนธรรมไทย",
    "stepByStepExplanation": ["1. ขั้นตอนที่ 1 เป็นภาษาไทย...", "2. ขั้นตอนที่ 2 เป็นภาษาไทย...", "3. ขั้นตอนที่ 3 เป็นภาษาไทย...", "4. ขั้นตอนที่ 4 เป็นภาษาไทย...", "5. ขั้นตอนที่ 5 เป็นภาษาไทย..."],
    "thaiContextExamples": [
      {{
        "englishPhrase": "English phrase to learn",
        "thaiContext": "คำอธิบายสถานการณ์เป็นภาษาไทย",
        "situation": "สถานการณ์ที่ใช้เป็นภาษาไทย",
        "memoryHook": "วิธีจำเป็นภาษาไทย",
        "pronunciation": "การออกเสียงเป็นภาษาไทย"
      }}
    ],
    "memoryHooks": ["เทคนิคการจำที่ 1 เป็นภาษาไทย", "เทคนิคการจำที่ 2 เป็นภาษาไทย", "เทคนิคการจำที่ 3 เป็นภาษาไทย"],
    "summaryPoints": ["สรุปประเด็นที่ 1 เป็นภาษาไทย", "สรุปประเด็นที่ 2 เป็นภาษาไทย", "สรุปประเด็นที่ 3 เป็นภาษาไทย", "สรุปประเด็นที่ 4 เป็นภาษาไทย"]
  }}
]
`);

    const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());

    const result = await chain.invoke({
      title: lessonAnalysis.title,
      keyTopics:
        lessonAnalysis.segments
          ?.map((s) => s.keyTopics)
          .flat()
          .join(', ') || '',
      vocabulary:
        lessonAnalysis.vocabulary
          ?.slice(0, 10)
          .map((v) => v.word)
          .join(', ') || '',
    });

    try {
      return JSON.parse(this.cleanJsonResponse(result));
    } catch (parseError) {
      console.warn('Failed to parse LLM objectives response:', parseError);
      throw parseError;
    }
  }

  private async generateEnhancedVocabulary(lessonAnalysis: any): Promise<any[]> {
    this.logger.log('📚 Generating LLM-enhanced vocabulary...');

    // Get ALL vocabulary from the lesson analysis
    const vocabularyList = lessonAnalysis.vocabulary || [];
    if (vocabularyList.length === 0) return [];

    this.logger.log(`📖 Received ${vocabularyList.length} vocabulary words, selecting most relevant for episode`);

    // Get episode context
    const episodeSegments = lessonAnalysis.segments || [];
    const episodeContent = episodeSegments.map((s: any) => s.content).join(' ');
    const keyTopics = episodeSegments
      .map((s: any) => s.keyTopics)
      .flat()
      .join(', ');

    const prompt = PromptTemplate.fromTemplate(`
You are an expert English teacher creating vocabulary entries for Thai college students.

Episode Title: {episodeTitle}
Key Topics: {keyTopics}
Episode Content Summary: {contentSummary}

Vocabulary Words for THIS episode ONLY: {allWords}

IMPORTANT: The vocabulary list provided has been PRE-FILTERED to include ONLY words relevant to THIS specific episode.
You MUST create entries for ALL words in the provided list. Do NOT skip any words. Do NOT add words not in the list.

TASK:
For EACH word in the provided vocabulary list, create an enhanced entry with:
1. Thai translation (accurate and natural)
2. Creative Thai memory hook/mnemonic using Thai phonetics or cultural references - IN THAI
3. Practical context example using REAL Thai locations/situations - IN THAI explanation

CRITICAL REQUIREMENTS:
- Create entries for ALL {wordCount} words provided
- Do NOT skip any words from the list
- Do NOT add words not in the list
- All explanations and memory hooks must be in Thai
- Only the English word and example sentence should be in English
- Each entry must be relevant to THIS specific episode's content

Use these authentic Thai contexts in examples:
- Shopping: "I need this at Big C/Lotus/Central World"
- Food: "Can I order this at 7-Eleven/Terminal 21 Food Court?" 
- Transport: "Take the BTS to Siam/MRT to Chatuchak"
- Coffee: "I'll have this at TRUE Coffee/Café Amazon"
- University: "We studied this at Chula/Thammasat/Mahidol"
- Hotels: "I'd like to book at Novotel/Centara/Ibis Bangkok"
- Restaurants: "May I have the menu at After You/Shabushi/Fuji Restaurant"

Return ONLY valid JSON array with EXACTLY {wordCount} entries (one for each word in the list):
[
  {{
    "word": "English word from the provided list",
    "thaiTranslation": "คำแปลภาษาไทย",
    "memoryHook": "วิธีจำเป็นภาษาไทย เช่น เสียงเหมือน... หรือ จำด้วย...",
    "contextExample": "English example sentence - คำอธิบายสถานการณ์เป็นภาษาไทย"
  }}
]
`);

    const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());

    const result = await chain.invoke({
      episodeTitle: lessonAnalysis.title || 'English Lesson',
      keyTopics: keyTopics || 'English conversation',
      contentSummary: episodeContent.slice(0, 500) + '...', // First 500 chars for context
      allWords: vocabularyList.map((v: any) => v.word).join(', '),
      wordCount: vocabularyList.length,
    });

    try {
      const enhancedVocab = JSON.parse(this.cleanJsonResponse(result));
      this.logger.log(`✅ LLM enhanced ${enhancedVocab.length} vocabulary words (expected ${vocabularyList.length})`);

      // Warn if count doesn't match
      if (enhancedVocab.length !== vocabularyList.length) {
        this.logger.warn(
          `⚠️ LLM returned ${enhancedVocab.length} words but received ${vocabularyList.length} words. ` +
            `Missing: ${vocabularyList
              .filter((v: any) => !enhancedVocab.find((e: any) => e.word === v.word))
              .map((v: any) => v.word)
              .join(', ')}`,
        );
      }

      return enhancedVocab;
    } catch (parseError) {
      console.warn('Failed to parse LLM vocabulary response:', parseError);
      throw parseError;
    }
  }

  private async generateEnhancedQuestions(lessonAnalysis: any): Promise<any[]> {
    this.logger.log('❓ Generating LLM-enhanced comprehension questions...');

    const prompt = PromptTemplate.fromTemplate(`
Create 4-5 comprehension questions for Thai students about this lesson. ALL questions and explanations must be in Thai language.

Title: {title}
Key Topics: {keyTopics}

Each question should:
1. Be practical and applicable to Thailand
2. Question in Thai language with English phrase to practice
3. Expected answer in English with Thai explanation
4. Use REAL Thai locations and scenarios

CRITICAL: Questions and context must be in Thai. Only the English phrases students need to practice should be in English.

Include specific Thai contexts:
- "คุณจะสั่งอาหารที่ TRUE Coffee เป็นภาษาอังกฤษอย่างไร?"
- "คุณจะพูดอะไรเมื่อช้อปปิ้งที่ Big C?"
- "คุณจะถามทางไป BTS สยามอย่างไร?"
- "คุณจะถามอะไรที่แผนกต้อนรับโรงแรม Novotel?"
- "คุณจะร้องเรียนเรื่องอาหารที่ Terminal 21 อย่างไร?"

Return ONLY valid JSON:
[
  {{
    "question": "คำถามเป็นภาษาไทย พร้อมวลี English phrase ที่ต้องฝึก",
    "questionTh": "คำถามเป็นภาษาไทยเต็มรูปแบบ",
    "questionEn": "English translation of the question for reference",
    "expectedAnswer": "English answer - คำอธิบายเป็นภาษาไทย",
    "context": "บริบทและคำอธิบายเป็นภาษาไทย",
    "contextEn": "English translation of the context for reference"
  }}
]
`);

    const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());

    const result = await chain.invoke({
      title: lessonAnalysis.title,
      keyTopics:
        lessonAnalysis.segments
          ?.map((s) => s.keyTopics)
          .flat()
          .slice(0, 5)
          .join(', ') || '',
    });

    try {
      return JSON.parse(this.cleanJsonResponse(result));
    } catch (parseError) {
      console.warn('Failed to parse LLM questions response:', parseError);
      throw parseError;
    }
  }

  private async generateEnhancedMemoryHooks(lessonAnalysis: any): Promise<string[]> {
    this.logger.log('🧠 Generating LLM-enhanced memory hooks...');

    const keyWords = lessonAnalysis.vocabulary?.slice(0, 8).map((v) => v.word) || [];
    if (keyWords.length === 0) return [];

    const prompt = PromptTemplate.fromTemplate(`
Create creative Thai memory hooks for these English words: {words}

ALL memory hooks must be in Thai language. Use Thai phonetic similarities, visual associations, or cultural connections with Thai brands/places.

Examples (all in Thai):
- "coffee" = "คอฟฟี่ เสียงเหมือน 'กบเฟี้ย' - จำได้ว่ากบที่ไปซื้อ TRUE Coffee"
- "hotel" = "โฮเทล เสียงเหมือน 'โห เทล' - โห! Novotel ใหญ่จัง"
- "shopping" = "ช็อปปิ้ง เสียงเหมือน 'ช้อป ปิง' - ช้อปที่ Central แล้วปิงออกมา"
- "station" = "สเตชั่น เสียงเหมือน 'สแต่ ชั่น' - สแต่บให้รีบไป BTS Siam ทุกชั่วโมง"

Include Thai cultural references and real places Thais know. All explanations in Thai.

Return ONLY a JSON array of strings in Thai:
["เทคนิคการจำที่ 1 เป็นภาษาไทย", "เทคนิคการจำที่ 2 เป็นภาษาไทย", ...]
`);

    const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());

    const result = await chain.invoke({
      words: keyWords.join(', '),
    });

    try {
      return JSON.parse(this.cleanJsonResponse(result));
    } catch (parseError) {
      console.warn('Failed to parse LLM memory hooks response:', parseError);
      throw parseError;
    }
  }

  private cleanJsonResponse(response: string): string {
    // 清理LLM响应，确保是有效的JSON
    let cleaned = response.trim();

    // 移除markdown代码块标记
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // 移除开头的解释文字，只保留JSON部分
    const jsonStartIndex = cleaned.search(/[[{]/);
    if (jsonStartIndex > 0) {
      cleaned = cleaned.substring(jsonStartIndex);
    }

    // 移除结尾的额外文字
    const jsonEndIndex = cleaned.lastIndexOf('}') + 1;
    const bracketEndIndex = cleaned.lastIndexOf(']') + 1;
    const endIndex = Math.max(jsonEndIndex, bracketEndIndex);

    if (endIndex > 0) {
      cleaned = cleaned.substring(0, endIndex);
    }

    return cleaned;
  }

  // 配置方法
  updateConfig(newConfig: Partial<LLMEnhancedMicrolessonConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // 获取配置状态
  getConfig() {
    return {
      enabled: this.config.enabled,
      maxRetries: this.config.maxRetries,
      timeoutMs: this.config.timeoutMs,
    };
  }
}
