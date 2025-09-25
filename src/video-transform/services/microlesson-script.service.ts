import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ThaiContextEnhancerService } from './thai-context-enhancer.service';

interface LessonAnalysis {
  videoId: string;
  title: string;
  totalDuration: number;
  language: string;
  targetAudience: string;
  analyzedAt: string;
  learningObjectives: any[];
  prerequisites: any[];
  segments: any[];
  seriesStructure: any;
  vocabulary?: any[];
  grammarPoints?: any[];
  culturalContexts?: any[];
  metadata: any;
}

interface MicrolessonScript {
  lesson: {
    title: string;
    titleTh: string;
    duration: number;
    learningObjectives: Array<{
      statement: string;
      statementTh: string;
      stepByStepExplanation: string[];
      thaiContextExamples: Array<{
        englishPhrase: string;
        thaiContext: string;
        situation: string;
        memoryHook: string;
        pronunciation: string;
      }>;
      memoryHooks: string[];
      summaryPoints: string[];
    }>;
    keyVocabulary: Array<{
      word: string;
      thaiTranslation: string;
      memoryHook: string;
      contextExample: string;
    }>;
    grammarPoints: Array<{
      structure: string;
      explanation: string;
      thaiExplanation: string;
      examples: string[];
    }>;
    comprehensionQuestions: Array<{
      question: string;
      questionTh: string;
      expectedAnswer: string;
      context: string;
    }>;
    originalSegments: string[];
  };
  seriesInfo: {
    seriesTitle: string;
    seriesTitleTh: string;
    episodeNumber: number;
    totalEpisodes: number;
    description: string;
    descriptionTh: string;
  };
  audioUrl: null;
}

@Injectable()
export class MicrolessonScriptService {
  private readonly videosDir = path.join(process.cwd(), 'videos');

  constructor(private readonly thaiContextEnhancer: ThaiContextEnhancerService) {}

  async generateMicrolessonScript(videoId: string): Promise<MicrolessonScript> {
    try {
      const scriptPath = path.join(this.videosDir, videoId, 'microlesson_script.json');

      // Check if microlesson script already exists
      if (fs.existsSync(scriptPath)) {
        // Return existing script
        const existingScript: MicrolessonScript = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
        return existingScript;
      }

      // Read the lesson analysis file
      const analysisPath = path.join(this.videosDir, videoId, 'lesson_analysis.json');
      if (!fs.existsSync(analysisPath)) {
        throw new Error(`Lesson analysis not found for video: ${videoId}`);
      }

      const analysisData: LessonAnalysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

      // Generate microlesson script based on analysis
      const microlessonScript = await this.createMicrolessonFromAnalysis(analysisData);

      // Save the generated script
      fs.writeFileSync(scriptPath, JSON.stringify(microlessonScript, null, 2));

      return microlessonScript;
    } catch (error) {
      console.error('Failed to generate microlesson script:', error);
      throw new Error(`Failed to generate microlesson script: ${error.message}`);
    }
  }

  private async createMicrolessonFromAnalysis(analysis: LessonAnalysis): Promise<MicrolessonScript> {
    // Generate Thai title
    const titleTh = await this.generateThaiTitle(analysis.title);

    // Generate learning objectives with Thai context
    const learningObjectives = this.generateLearningObjectives(analysis);

    // Extract enhanced key vocabulary (5-15 words)
    const keyVocabulary = this.extractEnhancedVocabulary(analysis);

    // Extract enhanced grammar points (2-5 items)
    const grammarPoints = this.extractEnhancedGrammarPoints(analysis);

    // Generate enhanced comprehension questions (3-5 items)
    const comprehensionQuestions = this.generateEnhancedComprehensionQuestions(analysis);

    // Get original segment titles
    const originalSegments = analysis.segments.map((seg) => seg.title);

    // Create series info with Thai context
    const seriesInfo = this.createSeriesInfo(analysis);

    return {
      lesson: {
        title: analysis.title,
        titleTh,
        duration: analysis.totalDuration,
        learningObjectives,
        keyVocabulary,
        grammarPoints,
        comprehensionQuestions,
        originalSegments,
      },
      seriesInfo,
      audioUrl: null,
    };
  }

