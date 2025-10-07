/**
 * Animation utilities for smooth transitions
 */
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const useSlideIn = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 100,
      stiffness: 200,
      mass: 0.5,
    },
  });

  return progress;
};

export const useFadeIn = (delay = 0, duration = 30) => {
  const frame = useCurrentFrame();

  return interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

export const useScaleIn = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 80,
      stiffness: 100,
      mass: 0.3,
    },
  });

  return interpolate(progress, [0, 1], [0.8, 1]);
};

export const useWordHighlight = (wordIndex: number, totalWords: number, durationInFrames: number) => {
  const frame = useCurrentFrame();
  const framesPerWord = durationInFrames / totalWords;
  const wordStartFrame = wordIndex * framesPerWord;
  const wordEndFrame = (wordIndex + 1) * framesPerWord;

  const isActive = frame >= wordStartFrame && frame < wordEndFrame;
  const opacity = interpolate(frame, [wordStartFrame - 5, wordStartFrame, wordEndFrame, wordEndFrame + 5], [0.5, 1, 1, 0.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return { isActive, opacity };
};
