/**
 * Load lesson data from JSON files for preview
 */
import finalLesson1 from '../../../videos/henIVlCPVIY/lesson_1/final_synchronized_lesson.json';
import microlesson1 from '../../../videos/henIVlCPVIY/lesson_1/microlesson_script.json';
import flashcards1 from '../../../videos/henIVlCPVIY/lesson_1/flashcards.json';
import audioSegments1 from '../../../videos/henIVlCPVIY/lesson_1/audio_segments.json';

export const loadLesson1Data = () => {
  return {
    lessonData: {
      lesson: {
        title: microlesson1.lesson.title,
        titleTh: microlesson1.lesson.titleTh,
        episodeNumber: microlesson1.seriesInfo.episodeNumber,
        totalEpisodes: microlesson1.seriesInfo.totalEpisodes,
        segmentBasedTiming: finalLesson1.lesson.segmentBasedTiming,
      },
      flashcards: flashcards1.flashcards,
      audioSegments: audioSegments1.audioSegments,
    },
  };
};
