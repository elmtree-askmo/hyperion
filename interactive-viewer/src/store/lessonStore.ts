import { create } from "zustand";
import { LessonData, InteractiveSegment } from "../types/lesson";

interface ValidationResult {
  isCorrect: boolean;
  feedbackTh: string;
  feedbackEn: string;
  evaluation?: string;
}

interface PracticeAnswer {
  userAnswer: string;
  validationResult: ValidationResult;
}

interface LessonState {
  lessonData: LessonData | null;
  currentTime: number;
  isPlaying: boolean;
  interactiveSegments: InteractiveSegment[];
  activeSegment: InteractiveSegment | null;
  currentVideoId: string;
  currentLessonId: string;
  videoEnded: boolean;
  practicePauseEnabled: boolean;
  currentPracticePhrase: string | null;
  isPracticePaused: boolean;
  currentVocabularyWord: string | null;
  isVocabularyPaused: boolean;
  userProgress: {
    completedFlashcards: string[];
    completedPractices: string[];
    quizAnswers: Record<string, string>;
    practicedPhrases: string[];
    reviewedVocabulary: string[];
    practiceAnswers: Record<string, PracticeAnswer>;
  };

  // Actions
  setLessonData: (data: LessonData) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setActiveSegment: (segment: InteractiveSegment | null) => void;
  setCurrentVideoId: (videoId: string) => void;
  setCurrentLessonId: (lessonId: string) => void;
  setVideoEnded: (ended: boolean) => void;
  setPracticePauseEnabled: (enabled: boolean) => void;
  setCurrentPracticePhrase: (phrase: string | null) => void;
  setIsPracticePaused: (paused: boolean) => void;
  setCurrentVocabularyWord: (word: string | null) => void;
  setIsVocabularyPaused: (paused: boolean) => void;
  completePracticePhrase: (phrase: string) => void;
  markVocabularyReviewed: (word: string) => void;
  revealFlashcard: (word: string) => void;
  completePractice: (practiceId: string) => void;
  submitQuizAnswer: (questionId: string, answer: string) => void;
  savePracticeAnswer: (
    practiceId: string,
    userAnswer: string,
    validationResult: ValidationResult
  ) => void;
  resetProgress: () => void;
}

export type { ValidationResult, PracticeAnswer };

