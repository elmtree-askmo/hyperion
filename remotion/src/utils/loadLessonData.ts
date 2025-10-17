/**
 * Load lesson data from backend API
 * All data is fetched from API which handles URL transformation (local/S3)
 */

/**
 * Load lesson data from API (transforms URLs to S3)
 */
export const loadLessonDataFromAPI = async (
  videoId: string,
  lessonId: string
) => {
  const API_BASE_URL = process.env.API_URL || "http://localhost:3000";
  const url = `${API_BASE_URL}/api/v1/video-transform/lessons/${videoId}/${lessonId}`;

  console.log("[loadLessonData] Fetching from:", url);

  try {
    const response = await fetch(url);

    console.log("[loadLessonData] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[loadLessonData] Error response:", errorText);
      throw new Error(
        `Failed to load lesson data: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("[loadLessonData] Data received:", {
      hasMicrolesson: !!data.microlessonScript,
      hasFinalLesson: !!data.finalSynchronizedLesson,
      segmentCount:
        data.finalSynchronizedLesson?.lesson?.segmentBasedTiming?.length || 0,
    });

    return {
      lessonData: {
        lesson: {
          title: data.microlessonScript.lesson.title,
          titleTh: data.microlessonScript.lesson.titleTh,
          episodeNumber: data.microlessonScript.seriesInfo.episodeNumber,
          totalEpisodes: data.microlessonScript.seriesInfo.totalEpisodes,
          segmentBasedTiming:
            data.finalSynchronizedLesson.lesson.segmentBasedTiming,
        },
        flashcards: data.flashcards,
        audioSegments: data.audioSegments,
      },
    };
  } catch (error) {
    console.error("[loadLessonData] Failed to load:", error);
    throw error;
  }
};

/**
 * Default export - loads lesson 1 from API
 * For backward compatibility, but now uses API instead of local files
 */
export const loadLesson1Data = async () => {
  return loadLessonDataFromAPI("henIVlCPVIY", "lesson_1");
};
