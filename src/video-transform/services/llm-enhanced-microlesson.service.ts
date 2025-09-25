import { Injectable } from '@nestjs/common';
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

    console.log('🤖 Generating LLM-enhanced microlesson script...');

    try {
      // 并行生成所有部分 - 纯LLM方案
      const [objectives, vocabulary, questions, memoryHooks] = await Promise.all([
        this.generateEnhancedObjectives(lessonAnalysis),
        this.generateEnhancedVocabulary(lessonAnalysis),
        this.generateEnhancedQuestions(lessonAnalysis),
        this.generateEnhancedMemoryHooks(lessonAnalysis),
      ]);

      return {
        enhancedObjectives: objectives,
        enhancedVocabulary: vocabulary,
        enhancedQuestions: questions,
        enhancedMemoryHooks: memoryHooks,
        errors: [],
      };
    } catch (error) {
      console.error('❌ LLM enhancement failed:', error);
      throw new Error(`LLM microlesson generation failed: ${error.message}`);
    }
  }

  private async generateEnhancedObjectives(lessonAnalysis: any): Promise<any[]> {
    console.log('🎯 Generating LLM-enhanced learning objectives...');

    const prompt = PromptTemplate.fromTemplate(`
You are an expert English teacher creating learning objectives for Thai college students.

Video Content: {title}
Key Topics: {keyTopics}
Vocabulary: {vocabulary}
Target Audience: Thai college students

Create 1-2 enhanced learning objectives that include:
1. Clear statement (English + Thai translation)
2. 5 step-by-step explanations
3. 2-3 Thai context examples with real locations (True Coffee, BTS, Big C, etc.)
4. Thai pronunciation guides
5. 3-4 summary points

Focus on practical, real-world applications in Thailand.

Return ONLY valid JSON in this format:
[
  {{
    "statement": "Master [topic] interactions in English for Thai cultural contexts",
    "statementTh": "เรียนรู้การสื่อสาร[topic]เป็นภาษาอังกฤษในบริบทวัฒนธรรมไทย",
    "stepByStepExplanation": ["1. ...", "2. ...", "3. ...", "4. ...", "5. ..."],
    "thaiContextExamples": [
      {{
        "englishPhrase": "...",
        "thaiContext": "...",
        "situation": "...",
        "memoryHook": "...",
        "pronunciation": "..."
      }}
    ],
    "memoryHooks": ["...", "...", "..."],
    "summaryPoints": ["...", "...", "...", "..."]
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
    console.log('📚 Generating LLM-enhanced vocabulary...');

    const vocabularyList = lessonAnalysis.vocabulary?.slice(0, 12) || [];
    if (vocabularyList.length === 0) return [];

    const prompt = PromptTemplate.fromTemplate(`
You are creating enhanced vocabulary for Thai students learning English.

Vocabulary words: {words}
Context: {context}

For each word, create an enhanced entry with:
1. Thai translation (accurate and natural)
2. Creative Thai memory hook/mnemonic
3. Practical context example for Thailand

Return ONLY valid JSON array:
[
  {{
    "word": "...",
    "thaiTranslation": "...",
    "memoryHook": "เสียงเหมือน... หรือ จำด้วย...",
    "contextExample": "I use ... when [Thai situation]"
  }}
]
`);

    const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());

    const result = await chain.invoke({
      words: vocabularyList.map((v) => v.word).join(', '),
      context: lessonAnalysis.title,
    });

    try {
      return JSON.parse(this.cleanJsonResponse(result));
    } catch (parseError) {
      console.warn('Failed to parse LLM vocabulary response:', parseError);
      throw parseError;
    }
  }

  private async generateEnhancedQuestions(lessonAnalysis: any): Promise<any[]> {
    console.log('❓ Generating LLM-enhanced comprehension questions...');

    const prompt = PromptTemplate.fromTemplate(`
Create 4-5 comprehension questions for Thai students about this lesson:

Title: {title}
Key Topics: {keyTopics}

Each question should:
1. Be practical and applicable to Thailand
2. Include Thai translation
3. Have expected answer
4. Relate to real Thai contexts

Return ONLY valid JSON:
[
  {{
    "question": "How would you...",
    "questionTh": "คุณจะ...อย่างไร?",
    "expectedAnswer": "I would...",
    "context": "..."
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
    console.log('🧠 Generating LLM-enhanced memory hooks...');

    const keyWords = lessonAnalysis.vocabulary?.slice(0, 8).map((v) => v.word) || [];
    if (keyWords.length === 0) return [];

    const prompt = PromptTemplate.fromTemplate(`
Create creative Thai memory hooks for these English words: {words}

Use Thai phonetic similarities, visual associations, or cultural connections.
Examples:
- "coffee" = "คอฟฟี่ = เสียงเหมือน 'กบเฟี้ย' (กบที่ดื่มกาแฟ)"
- "hotel" = "โฮเทล = 'โห เทล' (โห! ที่นี่เทลขนาดนี้)"

Return ONLY a JSON array of strings:
["memory hook 1", "memory hook 2", ...]
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
