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
  difficulty: string;
}

export interface TextPartTiming {
  text: string;
  language: string;
  duration: number;
  startTime: number;
  endTime: number;
}

export interface SegmentTiming {
  startTime: number;
  endTime: number;
  duration: number;
  screenElement: string;
  audioUrl: string;
  text: string;
  vocabWord?: string;
  backgroundUrl?: string;
  textPartTimings?: TextPartTiming[];
}

export interface ComprehensionQuestion {
  question: string;
  questionTh: string;
  expectedAnswer: string;
  context: string;
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

export interface LessonData {
  lesson: {
    title: string;
    titleTh: string;
    duration: number;
    episodeNumber: number;
    totalEpisodes: number;
    segmentBasedTiming: SegmentTiming[];
    learningObjectives: LearningObjective[];
    comprehensionQuestions: ComprehensionQuestion[];
  };
  flashcards: Flashcard[];
  audioSegments: Array<{
    id: string;
    backgroundImageDescription: string;
  }>;
}

export interface InteractiveSegment {
  type: 'flashcard' | 'practice' | 'quiz';
  startTime: number;
  endTime: number;
  data: any;
  revealed?: boolean;
  completed?: boolean;
}
