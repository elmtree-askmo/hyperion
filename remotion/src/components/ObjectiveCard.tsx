/**
 * Objective Card Component
 * Displays learning objectives with animated text
 * Supports phrase-level timing based on textParts
 */
import React from 'react';
import { AbsoluteFill, Audio, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../styles/theme';
import { useFadeIn, useSlideIn } from '../utils/animation';

interface TextPart {
  text: string;
  language: string;
  speakingRate?: number;
  englishTranslation?: string;
}

interface TextPartTiming {
  text: string;
  language: string;
  duration: number;
  startTime: number;
  endTime: number;
}

interface ObjectiveCardProps {
  text: string;
  textParts?: TextPart[];
  textPartTimings?: TextPartTiming[];
  audioUrl?: string;
  backgroundImage?: string;
  durationInFrames?: number;
}

export const ObjectiveCard: React.FC<ObjectiveCardProps> = ({
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

  // Calculate total content length to determine font scaling
  const getTotalContentLength = () => {
    if (!textParts || textParts.length === 0) {
      return text?.length || 0;
    }
    let totalLength = 0;
    textParts.forEach(part => {
      totalLength += part.text.length;
      if (part.englishTranslation) {
        totalLength += part.englishTranslation.length * 0.6; // English counts less
      }
    });
    return totalLength;
  };

  // Dynamic font sizing based on content length
  const getDynamicFontSizes = () => {
    const contentLength = getTotalContentLength();
    
    // Base sizes
    let baseFontSize = 38;
    let fallbackFontSize = 44;
    let mainTextSize = { th: 30, en: 36 };
    let translationSize = 20;
    let lineHeight = 1.7;
    let gap = 12;

    // Adjust based on content length
    if (contentLength > 800) {
      baseFontSize = 30;
      fallbackFontSize = 34;
      mainTextSize = { th: 24, en: 28 };
      translationSize = 16;
      lineHeight = 1.5;
      gap = 8;
    } else if (contentLength > 600) {
      baseFontSize = 33;
      fallbackFontSize = 38;
      mainTextSize = { th: 26, en: 30 };
      translationSize = 18;
      lineHeight = 1.6;
      gap = 9;
    } else if (contentLength > 400) {
      baseFontSize = 36;
      fallbackFontSize = 41;
      mainTextSize = { th: 28, en: 33 };
      translationSize = 19;
      lineHeight = 1.65;
      gap = 10;
    }

    return { baseFontSize, fallbackFontSize, mainTextSize, translationSize, lineHeight, gap };
  };

  const fontSizes = getDynamicFontSizes();

  // Render text with highlighting based on textParts timing
  const renderTextWithHighlight = () => {
    // Use precise textPartTimings if available, otherwise fall back to estimation
    const timingsToUse = textPartTimings && textPartTimings.length > 0
      ? textPartTimings.map((timing) => ({
          part: { 
            text: timing.text, 
            language: timing.language,
            englishTranslation: (timing as any).englishTranslation 
          },
          startFrame: Math.round(timing.startTime * fps),
          endFrame: Math.round(timing.endTime * fps),
        }))
      : partTimings;

    if (!textParts || textParts.length === 0 || timingsToUse.length === 0) {
      // Fallback to simple display without highlighting
      return (
        <div
          style={{
            fontSize: fontSizes.fallbackFontSize,
            fontFamily: theme.fonts.primary,
            color: theme.colors.text,
            lineHeight: fontSizes.lineHeight,
            textAlign: 'center',
          }}
        >
          {text}
        </div>
      );
    }

    return (
      <div
        style={{
          fontSize: fontSizes.baseFontSize,
          fontFamily: theme.fonts.primary,
          color: theme.colors.text,
          lineHeight: fontSizes.lineHeight,
          display: 'flex',
          flexDirection: 'column',
          gap: `${fontSizes.gap}px`,
        }}
      >
        {timingsToUse.map((timing, index) => {
          const isActive = frame >= timing.startFrame && frame < timing.endFrame;
          const isEnglish = timing.part.language === 'en';
          const englishTranslation = (timing.part as any).englishTranslation;
          const thaiTranslation = (timing.part as any).thaiTranslation;

          return (
            <div
              key={index}
              style={{
                display: 'inline-block',
                padding: '3px 6px',
                borderRadius: theme.borderRadius.sm,
                backgroundColor: isActive ? `${theme.colors.accent}20` : 'transparent',
                transition: 'background-color 0.2s ease',
              }}
            >
              <span
                style={{
                  color: isActive
                    ? theme.colors.accent
                    : isEnglish
                    ? theme.colors.text
                    : theme.colors.textSecondary,
                  fontWeight: isEnglish ? (isActive ? 'bold' : '600') : 'normal',
                  textShadow: isActive ? theme.shadows.md : 'none',
                  transition: 'color 0.2s ease, text-shadow 0.2s ease',
                  fontSize: isEnglish ? fontSizes.mainTextSize.en : fontSizes.mainTextSize.th,
                  display: 'block',
                  lineHeight: 1.5,
                }}
              >
                {timing.part.text}
              </span>
              {/* Show English translation for Thai text */}
              {!isEnglish && englishTranslation && (
                <span
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: fontSizes.translationSize,
                    fontStyle: 'italic',
                    display: 'block',
                    marginTop: '4px',
                    opacity: 0.75,
                    lineHeight: 1.4,
                  }}
                >
                  {englishTranslation}
                </span>
              )}
              {/* Show Thai translation for English text */}
              {isEnglish && thaiTranslation && (
                <span
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: fontSizes.translationSize,
                    fontStyle: 'italic',
                    display: 'block',
                    marginTop: '4px',
                    opacity: 0.75,
                    lineHeight: 1.4,
                  }}
                >
                  {thaiTranslation}
                </span>
              )}
            </div>
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
          background: `linear-gradient(135deg, ${theme.colors.accent}20 0%, ${theme.colors.background} 100%)`,
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

      {/* Content - Responsive layout for both 1:1 preview and 9:16 export */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: `${theme.spacing.xl}px ${theme.spacing.lg}px`,
          justifyContent: 'center', // Center for square format
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
            🎯 LEARNING OBJECTIVE
          </div>
        </div>

        {/* Main Content Box */}
        <div
          style={{
            opacity: fadeIn,
            transform: `scale(${0.9 + slideIn * 0.1})`,
            backgroundColor: theme.colors.backgroundLight,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl,
            boxShadow: theme.shadows.lg,
            borderTop: `8px solid ${theme.colors.accent}`,
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

