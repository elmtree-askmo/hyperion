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
      questionEn?: string; // English translation of question for display reference
      expectedAnswer: string;
      context: string;
      contextEn?: string; // English translation of context for display reference
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

    // Extract all generated content from LLM (including enhanced titles)
    const microlessonTitle = llmResults.enhancedTitle || episode.title;
    const titleTh = llmResults.enhancedTitleTh || episode.title; // Simple fallback
    const learningObjectives = llmResults.enhancedObjectives;
    const keyVocabulary = llmResults.enhancedVocabulary;
    const comprehensionQuestions = llmResults.enhancedQuestions;

    // Use LLM-generated grammar points
    const grammarPoints = llmResults.enhancedGrammarPoints || [];

    // Get original segment titles for reference
    const originalSegments = episodeSegments.map((seg) => seg.title);

    // Create series info with episode context and LLM translations
    const seriesInfo = await this.createEpisodeSeriesInfo(analysis, episode);

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

    // Use LLM-generated grammar points
    const grammarPoints = llmResults.enhancedGrammarPoints || [];

    // Get original segment titles for reference
    const originalSegments = analysis.segments.map((seg) => seg.title);

    // Create series info with LLM translations
    const seriesInfo = await this.createSeriesInfo(analysis);

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

  // Removed: extractEnhancedGrammarPoints() - now using LLM-generated grammar points
  // Removed: translateGrammarExplanation() - no longer needed, LLM handles translation

  private async createSeriesInfo(analysis: LessonAnalysis): Promise<any> {
    const seriesStructure = analysis.seriesStructure;

    const baseInfo = {
      seriesTitle: seriesStructure.seriesTitle || 'English Learning Series',
      episodeNumber: seriesStructure.episodeNumber || 1,
      totalEpisodes: seriesStructure.totalEpisodes || 4,
      description: seriesStructure.description || 'A comprehensive English learning series for Thai students',
    };

    // Use LLM to translate series info
    try {
      const translatedInfo = await this.llmEnhancedService.generateSeriesInfoTranslations(baseInfo);
      return translatedInfo;
    } catch (error) {
      this.logger.warn('Failed to generate LLM translations for series info, using simple fallback');
      return {
        ...baseInfo,
        seriesTitleTh: baseInfo.seriesTitle,
        descriptionTh: baseInfo.description,
      };
    }
  }

  // Removed: translateSeriesTitle() - now using LLM translations via generateSeriesInfoTranslations()
  // Removed: translateSeriesDescription() - now using LLM translations
  // Removed: translateEpisodeTitle() - now using LLM translations

  // Removed: extractEpisodeGrammarPoints() - now using LLM-generated grammar points
  // Removed: getEpisodeSpecificGrammar() - no longer needed

  private async createEpisodeSeriesInfo(analysis: LessonAnalysis, episode: any): Promise<any> {
    const seriesStructure = analysis.seriesStructure;

    const baseInfo = {
      seriesTitle: seriesStructure.seriesTitle || 'English Learning Series',
      episodeNumber: episode.episodeNumber,
      totalEpisodes: seriesStructure.episodes?.length || 3,
      description: episode.description || 'A focused microlesson on practical English skills',
    };

    // Use LLM to translate series info
    try {
      const translatedInfo = await this.llmEnhancedService.generateSeriesInfoTranslations(baseInfo);
      return translatedInfo;
    } catch (error) {
      this.logger.warn('Failed to generate LLM translations for episode series info, using simple fallback');
      return {
        ...baseInfo,
        seriesTitleTh: baseInfo.seriesTitle,
        descriptionTh: baseInfo.description,
      };
    }
  }

  // Removed: translateEpisodeDescription() - now using LLM translations
}
