import { LessonData } from "../types/lesson";

// Get API base URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

/**
 * Load lesson data from the backend or local files
 */
export async function loadLessonData(
  videoId: string,
  lessonId: string
): Promise<LessonData | undefined> {
  try {
    // Try to load from API first
    const apiUrl = `${API_BASE_URL}/api/v1/video-transform/lessons/${videoId}/${lessonId}`;
    const response = await fetch(apiUrl);

    if (response.ok) {
      const data = await response.json();
      return transformLessonData(data);
    }
  } catch (error) {
    console.warn("API not available, loading from local files:", error);
  }

  return undefined;
}

/**
 * Transform raw lesson data into the format expected by the app
 */
function transformLessonData(rawData: any): LessonData {
  const {
    microlessonScript,
    flashcards,
    audioSegments,
    finalSynchronizedLesson,
  } = rawData;

  const lesson = microlessonScript.lesson;
  const seriesInfo = microlessonScript.seriesInfo;

  // Build segment timing from finalSynchronizedLesson if available
  const segmentBasedTiming =
    finalSynchronizedLesson?.lesson?.segmentBasedTiming || [];

  return {
    lesson: {
      title: lesson.title,
      titleTh: lesson.titleTh,
      duration: lesson.duration || 600,
      episodeNumber: seriesInfo?.episodeNumber || 1,
      totalEpisodes: seriesInfo?.totalEpisodes || 1,
      segmentBasedTiming,
      learningObjectives: lesson.learningObjectives || [],
      comprehensionQuestions: lesson.comprehensionQuestions || [],
    },
    flashcards: flashcards || [],
    audioSegments: audioSegments || [],
  };
}

/**
 * Get list of available lessons
 */
export async function getAvailableLessons(videoId: string): Promise<string[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/video-transform/lessons/${videoId}`
    );
    if (response.ok) {
      const data = await response.json();
      return data.lessons || [];
    }
  } catch (error) {
    console.warn("Could not fetch available lessons:", error);
  }

  // Fallback: return common lesson names
  return ["lesson_1", "lesson_2", "lesson_3"];
}

/**
 * Episode metadata structure
 */
export interface EpisodeMetadata {
  episodeNumber: number;
  title: string;
  titleTh: string;
  thumbnail: string;
  duration: number;
}

/**
 * Get episodes metadata for a video
 * Returns title, thumbnail, and duration for all episodes
 */
export async function getEpisodesMetadata(
  videoId: string
): Promise<EpisodeMetadata[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/video-transform/lessons/${videoId}/episodes`
    );
    if (response.ok) {
      const data = await response.json();
      return data.episodes || [];
    }
  } catch (error) {
    console.warn("Could not fetch episodes metadata:", error);
  }

  // Fallback: return empty array
  return [];
}
