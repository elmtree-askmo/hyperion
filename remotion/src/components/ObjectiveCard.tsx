/**
 * Objective Card Component
 * Displays learning objectives with animated text
 */
import React from 'react';
import { AbsoluteFill, Audio, Img } from 'remotion';
import { theme } from '../styles/theme';
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
        <AbsoluteFill style={{ opacity: 0.15 }}>
          <Img
            src={backgroundImage}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
            🎯 Learning Objective
          </div>
        </div>

        {/* Content Box */}
        <div
          style={{
            opacity: fadeIn,
            transform: `scale(${0.9 + slideIn * 0.1})`,
            backgroundColor: theme.colors.backgroundLight,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            boxShadow: theme.shadows.lg,
            borderTop: `6px solid ${theme.colors.accent}`,
          }}
        >
          <div
            style={{
              fontSize: 38,
              fontFamily: theme.fonts.primary,
              color: theme.colors.text,
              lineHeight: 1.6,
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