export const useLessonStore = create<LessonState>((set, get) => ({
  lessonData: null,
  currentTime: 0,
  isPlaying: false,
  interactiveSegments: [],
  activeSegment: null,
  currentVideoId: "henIVlCPVIY",
  currentLessonId: "lesson_1",
  videoEnded: false,
  practicePauseEnabled: false,
  currentPracticePhrase: null,
  isPracticePaused: false,
  currentVocabularyWord: null,
  isVocabularyPaused: false,
  userProgress: {
    completedFlashcards: [],
    completedPractices: [],
    quizAnswers: {},
    practicedPhrases: [],
    reviewedVocabulary: [],
    practiceAnswers: {},
  },

  setLessonData: (data) => {
    // Create interactive segments from lesson data
    const segments: InteractiveSegment[] = [];

    // Add flashcards as interactive segments, sorted by appearance time in video
    data.flashcards.forEach((flashcard) => {
      const timing = data.lesson.segmentBasedTiming.find(
        (seg) => seg.vocabWord === flashcard.word
      );
      if (timing) {
        segments.push({
          type: "flashcard",
          startTime: timing.startTime,
          endTime: timing.endTime,
          data: flashcard,
          revealed: false,
        });
      }
    });

    // Sort flashcard segments by startTime to match video appearance order
    const flashcardSegments = segments
      .filter((seg) => seg.type === "flashcard")
      .sort((a, b) => a.startTime - b.startTime);

    // Add practices as interactive segments
    const practiceSegments: InteractiveSegment[] = [];
    data.lesson.comprehensionQuestions.forEach((question) => {
      practiceSegments.push({
        type: "practice",
        startTime: 0, // Will be triggered manually
        endTime: 0,
        data: question,
        completed: false,
      });
    });

    // Combine sorted flashcards with practices
    const allSegments = [...flashcardSegments, ...practiceSegments];

    set({ lessonData: data, interactiveSegments: allSegments });
  },

  setCurrentTime: (time) => {
    const { interactiveSegments } = get();

    // Find active segment at current time
    const activeSegment = interactiveSegments.find(
      (seg) => time >= seg.startTime && time <= seg.endTime
    );

    set({ currentTime: time, activeSegment: activeSegment || null });
  },

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setActiveSegment: (segment) => set({ activeSegment: segment }),

  setCurrentVideoId: (videoId) => set({ currentVideoId: videoId }),

  setCurrentLessonId: (lessonId) => set({ currentLessonId: lessonId }),

  setVideoEnded: (ended) => set({ videoEnded: ended }),

  setPracticePauseEnabled: (enabled) => set({ practicePauseEnabled: enabled }),

  setCurrentPracticePhrase: (phrase) => set({ currentPracticePhrase: phrase }),

  setIsPracticePaused: (paused) => set({ isPracticePaused: paused }),

  setCurrentVocabularyWord: (word) => set({ currentVocabularyWord: word }),

  setIsVocabularyPaused: (paused) => set({ isVocabularyPaused: paused }),

  completePracticePhrase: (phrase) => {
    const { userProgress } = get();
    set({
      userProgress: {
        ...userProgress,
        practicedPhrases: [...userProgress.practicedPhrases, phrase],
      },
      currentPracticePhrase: null,
      isPracticePaused: false,
    });
  },

  markVocabularyReviewed: (word) => {
    const { userProgress } = get();
    if (!userProgress.reviewedVocabulary.includes(word)) {
      set({
        userProgress: {
          ...userProgress,
          reviewedVocabulary: [...userProgress.reviewedVocabulary, word],
        },
      });
    }
  },

  revealFlashcard: (word) => {
    const { interactiveSegments, userProgress } = get();
    const updatedSegments = interactiveSegments.map((seg) =>
      seg.type === "flashcard" && seg.data.word === word
        ? { ...seg, revealed: true }
        : seg
    );

    set({
      interactiveSegments: updatedSegments,
      userProgress: {
        ...userProgress,
        completedFlashcards: [...userProgress.completedFlashcards, word],
      },
    });
  },

  completePractice: (practiceId) => {
    const { interactiveSegments, userProgress } = get();
    const updatedSegments = interactiveSegments.map((seg) =>
      seg.type === "practice" && seg.data.question === practiceId
        ? { ...seg, completed: true }
        : seg
    );

    set({
      interactiveSegments: updatedSegments,
      userProgress: {
        ...userProgress,
        completedPractices: [...userProgress.completedPractices, practiceId],
      },
    });
  },

  submitQuizAnswer: (questionId, answer) => {
    const { userProgress } = get();
    set({
      userProgress: {
        ...userProgress,
        quizAnswers: { ...userProgress.quizAnswers, [questionId]: answer },
      },
    });
  },

  savePracticeAnswer: (practiceId, userAnswer, validationResult) => {
    const { userProgress } = get();
    set({
      userProgress: {
        ...userProgress,
        practiceAnswers: {
          ...userProgress.practiceAnswers,
          [practiceId]: { userAnswer, validationResult },
        },
      },
    });
  },

  resetProgress: () => {
    set({
      userProgress: {
        completedFlashcards: [],
        completedPractices: [],
        quizAnswers: {},
        practicedPhrases: [],
        reviewedVocabulary: [],
        practiceAnswers: {},
      },
      interactiveSegments: get().interactiveSegments.map((seg) => ({
        ...seg,
        revealed: false,
        completed: false,
      })),
      currentPracticePhrase: null,
      isPracticePaused: false,
      currentVocabularyWord: null,
      isVocabularyPaused: false,
    });
  },
}));
