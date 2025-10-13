/**
 * Objective Card Component
 * Displays learning objectives with animated text
 */
import React from 'react';
import { AbsoluteFill, Audio, Img } from 'remotion';
import { theme, VIDEO_CONFIG } from '../styles/theme';
import { useFadeIn, useSlideIn } from '../utils/animation';

interface ObjectiveCardProps {
  text: string;
  audioUrl?: string;
  backgroundImage?: string;
}

export const ObjectiveCard: React.FC<ObjectiveCardProps> = ({
  text,
  audioUrl,
  backgroundImage,
}) => {
  const fadeIn = useFadeIn(0, 20);
  const slideIn = useSlideIn(5);

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

        {/* Content Box */}
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
          <div
            style={{
              fontSize: 44,
              fontFamily: theme.fonts.primary,
              color: theme.colors.text,
              lineHeight: 1.7,
              textAlign: 'center',
            }}
          >
            {text}
          </div>
        </div>
      </AbsoluteFill>

      {/* Audio */}
      {audioUrl && <Audio src={audioUrl} />}
    </AbsoluteFill>
  );
};

