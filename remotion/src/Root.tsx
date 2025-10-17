/**
 * Remotion Root Component
 * Registers all compositions for video rendering
 */
import React, { useMemo } from 'react';
import { Composition, delayRender, continueRender } from 'remotion';
import { LessonComposition } from './components/LessonComposition';
import { DebugComposition } from './components/DebugComposition';
import { VIDEO_CONFIG } from './styles/theme';
import { loadLessonDataFromAPI } from './utils/loadLessonData';

// Default/fallback lesson data structure
const defaultLessonData = {
  lessonData: {
    lesson: {
      title: 'Loading...',
      titleTh: 'กำลังโหลด...',
      episodeNumber: 1,
      totalEpisodes: 1,
      segmentBasedTiming: [],
    },
    flashcards: [],
    audioSegments: [],
  },
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Lesson"
        component={LessonComposition}
        durationInFrames={VIDEO_CONFIG.durationInSeconds * VIDEO_CONFIG.fps}
        fps={VIDEO_CONFIG.fps}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
        defaultProps={defaultLessonData}
        // Calculate metadata dynamically - load data from API
        calculateMetadata={async ({ props }) => {
          // If props already has data (from CLI), use it
          if (props.lessonData?.lesson?.segmentBasedTiming?.length > 0) {
            const lastSegment =
              props.lessonData.lesson.segmentBasedTiming[
                props.lessonData.lesson.segmentBasedTiming.length - 1
              ];
            const totalDuration = lastSegment.endTime;
            const totalFrames = Math.ceil(totalDuration * VIDEO_CONFIG.fps);
            return {
              durationInFrames: totalFrames,
              fps: VIDEO_CONFIG.fps,
              props,
            };
          }

          // Otherwise, load from API (for preview)
          try {
            const data = await loadLessonDataFromAPI('henIVlCPVIY', 'lesson_1');
            const lastSegment =
              data.lessonData.lesson.segmentBasedTiming[
                data.lessonData.lesson.segmentBasedTiming.length - 1
              ];
            const totalDuration = lastSegment?.endTime || VIDEO_CONFIG.durationInSeconds;
            const totalFrames = Math.ceil(totalDuration * VIDEO_CONFIG.fps);
            
            return {
              durationInFrames: totalFrames,
              fps: VIDEO_CONFIG.fps,
              props: data,
            };
          } catch (error) {
            console.error('Failed to load lesson data:', error);
            return {
              durationInFrames: VIDEO_CONFIG.durationInSeconds * VIDEO_CONFIG.fps,
              fps: VIDEO_CONFIG.fps,
              props,
            };
          }
        }}
      />
      <Composition
        id="Debug"
        component={DebugComposition}
        durationInFrames={30}
        fps={30}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
        defaultProps={defaultLessonData}
      />
    </>
  );
};

