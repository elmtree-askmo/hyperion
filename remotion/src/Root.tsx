/**
 * Remotion Root Component
 * Registers all compositions for video rendering
 */
import React from 'react';
import { Composition } from 'remotion';
import { LessonComposition } from './components/LessonComposition';
import { DebugComposition } from './components/DebugComposition';
import { VIDEO_CONFIG } from './styles/theme';

// Import lesson data (this will be replaced dynamically during rendering)
// For now, we'll export the component that accepts props
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
        defaultProps={{
          lessonData: {
            lesson: {
              title: 'Sample Lesson',
              titleTh: 'บทเรียนตัวอย่าง',
              episodeNumber: 1,
              totalEpisodes: 3,
              segmentBasedTiming: [],
            },
            flashcards: [],
            audioSegments: [],
          },
        }}
        // Calculate duration from props if available
        calculateMetadata={({ props }) => {
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
            };
          }
          return {
            durationInFrames: VIDEO_CONFIG.durationInSeconds * VIDEO_CONFIG.fps,
            fps: VIDEO_CONFIG.fps,
          };
        }}
      />
      <Composition
        id="Debug"
        component={DebugComposition}
        durationInFrames={30}
        fps={30}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
        defaultProps={{
          lessonData: {
            lesson: {
              title: 'Debug',
              segmentBasedTiming: [],
            },
          },
        }}
      />
    </>
  );
};

