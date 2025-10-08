import { create } from 'zustand';
import { LessonData, InteractiveSegment } from '../types/lesson';

interface LessonState {
  lessonData: LessonData | null;
  currentTime: number;
  isPlaying: boolean;
  interactiveSegments: InteractiveSegment[];
  activeSegment: InteractiveSegment | null;
  userProgress: {
    completedFlashcards: string[];
    completedPractices: string[];
    quizAnswers: Record<string, string>;
  };

  // Actions
  setLessonData: (data: LessonData) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setActiveSegment: (segment: InteractiveSegment | null) => void;
  revealFlashcard: (word: string) => void;
  completePractice: (practiceId: string) => void;
  submitQuizAnswer: (questionId: string, answer: string) => void;
  resetProgress: () => void;
}

export const useLessonStore = create<LessonState>((set, get) => ({
  lessonData: null,
  currentTime: 0,
  isPlaying: false,
  interactiveSegments: [],
  activeSegment: null,
  userProgress: {
    completedFlashcards: [],
    completedPractices: [],
    quizAnswers: {},
  },

  setLessonData: (data) => {
    // Create interactive segments from lesson data
    const segments: InteractiveSegment[] = [];

    // Add flashcards as interactive segments
    data.flashcards.forEach((flashcard, index) => {
      const timing = data.lesson.segmentBasedTiming.find((seg) => seg.vocabWord === flashcard.word);
      if (timing) {
        segments.push({
          type: 'flashcard',
          startTime: timing.startTime,
          endTime: timing.endTime,
          data: flashcard,
          revealed: false,
        });
      }
    });

    // Add practices as interactive segments
    data.lesson.comprehensionQuestions.forEach((question, index) => {
      segments.push({
        type: 'practice',
        startTime: 0, // Will be triggered manually
        endTime: 0,
        data: question,
        completed: false,
      });
    });

    set({ lessonData: data, interactiveSegments: segments });
  },

  setCurrentTime: (time) => {
    const { interactiveSegments } = get();

    // Find active segment at current time
    const activeSegment = interactiveSegments.find((seg) => time >= seg.startTime && time <= seg.endTime);

    set({ currentTime: time, activeSegment: activeSegment || null });
  },

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setActiveSegment: (segment) => set({ activeSegment: segment }),

  revealFlashcard: (word) => {
    const { interactiveSegments, userProgress } = get();
    const updatedSegments = interactiveSegments.map((seg) => (seg.type === 'flashcard' && seg.data.word === word ? { ...seg, revealed: true } : seg));

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
    const updatedSegments = interactiveSegments.map((seg) => (seg.type === 'practice' && seg.data.question === practiceId ? { ...seg, completed: true } : seg));

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

  resetProgress: () => {
    set({
      userProgress: {
        completedFlashcards: [],
        completedPractices: [],
        quizAnswers: {},
      },
      interactiveSegments: get().interactiveSegments.map((seg) => ({
        ...seg,
        revealed: false,
        completed: false,
      })),
    });
  },
}));