  private async generateThaiTitle(englishTitle: string): Promise<string> {
    // Map common English learning titles to Thai
    const titleMappings: { [key: string]: string } = {
      'Everyday English Conversation Practice': 'การฝึกฝนการสนทนาภาษาอังกฤษในชีวิตประจำวัน',
      'English Listening': 'การฟังภาษาอังกฤษ',
      'AI Prompt Engineering': 'การออกแบบคำสั่ง AI',
      Google: 'กูเกิล',
      Course: 'หลักสูตร',
      Minutes: 'นาที',
    };

    let thaiTitle = englishTitle;
    for (const [eng, thai] of Object.entries(titleMappings)) {
      thaiTitle = thaiTitle.replace(new RegExp(eng, 'gi'), thai);
    }

    // If no mapping found, provide a generic Thai title
    if (thaiTitle === englishTitle) {
      if (englishTitle.toLowerCase().includes('english')) {
        thaiTitle = 'บทเรียนภาษาอังกฤษ: ' + englishTitle;
      } else if (englishTitle.toLowerCase().includes('ai')) {
        thaiTitle = 'บทเรียน AI: ' + englishTitle;
      } else {
        thaiTitle = 'บทเรียน: ' + englishTitle;
      }
    }

    return thaiTitle;
  }

  private generateLearningObjectives(analysis: LessonAnalysis): any[] {
    // Use the first segment for learning objectives (5-minute segment)
    const firstSegment = analysis.segments[0];
    if (firstSegment) {
      // 传递完整的lesson analysis用于动态场景分析
      return this.thaiContextEnhancer.generateLearningObjectives(firstSegment, analysis);
    }

    // Fallback: generate basic objectives from analysis
    return [
      {
        statement: 'Learn key English vocabulary and phrases from this lesson',
        statementTh: 'เรียนรู้คำศัพท์และวลีภาษาอังกฤษที่สำคัญจากบทเรียนนี้',
        stepByStepExplanation: [
          '1. Listen to the audio content carefully',
          '2. Identify key vocabulary words',
          '3. Practice pronunciation',
          '4. Use in context examples',
          '5. Apply in real situations',
        ],
        thaiContextExamples: [],
        memoryHooks: ['Connect new words to familiar Thai concepts'],
        summaryPoints: ['Focus on practical vocabulary', 'Practice pronunciation daily'],
      },
    ];
  }

  private extractEnhancedVocabulary(analysis: LessonAnalysis): any[] {
    const vocabulary: any[] = [];

    // Extract from vocabulary array if available
    if (analysis.vocabulary && analysis.vocabulary.length > 0) {
      const sortedVocab = [...analysis.vocabulary].sort((a, b) => (b.frequency || 1) - (a.frequency || 1)).slice(0, 15);

      for (const vocab of sortedVocab) {
        vocabulary.push({
          word: vocab.word,
          thaiTranslation: vocab.thaiTranslation || '',
          memoryHook: this.generateMemoryHook(vocab.word),
          contextExample: vocab.exampleSentence || `I use ${vocab.word} in daily conversation.`,
        });
      }
    }

    // Extract from key topics if vocabulary is not sufficient
    if (vocabulary.length < 5) {
      const keyTopics = analysis.segments.flatMap((seg) => seg.keyTopics || []);
      const uniqueTopics = [...new Set(keyTopics)];

      // Add Thai context vocabulary
      const thaiContextVocab = this.generateThaiContextVocabularyEnhanced(uniqueTopics);
      vocabulary.push(...thaiContextVocab);
    }

    // Ensure we have 5-15 vocabulary items
    return vocabulary.slice(0, 15);
  }

