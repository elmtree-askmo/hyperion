/**
 * Practice Card Component
 * Displays practice exercises with word-level timing
 */
import React from 'react';
import { AbsoluteFill, Audio, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../styles/theme';
import { useFadeIn, useSlideIn, useWordHighlight } from '../utils/animation';

interface PracticeCardProps {
  text: string;
  audioUrl?: string;
  backgroundImage?: string;
  durationInFrames?: number;
}

export const PracticeCard: React.FC<PracticeCardProps> = ({
  text,
  audioUrl,
  backgroundImage,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = useFadeIn(0, 20);
  const slideIn = useSlideIn(5);

  // Split text into words for word-level highlighting
  const words = text.split(' ');
  const totalFrames = durationInFrames || fps * 10; // Default 10 seconds

  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.background }}>
      {/* Background */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${theme.colors.secondary}20 0%, ${theme.colors.background} 100%)`,
        }}
      />

      {backgroundImage && (
        <AbsoluteFill style={{ opacity: 0.15 }}>
          <Img
            src={backgroundImage}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </AbsoluteFill>
      )}

      {/* Content */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: theme.spacing.xl,
          justifyContent: 'center',
        }}
      >
        {/* Label */}
        <div
          style={{
            opacity: fadeIn,
            transform: `translateY(${(1 - slideIn) * -30}px)`,
            marginBottom: theme.spacing.md,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontFamily: theme.fonts.primary,
              color: theme.colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            🗣️ Practice
          </div>
        </div>

        {/* Practice Text with word highlighting */}
        <div
          style={{
            opacity: fadeIn,
            transform: `translateX(${(1 - slideIn) * -30}px)`,
            backgroundColor: theme.colors.backgroundLight,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            boxShadow: theme.shadows.lg,
            borderLeft: `8px solid ${theme.colors.secondary}`,
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontFamily: theme.fonts.primary,
              color: theme.colors.text,
              lineHeight: 1.8,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {words.map((word, index) => {
              const { isActive, opacity } = useWordHighlight(
                index,
                words.length,
                totalFrames,
              );

              return (
                <span
                  key={index}
                  style={{
                    color: isActive ? theme.colors.primary : theme.colors.text,
                    opacity,
                    transition: 'all 0.2s ease',
                    fontWeight: isActive ? 'bold' : 'normal',
                    textShadow: isActive ? theme.shadows.md : 'none',
                  }}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>

      {/* Audio */}
      {audioUrl && <Audio src={audioUrl} />}
    </AbsoluteFill>
  );
};

