/**
 * Lesson data types for video generation
 */

export interface SegmentTiming {
  startTime: number;
  endTime: number;
  duration: number;
  screenElement: ScreenElementType;
  audioUrl: string;
  text: string;
  vocabWord?: string;
  backgroundUrl?: string;
}

export type ScreenElementType = 'title_card' | 'objective_card' | 'vocabulary_card' | 'grammar_card' | 'practice_card' | 'outro_card';

export interface FinalSynchronizedLesson {
  lesson: {
    segmentBasedTiming: SegmentTiming[];
  };
  audioUrl: string;
}

export interface VocabularyCard {
  word: string;
  definition: string;
  thaiDefinition: string;
  thaiTranslation: string;
  pronunciation: string;
  phonetic: string;
  memoryHook: string;
  contextExample: string;
  partOfSpeech: string;
  difficulty: string;
}

export interface FlashcardsData {
  flashcards: VocabularyCard[];
}

export interface TextPart {
  text: string;
  language: 'th' | 'en';
  speakingRate?: number; // Default: th=1.0, en=0.8
  englishTranslation?: string; // English reference translation for Thai text (for display only, not spoken)
}

export interface AudioSegment {
  id: string;
  text: string; // Full text for display and backward compatibility
  textParts?: TextPart[]; // Separated Thai and English parts for TTS
  description: string;
  screenElement: ScreenElementType;
  visualDescription: string;
  backgroundImageDescription: string;
}

export interface AudioSegmentsData {
  audioSegments: AudioSegment[];
}

export interface LearningObjective {
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
}

export interface GrammarPoint {
  structure: string;
  explanation: string;
  thaiExplanation: string;
  examples: string[];
}

export interface MicrolessonScript {
  lesson: {
    title: string;
    titleTh: string;
    duration: number;
    learningObjectives: LearningObjective[];
    keyVocabulary: Array<{
      word: string;
      thaiTranslation: string;
      memoryHook: string;
      contextExample: string;
    }>;
    grammarPoints: GrammarPoint[];
    comprehensionQuestions: any[];
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
  audioUrl: string | null;
}

export interface VideoGenerationInput {
  lessonPath: string;
  outputPath: string;
}