  private generateThaiContextVocabulary(topics: string[]): string[] {
    const thaiContextMap: { [key: string]: string[] } = {
      coffee: ['coffee shop (ร้านกาแฟ)', 'latte (ลาเต้)', 'americano (อเมริกาโน่)', 'True Coffee (ทรู คอฟฟี่)', 'milk alternatives (ทางเลือกนมอื่น)'],
      restaurant: ['order food (สั่งอาหาร)', 'spicy (เผ็ด)', 'pad thai (ผัดไทย)', 'som tam (ส้มตำ)', 'vegetarian (มังสวิรัติ)'],
      hotel: ['check-in (เช็คอิน)', 'reservation (การจอง)', 'room service (รูมเซอร์วิส)', 'reception (แผนกต้อนรับ)', 'concierge (คอนเซียร์จ)'],
      shopping: ['Big C (บิ๊กซี)', 'Lotus (โลตัส)', '7-Eleven (เซเว่น)', 'market (ตลาด)', 'discount (ส่วนลด)'],
      bank: ['ATM (เอทีเอ็ม)', 'deposit (ฝากเงิน)', 'withdraw (ถอนเงิน)', 'transfer (โอนเงิน)', 'account (บัญชี)'],
    };

    const vocabulary: string[] = [];
    for (const topic of topics) {
      const lowerTopic = topic.toLowerCase();
      for (const [key, values] of Object.entries(thaiContextMap)) {
        if (lowerTopic.includes(key)) {
          vocabulary.push(...values);
        }
      }
    }

    return vocabulary;
  }

  private generateMemoryHook(word: string): string {
    const memoryHooks: { [key: string]: string } = {
      coffee: 'คอฟฟี่ = เสียงเหมือน "กบเฟี้ย" (กบที่ดื่มกาแฟ)',
      hotel: 'โฮเทล = "โห เทล" (โห! ที่นี่เทลขนาดนี้)',
      restaurant: 'เรสเทอรองต์ = "เรส เท่ รอง ต้อง" (รสชาติเท่านี้ รองไม่ได้ ต้องกิน)',
      spicy: 'สไปซี่ = "สไป ซี่" (ไปที่ซี่โครงเผ็ดๆ)',
      vegetarian: 'เวจเทเรียน = "เวจ เท เรียน" (ผักเท่านั้น ต้องเรียนรู้)',
      deposit: 'ดีพอซิต = "ดี พอ ซิต" (ดีพอ นั่งเงินไว้)',
      withdraw: 'วิธดรอ = "วิธ ดรอ" (วิธีดึงเงินออก)',
      recommend: 'เรคคอมเมนด์ = "เรค คอม เมนด์" (เรียกคนมาแนะนำ)',
    };

    return memoryHooks[word.toLowerCase()] || `จำคำว่า ${word} ด้วยการเชื่อมโยงกับประสบการณ์ของตัวเอง`;
  }

  private generateThaiContextVocabularyEnhanced(topics: string[]): any[] {
    const vocabulary: any[] = [];

    const thaiContextMap: { [key: string]: any[] } = {
      coffee: [
        {
          word: 'latte',
          thaiTranslation: 'ลาเต้',
          memoryHook: 'ลาเต้ = ลา + เต้ (ลาที่มีนมเต้า)',
          contextExample: 'I order a hot latte at True Coffee every morning.',
        },
        {
          word: 'americano',
          thaiTranslation: 'อเมริกาโน่',
          memoryHook: 'อเมริกาโน่ = กาแฟดำแบบอเมริกัน',
          contextExample: 'An iced americano is perfect for Bangkok weather.',
        },
      ],
      restaurant: [
        {
          word: 'spicy',
          thaiTranslation: 'เผ็ด',
          memoryHook: 'spicy = เสียงเหมือน "สไปซี่" = ใส่ซี่โครงเผ็ด',
          contextExample: 'Thai food is usually spicy for foreigners.',
        },
      ],
    };

    for (const topic of topics) {
      const lowerTopic = topic.toLowerCase();
      for (const [key, values] of Object.entries(thaiContextMap)) {
        if (lowerTopic.includes(key)) {
          vocabulary.push(...values);
        }
      }
    }

    return vocabulary;
  }

