/**
 * Practice Card Component
 * Displays practice exercises with phrase-level timing based on textParts
 */
import React from 'react';
import { AbsoluteFill, Audio, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme, VIDEO_CONFIG } from '../styles/theme';
import { useFadeIn, useSlideIn } from '../utils/animation';

interface TextPart {
  text: string;
  language: string;
  speakingRate?: number;
}

interface TextPartTiming {
  text: string;
  language: string;
  duration: number;
  startTime: number;
  endTime: number;
}

interface PracticeCardProps {
  text: string;
  textParts?: TextPart[];
  textPartTimings?: TextPartTiming[];
  audioUrl?: string;
  backgroundImage?: string;
  durationInFrames?: number;
}

export const PracticeCard: React.FC<PracticeCardProps> = ({
  text,
  textParts,
  textPartTimings,
  audioUrl,
  backgroundImage,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = useFadeIn(0, 20);
  const slideIn = useSlideIn(5);
  const currentTimeInSeconds = frame / fps;

  // Helper function to estimate duration for each text part based on character count and speaking rate
  const estimatePartDuration = (part: TextPart): number => {
    // More accurate estimation based on actual TTS behavior
    const baseCharsPerSecond = part.language === 'th' ? 10 : 12; // Adjusted for better accuracy
    const adjustedSpeed = baseCharsPerSecond * (part.speakingRate || 1.0);
    // Add small pause between parts (0.1 seconds)
    return (part.text.length / adjustedSpeed) + 0.1;
  };

  // Calculate timing for each text part
  const getPartTimings = () => {
    if (!textParts || textParts.length === 0) {
      return [];
    }

    const totalFrames = durationInFrames || fps * 10;
    const totalDuration = totalFrames / fps;

    // Estimate duration for each part
    const estimatedDurations = textParts.map(estimatePartDuration);
    const totalEstimated = estimatedDurations.reduce((sum, d) => sum + d, 0);

    // Scale to fit actual duration
    const scale = totalDuration / totalEstimated;

    let currentTime = 0;
    return textParts.map((part, index) => {
      const duration = estimatedDurations[index] * scale;
      const startTime = currentTime;
      const endTime = currentTime + duration;
      currentTime = endTime;

      return {
        part,
        startFrame: Math.round(startTime * fps),
        endFrame: Math.round(endTime * fps),
      };
    });
  };

  const partTimings = getPartTimings();

  // Render text with highlighting based on textParts timing
  const renderTextWithHighlight = () => {
    // Use precise textPartTimings if available, otherwise fall back to estimation
    const timingsToUse = textPartTimings && textPartTimings.length > 0
      ? textPartTimings.map((timing) => ({
          part: { text: timing.text, language: timing.language },
          startFrame: Math.round(timing.startTime * fps),
          endFrame: Math.round(timing.endTime * fps),
        }))
      : partTimings;

    if (!textParts || textParts.length === 0 || timingsToUse.length === 0) {
      // Fallback to simple display without highlighting
      return <div style={{ fontSize: 36, lineHeight: 1.8 }}>{text}</div>;
    }

    return (
      <div
        style={{
          fontSize: 36,
          fontFamily: theme.fonts.primary,
          color: theme.colors.text,
          lineHeight: 1.8,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {timingsToUse.map((timing, index) => {
          const isActive = frame >= timing.startFrame && frame < timing.endFrame;
          const isEnglish = timing.part.language === 'en';

          return (
            <span
              key={index}
              style={{
                color: isActive
                  ? theme.colors.primary
                  : isEnglish
                  ? theme.colors.text
                  : theme.colors.textSecondary,
                fontWeight: isEnglish ? (isActive ? 'bold' : '600') : 'normal',
                textShadow: isActive ? theme.shadows.md : 'none',
                transition: 'color 0.2s ease, background-color 0.2s ease, text-shadow 0.2s ease',
                fontSize: isEnglish ? 42 : 32,
                backgroundColor: isActive
                  ? `${theme.colors.primary}20`
                  : 'transparent',
                padding: '4px 8px',
                borderRadius: theme.borderRadius.sm,
                display: 'inline-block',
                boxSizing: 'border-box',
              }}
            >
              {timing.part.text}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.background }}>
      {/* Background */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${theme.colors.secondary}20 0%, ${theme.colors.background} 100%)`,
        }}
      />

      {backgroundImage && (
        <AbsoluteFill style={{ opacity: 0.65 }}>
          <Img
            src={backgroundImage}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
        </AbsoluteFill>
      )}

      {/* Content - Optimized for 9:16 vertical format */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: `${theme.spacing.xl}px ${theme.spacing.lg}px`,
          justifyContent: 'flex-start',
          paddingTop: VIDEO_CONFIG.height * 0.2, // Start at 20% from top
        }}
      >
        {/* Label */}
        <div
          style={{
            opacity: fadeIn,
            transform: `translateY(${(1 - slideIn) * -30}px)`,
            marginBottom: theme.spacing.xl,
          }}
        >
          <div
            style={{
              fontSize: 40,
              fontFamily: theme.fonts.primary,
              color: theme.colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 3,
              textAlign: 'center',
            }}
          >
            🗣️ PRACTICE
          </div>
        </div>

        {/* Practice Text with phrase highlighting */}
        <div
          style={{
            opacity: fadeIn,
            transform: `translateX(${(1 - slideIn) * -30}px)`,
            backgroundColor: theme.colors.backgroundLight,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl,
            boxShadow: theme.shadows.lg,
            borderLeft: `10px solid ${theme.colors.secondary}`,
          }}
        >
          {renderTextWithHighlight()}
        </div>
      </AbsoluteFill>

      {/* Audio */}
      {audioUrl && <Audio src={audioUrl} />}
    </AbsoluteFill>
  );
};
