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
      console.error('❌ LLM enhancement failed:', error);
      throw new Error(`LLM microlesson generation failed: ${error.message}`);
    }
  }

  private async generateEnhancedTitles(lessonAnalysis: any): Promise<{ title: string; titleTh: string }> {
    console.log('📝 Generating LLM-enhanced microlesson titles...');

    const prompt = PromptTemplate.fromTemplate(`
You are creating focused, engaging titles for 5-minute English microlessons for Thai college students.

Original lesson: "{originalTitle}"
Key topics: {keyTopics}
Target vocabulary: {vocabulary}

Create a microlesson title pair that includes:
1. English title (5-8 words, specific and actionable)
2. Thai translation (natural and engaging for university students)

Requirements for English title:
- Specific and actionable (not just "English Conversation")
- Mentions the practical skill being taught
- Appeals to Thai university students
- Indicates it's a quick, focused lesson

Requirements for Thai title:
- Natural, engaging Thai translation
- Keep educational terminology accurate
- Make it appealing to Thai university students
- Use modern Thai language

Examples:
- English: "Ordering Coffee in English Like a Pro" → Thai: "สั่งกาแฟเป็นภาษาอังกฤษแบบมืออาชีพ"
- English: "Hotel Check-in Conversations Made Easy" → Thai: "การสนทนาเช็คอินโรงแรมแบบง่ายๆ"
- English: "Restaurant English: From Menu to Payment" → Thai: "ภาษาอังกฤษร้านอาหาร: จากเมนูถึงการจ่ายเงิน"

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
3. 2-3 Thai context examples with REAL Thai locations and brands
4. Thai pronunciation guides  
5. 3-4 summary points

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
2. Creative Thai memory hook/mnemonic using Thai phonetics or cultural references
3. Practical context example using REAL Thai locations/situations

Use these authentic Thai contexts in examples:
- Shopping: "I need this at Big C/Lotus/Central World"
- Food: "Can I order this at 7-Eleven/Terminal 21 Food Court?" 
- Transport: "Take the BTS to Siam/MRT to Chatuchak"
- Coffee: "I'll have this at TRUE Coffee/Café Amazon"
- University: "We studied this at Chula/Thammasat/Mahidol"

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
4. Use REAL Thai locations and scenarios

Include specific Thai contexts:
- "How would you order at TRUE Coffee in English?"
- "What would you say when shopping at Big C?"
- "How do you ask for directions to BTS Siam?"
- "What questions would you ask at Novotel reception?"
- "How do you complain about food at Terminal 21?"

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

Use Thai phonetic similarities, visual associations, or cultural connections with Thai brands/places.
Examples:
- "coffee" = "คอฟฟี่ = เสียงเหมือน 'กบเฟี้ย' (กบที่ไปซื้อ TRUE Coffee)"
- "hotel" = "โฮเทล = 'โห เทล' (โห! Novotel ใหญ่จัง)"
- "shopping" = "ช็อปปิ้ง = 'ช้อป ปิง' (ช้อปที่ Central ปิงออกมา)"
- "station" = "สเตชั่น = 'สแต่ ชั่น' (สแต่บให้รีบไป BTS Siam ชั่นโมง)"

Include Thai cultural references and real places Thais know.

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
