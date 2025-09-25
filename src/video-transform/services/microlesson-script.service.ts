import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { LLMEnhancedMicrolessonService } from './llm-enhanced-microlesson.service';

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

  constructor(private readonly llmEnhancedService: LLMEnhancedMicrolessonService) {}

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

    // Use LLM approach for content generation
    console.log('🚀 Using LLM approach for microlesson generation...');

    const llmResults = await this.llmEnhancedService.generateEnhancedMicrolessonScript(analysis.videoId || 'unknown', analysis);

    const learningObjectives = llmResults.enhancedObjectives;
    const keyVocabulary = llmResults.enhancedVocabulary;
    const comprehensionQuestions = llmResults.enhancedQuestions;

    // Extract enhanced grammar points (2-5 items) - use template-based for structure consistency
    const grammarPoints = this.extractEnhancedGrammarPoints(analysis);

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
      'Business English': 'ภาษาอังกฤษธุรกิจ',
      'Travel English': 'ภาษาอังกฤษสำหรับการเดินทาง',
      'Hotel English': 'ภาษาอังกฤษสำหรับโรงแรม',
      'Restaurant English': 'ภาษาอังกฤษสำหรับร้านอาหาร',
    };

    // Try exact match first
    for (const [englishPattern, thaiTitle] of Object.entries(titleMappings)) {
      if (englishTitle.includes(englishPattern)) {
        return thaiTitle;
      }
    }

    // Fallback: create basic Thai translation
    let thaiTitle = englishTitle;
    thaiTitle = thaiTitle.replace(/English/g, 'ภาษาอังกฤษ');
    thaiTitle = thaiTitle.replace(/Conversation/g, 'การสนทนา');
    thaiTitle = thaiTitle.replace(/Practice/g, 'การฝึกฝน');
    thaiTitle = thaiTitle.replace(/Listening/g, 'การฟัง');
    thaiTitle = thaiTitle.replace(/Learning/g, 'การเรียนรู้');

    return thaiTitle;
  }

  private extractEnhancedGrammarPoints(analysis: LessonAnalysis): any[] {
    const grammarPoints: any[] = [];

    // Extract from existing grammar points if available
    if (analysis.grammarPoints && analysis.grammarPoints.length > 0) {
      for (const point of analysis.grammarPoints.slice(0, 5)) {
        grammarPoints.push({
          structure: point.structure || point.topic || 'Grammar Point',
          explanation: point.explanation || point.description || 'Important grammar structure for communication',
          thaiExplanation: point.thaiExplanation || this.translateGrammarExplanation(point.explanation || point.description),
          examples: point.examples || [`Example: ${point.structure || 'structure'} in use`],
        });
      }
    }

    // Add common grammar points if not enough
    if (grammarPoints.length < 2) {
      const commonGrammarPoints = [
        {
          structure: 'Present Simple Tense',
          explanation: 'Used for habits, facts, and general truths',
          thaiExplanation: 'ใช้สำหรับนิสัย ข้อเท็จจริง และความจริงทั่วไป',
          examples: ['I go to work every day', 'The sun rises in the east', 'She speaks English well'],
        },
        {
          structure: 'Modal Verbs (Can/Could/Would)',
          explanation: 'Used for requests, possibilities, and polite expressions',
          thaiExplanation: 'ใช้สำหรับการขอร้อง ความเป็นไปได้ และการแสดงออกอย่างสุภาพ',
          examples: ['Can you help me?', 'Could you please speak slowly?', 'Would you like some coffee?'],
        },
        {
          structure: 'Question Formation',
          explanation: 'How to form questions in English conversations',
          thaiExplanation: 'วิธีการตั้งคำถามในการสนทนาภาษาอังกฤษ',
          examples: ['What time is it?', 'Where is the bathroom?', 'How much does this cost?'],
        },
        {
          structure: 'Prepositions of Place and Time',
          explanation: 'Common prepositions used in daily situations',
          thaiExplanation: 'คำบุพบทที่ใช้บ่อยในสถานการณ์ประจำวัน',
          examples: ['at the restaurant', 'in the morning', 'on Monday', 'next to the bank'],
        },
      ];

      grammarPoints.push(...commonGrammarPoints.slice(0, 5 - grammarPoints.length));
    }

    return grammarPoints.slice(0, 5);
  }

  private translateGrammarExplanation(explanation: string): string {
    if (!explanation) return 'โครงสร้างไวยากรณ์สำคัญสำหรับการสื่อสาร';

    // Simple translation mappings
    const translations: { [key: string]: string } = {
      'present tense': 'กาลปัจจุบัน',
      'past tense': 'กาลอดีต',
      'future tense': 'กาลอนาคต',
      'modal verbs': 'กริยาช่วย',
      questions: 'คำถาม',
      prepositions: 'คำบุพบท',
      adjectives: 'คำคุณศัพท์',
      adverbs: 'คำกริยาวิเศษณ์',
    };

    let thaiExplanation = explanation.toLowerCase();
    for (const [english, thai] of Object.entries(translations)) {
      thaiExplanation = thaiExplanation.replace(new RegExp(english, 'g'), thai);
    }

    return thaiExplanation;
  }

  private createSeriesInfo(analysis: LessonAnalysis): any {
    const seriesStructure = analysis.seriesStructure;

    return {
      seriesTitle: seriesStructure.seriesTitle || 'English Learning Series',
      seriesTitleTh: this.translateSeriesTitle(seriesStructure.seriesTitle),
      episodeNumber: seriesStructure.episodeNumber || 1,
      totalEpisodes: seriesStructure.totalEpisodes || 4,
      description: seriesStructure.description || 'A comprehensive English learning series for Thai students',
      descriptionTh: this.translateSeriesDescription(seriesStructure.description),
    };
  }

  private translateSeriesTitle(englishTitle: string): string {
    if (!englishTitle) return 'หลักสูตรการเรียนภาษาอังกฤษ';

    const titleMappings: { [key: string]: string } = {
      'Everyday English Mastery': 'การเรียนรู้ภาษาอังกฤษในชีวิตประจำวัน',
      'Business English Course': 'หลักสูตรภาษาอังกฤษธุรกิจ',
      'Travel English Guide': 'คู่มือภาษาอังกฤษสำหรับการเดินทาง',
      'English for Beginners': 'ภาษาอังกฤษสำหรับผู้เริ่มต้น',
    };

    // Try to find exact match
    for (const [pattern, translation] of Object.entries(titleMappings)) {
      if (englishTitle.includes(pattern)) {
        return translation;
      }
    }

    // Create basic translation
    return `หลักสูตรการเรียนภาษาอังกฤษ: ${englishTitle}`;
  }

  private translateSeriesDescription(englishDesc: string): string {
    if (!englishDesc) return 'หลักสูตรการเรียนภาษาอังกฤษสำหรับนักเรียนไทย';

    // Simple translation for common terms
    let thaiDesc = englishDesc;
    thaiDesc = thaiDesc.replace(/comprehensive/g, 'ครอบคลุม');
    thaiDesc = thaiDesc.replace(/English/g, 'ภาษาอังกฤษ');
    thaiDesc = thaiDesc.replace(/students/g, 'นักเรียน');
    thaiDesc = thaiDesc.replace(/learning/g, 'การเรียนรู้');
    thaiDesc = thaiDesc.replace(/conversation/g, 'การสนทนา');
    thaiDesc = thaiDesc.replace(/practical/g, 'ปฏิบัติ');

    return thaiDesc;
  }
}