  private extractEnhancedGrammarPoints(analysis: LessonAnalysis): any[] {
    const grammarPoints: any[] = [];

    // Extract from grammar points if available
    if (analysis.grammarPoints && analysis.grammarPoints.length > 0) {
      const selectedGrammar = analysis.grammarPoints.filter((gp) => gp.difficulty === 'basic' || gp.difficulty === 'intermediate').slice(0, 5);

      for (const gp of selectedGrammar) {
        grammarPoints.push({
          structure: gp.structure,
          explanation: gp.description,
          thaiExplanation: gp.thaiExplanation || gp.description,
          examples: gp.examples || [`Example using ${gp.structure}`],
        });
      }
    }

    // Add default grammar points for English learning if needed
    if (grammarPoints.length < 2) {
      grammarPoints.push(
        {
          structure: 'Present Simple Tense',
          explanation: 'Used for habitual actions and general facts',
          thaiExplanation: 'ใช้สำหรับการกระทำที่ทำเป็นประจำและข้อเท็จจริงทั่วไป',
          examples: ['I go to work every day', 'True Coffee opens at 7 AM', 'Bangkok is hot and humid'],
        },
        {
          structure: 'Modal Verbs (Can/Could)',
          explanation: 'Used for polite requests and offers',
          thaiExplanation: 'ใช้สำหรับการขอความช่วยเหลือและเสนอความช่วยเหลืออย่างสุภาพ',
          examples: ['Can you help me?', 'Could you recommend a restaurant?', 'Can I have the menu, please?'],
        },
        {
          structure: 'Wh-Questions',
          explanation: 'Questions starting with what, where, when, how, why',
          thaiExplanation: 'คำถามที่ขึ้นต้นด้วย what, where, when, how, why',
          examples: ['What time does the BTS close?', 'Where is Chatuchak Market?', 'How much does this cost?'],
        },
      );
    }

    return grammarPoints.slice(0, 5);
  }

  private generateEnhancedComprehensionQuestions(analysis: LessonAnalysis): any[] {
    const questions: any[] = [];

    // Generate questions based on segments
    for (const segment of analysis.segments.slice(0, 3)) {
      if (segment.keyTopics && segment.keyTopics.length > 0) {
        const topic = segment.keyTopics[0];

        // Generate Thai context questions
        if (topic.includes('restaurant') || topic.includes('food')) {
          questions.push({
            question: 'What would you order at a Thai restaurant using English?',
            questionTh: 'คุณจะสั่งอะไรที่ร้านอาหารไทยโดยใช้ภาษาอังกฤษ?',
            expectedAnswer: 'I would like to order pad thai, not too spicy please.',
            context: 'Ordering food at a local Thai restaurant with foreign visitors',
          });
          questions.push({
            question: 'How do you ask for "not spicy" in English at a restaurant?',
            questionTh: 'คุณจะขอ "ไม่เผ็ด" เป็นภาษาอังกฤษในร้านอาหารได้อย่างไร?',
            expectedAnswer: 'Not too spicy, please. Medium level is fine.',
            context: 'Explaining spice preference to restaurant staff',
          });
        } else if (topic.includes('coffee') || topic.includes('shop')) {
          questions.push({
            question: 'How would you order coffee with oat milk at True Coffee in English?',
            questionTh: 'คุณจะสั่งกาแฟใส่นมข้าวโอ๊ตที่ True Coffee เป็นภาษาอังกฤษได้อย่างไร?',
            expectedAnswer: "I'd like an iced americano with oat milk, please.",
            context: 'Ordering at a popular Thai coffee chain',
          });
          questions.push({
            question: 'What phrases do you use when paying by credit card?',
            questionTh: 'คุณใช้วลีอะไรเมื่อจ่าย��ินด้วยบัตรเครดิต?',
            expectedAnswer: "I'll pay by card, please. Do you accept Visa?",
            context: 'Completing payment at retail stores',
          });
        } else if (topic.includes('hotel')) {
          questions.push({
            question: 'What information do you need to provide when checking into a hotel?',
            questionTh: 'คุณต้องให้ข้อมูลอะไรบ้างเมื่อเช็คอินที่โรงแรม?',
            expectedAnswer: "I have a reservation under [name]. Here's my passport.",
            context: 'Hotel check-in process in Thailand',
          });
        } else if (topic.includes('daily') || topic.includes('routine')) {
          questions.push({
            question: "Describe a typical Thai student's daily routine in English",
            questionTh: 'บรรยายกิจวัตรประจำวันของนักเรียนไทยเป็นภาษาอังกฤษ',
            expectedAnswer: 'I wake up at 6 AM, take the BTS to university, attend classes, and return home by 6 PM.',
            context: 'Explaining daily life to international friends',
          });
        } else {
          questions.push({
            question: `What key vocabulary did you learn about ${topic}?`,
            questionTh: `คุณเรียนรู้คำศัพท์สำคัญอะไรบ้างเกี่ยวกับ ${topic}?`,
            expectedAnswer: `I learned important words related to ${topic} such as...`,
            context: `Discussing ${topic} in daily conversation`,
          });
        }
      }
    }

    // Add general comprehension questions if needed
    if (questions.length < 3) {
      questions.push(
        {
          question: 'What was the main topic of this lesson?',
          questionTh: 'หัวข้อหลักของบทเรียนนี้คืออะไร?',
          expectedAnswer: 'The main topic was learning English for everyday situations.',
          context: 'Summarizing lesson content',
        },
        {
          question: 'Which vocabulary words can you use in daily life in Thailand?',
          questionTh: 'คำศัพท์ไหนบ้างที่คุณสามารถใช้ในชีวิตประจำวันในประเทศไทย?',
          expectedAnswer: 'I can use these words when shopping, ordering food, and talking to tourists.',
          context: 'Applying learned vocabulary in Thai context',
        },
        {
          question: 'How can you practice these expressions with Thai friends?',
          questionTh: 'คุณจะฝึกใช้วลีเหล่านี้กับเพื่อนไทยได้อย่างไร?',
          expectedAnswer: 'I can role-play situations like ordering food or helping tourists.',
          context: 'Practice strategies with local friends',
        },
      );
    }

    return questions.slice(0, 5);
  }

