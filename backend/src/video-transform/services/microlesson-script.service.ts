import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(MicrolessonScriptService.name);
  private readonly videosDir = path.join(process.cwd(), 'videos');

  constructor(private readonly llmEnhancedService: LLMEnhancedMicrolessonService) {}

  async generateMicrolessonScript(videoId: string): Promise<MicrolessonScript[]> {
    try {
      // Read the lesson analysis file
      const analysisPath = path.join(this.videosDir, videoId, 'lesson_analysis.json');
      if (!fs.existsSync(analysisPath)) {
        throw new Error(`Lesson analysis not found for video: ${videoId}`);
      }

      const analysisData: LessonAnalysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

      // Generate microlesson scripts for each episode in the series
      const microlessonScripts: MicrolessonScript[] = [];

      if (analysisData.seriesStructure?.episodes) {
        for (const episode of analysisData.seriesStructure.episodes) {
          this.logger.log(`🚀 Generating microlesson script for Episode ${episode.episodeNumber}: ${episode.title}`);

          // Create episode directory path
          const lessonDir = path.join(this.videosDir, videoId, `lesson_${episode.episodeNumber.toString()}`);
          const scriptPath = path.join(lessonDir, 'microlesson_script.json');

          // Check if episode script already exists
          if (fs.existsSync(scriptPath)) {
            this.logger.log(`📖 Loading existing script for Episode ${episode.episodeNumber}`);
            const existingScript: MicrolessonScript = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
            microlessonScripts.push(existingScript);
            continue;
          }

          // Generate microlesson script for this episode
          const microlessonScript = await this.createMicrolessonFromEpisode(analysisData, episode);

          // Ensure episode directory exists
          if (!fs.existsSync(lessonDir)) {
            fs.mkdirSync(lessonDir, { recursive: true });
          }

          // Save the generated script
          fs.writeFileSync(scriptPath, JSON.stringify(microlessonScript, null, 2));

          microlessonScripts.push(microlessonScript);
        }
      } else {
        // Fallback to old behavior if no series structure
        this.logger.log('⚠️ No series structure found, generating single microlesson script');
        const singleScript = await this.generateSingleMicrolessonScript(videoId, analysisData);
        microlessonScripts.push(singleScript);
      }

      return microlessonScripts;
    } catch (error) {
      this.logger.error('Failed to generate microlesson scripts:', error);
      throw new Error(`Failed to generate microlesson scripts: ${error.message}`);
    }
  }

  async generateSingleMicrolessonScript(videoId: string, analysisData?: LessonAnalysis): Promise<MicrolessonScript> {
    try {
      const scriptPath = path.join(this.videosDir, videoId, 'microlesson_script.json');

      // Check if microlesson script already exists
      if (fs.existsSync(scriptPath)) {
        // Return existing script
        const existingScript: MicrolessonScript = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
        return existingScript;
      }

      // Read the lesson analysis file if not provided
      if (!analysisData) {
        const analysisPath = path.join(this.videosDir, videoId, 'lesson_analysis.json');
        if (!fs.existsSync(analysisPath)) {
          throw new Error(`Lesson analysis not found for video: ${videoId}`);
        }
        analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
      }

      // Generate microlesson script based on analysis
      const microlessonScript = await this.createMicrolessonFromAnalysis(analysisData);

      // Save the generated script
      fs.writeFileSync(scriptPath, JSON.stringify(microlessonScript, null, 2));

      return microlessonScript;
    } catch (error) {
      this.logger.error('Failed to generate single microlesson script:', error);
      throw new Error(`Failed to generate single microlesson script: ${error.message}`);
    }
  }

  private async createMicrolessonFromEpisode(analysis: LessonAnalysis, episode: any): Promise<MicrolessonScript> {
    // Calculate target duration for this episode (based on estimated time)
    const targetDuration = episode.estimatedTime * 60; // Convert minutes to seconds

    // Get segments for this episode
    const episodeSegments = analysis.segments.filter((segment) => episode.segments.includes(segment.id));

    // Use LLM approach for content generation including title
    this.logger.log(`🚀 Using LLM approach for Episode ${episode.episodeNumber} microlesson generation...`);

    // Create focused analysis for this episode
    // Extract segment IDs for this episode
    const episodeSegmentIds = episodeSegments.map((seg) => seg.id);

    // Filter content using LLM-provided segment mappings (much more accurate than string matching!)
    const episodeVocabulary =
      analysis.vocabulary?.filter((vocab) => {
        // If segments are mapped by LLM, use that mapping
        if (vocab.segments && vocab.segments.length > 0) {
          return vocab.segments.some((segId) => episodeSegmentIds.includes(segId));
        }
        // Fallback: include all vocabulary if no mapping exists
        return true;
      }) || [];

    const episodeGrammarPoints =
      analysis.grammarPoints?.filter((grammar) => {
        if (grammar.segments && grammar.segments.length > 0) {
          return grammar.segments.some((segId) => episodeSegmentIds.includes(segId));
        }
        return true;
      }) || [];

    const episodeCulturalContexts =
      analysis.culturalContexts?.filter((context) => {
        if (context.segments && context.segments.length > 0) {
          return context.segments.some((segId) => episodeSegmentIds.includes(segId));
        }
        return true;
      }) || [];

    this.logger.log(
      `🎯 Episode ${episode.episodeNumber} filtered content (via LLM segment mapping): ${episodeVocabulary.length} vocab, ${episodeGrammarPoints.length} grammar points, ${episodeCulturalContexts.length} cultural contexts`,
    );

    // Create focused analysis containing ONLY this episode's content
    const episodeAnalysis = {
      videoId: analysis.videoId,
      title: episode.title,
      language: analysis.language,
      targetAudience: analysis.targetAudience,
      segments: episodeSegments,
      learningObjectives: analysis.learningObjectives.filter((obj) => episode.objectives.includes(obj.id)),
      // Only pass content relevant to THIS episode's segments
      vocabulary: episodeVocabulary,
      grammarPoints: episodeGrammarPoints,
      culturalContexts: episodeCulturalContexts,
      // Episode-specific prerequisites (from its learning objectives)
      prerequisites: analysis.prerequisites?.filter((prereq) => episodeSegments.some((seg) => seg.prerequisites?.includes(prereq.id))) || [],
    };

    const llmResults = await this.llmEnhancedService.generateEnhancedMicrolessonScript(analysis.videoId || 'unknown', episodeAnalysis);

    // Extract all generated content
    const microlessonTitle = episode.title;
    const titleTh = this.translateEpisodeTitle(episode.title);
    const learningObjectives = llmResults.enhancedObjectives;
    const keyVocabulary = llmResults.enhancedVocabulary;
    const comprehensionQuestions = llmResults.enhancedQuestions;

    // Extract enhanced grammar points for this episode
    const grammarPoints = this.extractEpisodeGrammarPoints(episodeAnalysis);

    // Get original segment titles for reference
    const originalSegments = episodeSegments.map((seg) => seg.title);

    // Create series info with episode context
    const seriesInfo = this.createEpisodeSeriesInfo(analysis, episode);

    return {
      lesson: {
        title: microlessonTitle,
        titleTh,
        duration: targetDuration,
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

  private async createMicrolessonFromAnalysis(analysis: LessonAnalysis): Promise<MicrolessonScript> {
    // Calculate target duration for microlesson (5 minutes)
    const targetDuration = 300; // 5 minutes in seconds

    // Use LLM approach for content generation including title
    this.logger.log('🚀 Using LLM approach for microlesson generation...');

    const llmResults = await this.llmEnhancedService.generateEnhancedMicrolessonScript(analysis.videoId || 'unknown', analysis);

    // Extract all generated content
    const microlessonTitle = llmResults.enhancedTitle;
    const titleTh = llmResults.enhancedTitleTh;
    const learningObjectives = llmResults.enhancedObjectives;
    const keyVocabulary = llmResults.enhancedVocabulary;
    const comprehensionQuestions = llmResults.enhancedQuestions;

    // Extract enhanced grammar points (2-5 items) - use template-based for structure consistency
    const grammarPoints = this.extractEnhancedGrammarPoints(analysis);

    // Get original segment titles for reference
    const originalSegments = analysis.segments.map((seg) => seg.title);

    // Create series info with Thai context
    const seriesInfo = this.createSeriesInfo(analysis);

    return {
      lesson: {
        title: microlessonTitle,
        titleTh,
        duration: targetDuration,
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

  private translateEpisodeTitle(englishTitle: string): string {
    if (!englishTitle) return 'บทเรียนภาษาอังกฤษ';

    const titleTranslations: { [key: string]: string } = {
      'Service Industry Essentials': 'พื้นฐานอุตสาหกรรมบริการ',
      'Hotels & Restaurants': 'โรงแรมและร้านอาหาร',
      'Everyday Transactions': 'การทำธุรกรรมประจำวัน',
      'Libraries, Banks & Bookstores': 'ห้องสมุด ธนาคาร และร้านหนังสือ',
      'Daily Life & Decision Making': 'ชีวิตประจำวันและการตัดสินใจ',
      'Shopping & Routines': 'การช้อปปิ้งและกิจวัตรประจำวัน',
    };

    // Try exact matches first
    for (const [pattern, translation] of Object.entries(titleTranslations)) {
      if (englishTitle.includes(pattern)) {
        return englishTitle.replace(pattern, translation);
      }
    }

    // Basic word replacements
    let thaiTitle = englishTitle;
    thaiTitle = thaiTitle.replace(/Service/g, 'บริการ');
    thaiTitle = thaiTitle.replace(/Industry/g, 'อุตสาหกรรม');
    thaiTitle = thaiTitle.replace(/Essentials/g, 'พื้นฐาน');
    thaiTitle = thaiTitle.replace(/Hotels/g, 'โรงแรม');
    thaiTitle = thaiTitle.replace(/Restaurants/g, 'ร้านอาหาร');
    thaiTitle = thaiTitle.replace(/Everyday/g, 'ประจำวัน');
    thaiTitle = thaiTitle.replace(/Transactions/g, 'ธุรกรรม');
    thaiTitle = thaiTitle.replace(/Daily Life/g, 'ชีวิตประจำวัน');
    thaiTitle = thaiTitle.replace(/Decision Making/g, 'การตัดสินใจ');
    thaiTitle = thaiTitle.replace(/Shopping/g, 'การช้อปปิ้ง');
    thaiTitle = thaiTitle.replace(/Routines/g, 'กิจวัตร');

    return thaiTitle;
  }

  private extractEpisodeGrammarPoints(episodeAnalysis: any): any[] {
    const grammarPoints: any[] = [];

    // Extract from existing grammar points if available
    if (episodeAnalysis.grammarPoints && episodeAnalysis.grammarPoints.length > 0) {
      for (const point of episodeAnalysis.grammarPoints.slice(0, 3)) {
        grammarPoints.push({
          structure: point.structure || point.topic || 'Grammar Point',
          explanation: point.explanation || point.description || 'Important grammar structure for this episode',
          thaiExplanation: point.thaiExplanation || this.translateGrammarExplanation(point.explanation || point.description),
          examples: point.examples || [`Example: ${point.structure || 'structure'} in use`],
        });
      }
    }

    // Add episode-specific grammar points if not enough
    if (grammarPoints.length < 2) {
      const episodeSpecificGrammar = this.getEpisodeSpecificGrammar(episodeAnalysis);
      grammarPoints.push(...episodeSpecificGrammar.slice(0, 3 - grammarPoints.length));
    }

    return grammarPoints.slice(0, 3);
  }

  private getEpisodeSpecificGrammar(episodeAnalysis: any): any[] {
    // Determine episode focus based on segments
    const segmentTopics = episodeAnalysis.segments.flatMap((seg) => seg.keyTopics || []);

    // Grammar points based on common topics
    const grammarByTopic: { [key: string]: any } = {
      'hotel service': {
        structure: 'Polite Requests with "Can you" and "Could you"',
        explanation: 'Used for making polite requests in service situations',
        thaiExplanation: 'ใช้สำหรับการขอร้องอย่างสุภาพในสถานการณ์บริการ',
        examples: ['Can you recommend a restaurant?', 'Could you arrange a taxi?', 'Can you help me with directions?'],
      },
      restaurant: {
        structure: 'Food Ordering Language with "I would like"',
        explanation: 'Polite way to order food and express preferences',
        thaiExplanation: 'วิธีสุภาพในการสั่งอาหารและแสดงความต้องการ',
        examples: ['I would like the chicken curry', 'I would like it not too spicy', 'I would like to order drinks first'],
      },
      'daily routines': {
        structure: 'Present Simple for Daily Habits',
        explanation: 'Used to describe regular activities and routines',
        thaiExplanation: 'ใช้บรรยายกิจกรรมปกติและกิจวัตรประจำวัน',
        examples: ['I wake up at 6 AM', 'She goes to work by bus', 'We have dinner together every evening'],
      },
      bank: {
        structure: 'Transaction Language with "I want to" and "I need to"',
        explanation: 'Expressing needs and wants in formal transactions',
        thaiExplanation: 'การแสดงความต้องการในการทำธุรกรรมอย่างเป็นทางการ',
        examples: ['I want to deposit a check', 'I need to check my balance', 'I want to open an account'],
      },
    };

    const relevantGrammar = [];
    for (const topic of segmentTopics) {
      for (const [key, grammar] of Object.entries(grammarByTopic)) {
        if (topic.toLowerCase().includes(key) && !relevantGrammar.find((g) => g.structure === grammar.structure)) {
          relevantGrammar.push(grammar);
        }
      }
    }

    // Add default grammar if none found
    if (relevantGrammar.length === 0) {
      relevantGrammar.push({
        structure: 'Question Formation in English',
        explanation: 'How to ask questions in everyday conversations',
        thaiExplanation: 'วิธีการตั้งคำถามในการสนทนาประจำวัน',
        examples: ['What time is it?', 'Where is the bathroom?', 'How much does this cost?'],
      });
    }

    return relevantGrammar;
  }

  private createEpisodeSeriesInfo(analysis: LessonAnalysis, episode: any): any {
    const seriesStructure = analysis.seriesStructure;

    return {
      seriesTitle: seriesStructure.seriesTitle || 'English Learning Series',
      seriesTitleTh: this.translateSeriesTitle(seriesStructure.seriesTitle),
      episodeNumber: episode.episodeNumber,
      totalEpisodes: seriesStructure.episodes?.length || 3,
      description: episode.description || 'A focused microlesson on practical English skills',
      descriptionTh: this.translateEpisodeDescription(episode.description),
    };
  }

  private translateEpisodeDescription(englishDesc: string): string {
    if (!englishDesc) return 'บทเรียนสั้นที่เน้นทักษะภาษาอังกฤษเชิงปฏิบัติ';

    // Basic translation patterns
    let thaiDesc = englishDesc;
    thaiDesc = thaiDesc.replace(/Learn to navigate/g, 'เรียนรู้การจัดการ');
    thaiDesc = thaiDesc.replace(/Practice common/g, 'ฝึกฝน');
    thaiDesc = thaiDesc.replace(/Develop vocabulary/g, 'พัฒนาคำศัพท์');
    thaiDesc = thaiDesc.replace(/hotel services/g, 'บริการโรงแรม');
    thaiDesc = thaiDesc.replace(/restaurant/g, 'ร้านอาหาร');
    thaiDesc = thaiDesc.replace(/dietary preferences/g, 'ความต้องการด้านอาหาร');
    thaiDesc = thaiDesc.replace(/service transactions/g, 'การทำธุรกรรมบริการ');
    thaiDesc = thaiDesc.replace(/grocery shopping/g, 'การซื้อของในซูเปอร์มาร์เก็ต');
    thaiDesc = thaiDesc.replace(/daily routines/g, 'กิจวัตรประจำวัน');

    return thaiDesc;
  }
}
