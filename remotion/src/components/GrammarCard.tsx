/**
 * Grammar Card Component
 * Displays grammar structure with explanations and examples
 */
import React from 'react';
import { AbsoluteFill, Audio, Img } from 'remotion';
import { theme } from '../styles/theme';
import { useFadeIn, useSlideIn } from '../utils/animation';

interface GrammarCardProps {
  text: string;
  examples?: string[];
  audioUrl?: string;
  backgroundImage?: string;
}

export const GrammarCard: React.FC<GrammarCardProps> = ({
  text,
  examples,
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
          background: `linear-gradient(135deg, ${theme.colors.primary}20 0%, ${theme.colors.background} 100%)`,
        }}
      />

      {backgroundImage && (
        <AbsoluteFill style={{ opacity: 0.65 }}>
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
            📖 Grammar Point
          </div>
        </div>

        {/* Main Content Box */}
        <div
          style={{
            opacity: fadeIn,
            transform: `translateX(${(1 - slideIn) * -30}px)`,
            backgroundColor: theme.colors.backgroundLight,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            boxShadow: theme.shadows.lg,
            borderLeft: `8px solid ${theme.colors.primary}`,
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontFamily: theme.fonts.primary,
              color: theme.colors.text,
              lineHeight: 1.6,
            }}
          >
            {text}
          </div>

          {/* Examples if provided */}
          {examples && examples.length > 0 && (
            <div style={{ marginTop: theme.spacing.md }}>
              {examples.map((example, index) => (
                <div
                  key={index}
                  style={{
                    opacity: fadeIn * (1 - index * 0.1),
                    transform: `translateX(${(1 - slideIn) * (30 + index * 10)}px)`,
                    marginTop: theme.spacing.sm,
                    fontSize: 30,
                    fontFamily: theme.fonts.primary,
                    color: theme.colors.textAccent,
                    paddingLeft: theme.spacing.md,
                    borderLeft: `4px solid ${theme.colors.accent}`,
                  }}
                >
                  • {example}
                </div>
              ))}
            </div>
          )}
        </div>
      </AbsoluteFill>

      {/* Audio */}
      {audioUrl && <Audio src={audioUrl} />}
    </AbsoluteFill>
  );
};