  private createSeriesInfo(analysis: LessonAnalysis): any {
    const seriesStructure = analysis.seriesStructure;

    return {
      seriesTitle: seriesStructure.seriesTitle || 'English Learning Series',
      seriesTitleTh: this.translateSeriesTitle(seriesStructure.seriesTitle),
      episodeNumber: 1,
      totalEpisodes: seriesStructure.episodes?.length || 1,
      description: seriesStructure.description || 'Comprehensive English learning course for Thai students',
      descriptionTh: this.translateSeriesDescription(seriesStructure.description),
    };
  }

  private translateSeriesTitle(englishTitle: string): string {
    if (!englishTitle) return 'ซีรีส์การเรียนภาษาอังกฤษ';

    const translations: { [key: string]: string } = {
      'Everyday English Mastery': 'การเรียนรู้ภาษาอังกฤษในชีวิตประจำวัน',
      'Service Encounters': 'การสื่อสารในบริการต่างๆ',
      'Daily Routines': 'กิจวัตรประจำวัน',
      'Mastering AI Prompt Engineering': 'การเรียนรู้การออกแบบคำสั่ง AI',
      'Advanced Applications': 'การประยุกต์ใช้ขั้นสูง',
    };

    let thaiTitle = englishTitle;
    for (const [eng, thai] of Object.entries(translations)) {
      thaiTitle = thaiTitle.replace(new RegExp(eng, 'gi'), thai);
    }

    return thaiTitle;
  }

  private translateSeriesDescription(englishDesc: string): string {
    if (!englishDesc) return 'หลักสูตรการเรียนภาษาอังกฤษที่ครอบคลุมสำหรับนักเรียนไทย';

    // Simple keyword-based translation
    let thaiDesc = englishDesc;
    const translations: { [key: string]: string } = {
      comprehensive: 'ครอบคลุม',
      students: 'นักเรียน',
      practical: 'ปпрактical',
      conversation: 'การสนทนา',
      skills: 'ทักษะ',
      vocabulary: 'คำศัพท์',
      fluency: 'ความคล่องแคล่ว',
      'real-world': 'ในโลกแห่งความเป็นจริง',
      everyday: 'ในชีวิตประจำวัน',
    };

    for (const [eng, thai] of Object.entries(translations)) {
      thaiDesc = thaiDesc.replace(new RegExp(eng, 'gi'), thai);
    }

    return `หลักสูตรการเรียนภาษาอังกฤษสำหรับนักเรียนไทย: ${thaiDesc}`;
  }

  async generateMicrolessonForAllVideos(): Promise<{ [videoId: string]: MicrolessonScript }> {
    const results: { [videoId: string]: MicrolessonScript } = {};

    try {
      const videoDirectories = fs
        .readdirSync(this.videosDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      for (const videoId of videoDirectories) {
        try {
          const script = await this.generateMicrolessonScript(videoId);
          results[videoId] = script;
        } catch (error) {
          console.error(`Failed to generate script for video ${videoId}:`, error.message);
        }
      }
    } catch (error) {
      throw new Error(`Failed to process video directories: ${error.message}`);
    }

    return results;
  }
}
