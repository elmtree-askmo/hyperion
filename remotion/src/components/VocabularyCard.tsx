/**
 * Vocabulary Card Component
 * Displays vocabulary word with definition, pronunciation, and examples
 */
import React from 'react';
import { AbsoluteFill, Audio, Img, useCurrentFrame } from 'remotion';
import { theme, VIDEO_CONFIG } from '../styles/theme';
import { useFadeIn, useSlideIn, useScaleIn } from '../utils/animation';

interface VocabularyCardProps {
  word: string;
  thaiTranslation: string;
  pronunciation: string;
  definition: string;
  thaiDefinition: string;
  memoryHook: string;
  contextExample: string;
  audioUrl?: string;
  backgroundImage?: string;
}

export const VocabularyCard: React.FC<VocabularyCardProps> = ({
  word,
  thaiTranslation,
  pronunciation,
  definition,
  thaiDefinition,
  memoryHook,
  contextExample,
  audioUrl,
  backgroundImage,
}) => {
  const frame = useCurrentFrame();
  const fadeIn = useFadeIn(0, 20);
  const slideIn = useSlideIn(5);
  const scale = useScaleIn(10);

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

      {/* Content Container - Responsive layout for both 1:1 preview and 9:16 export */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: `${theme.spacing.xl}px ${theme.spacing.lg}px`,
          justifyContent: 'center', // Center for square format, will be overridden in export
        }}
      >
        {/* Label */}
        <div
          style={{
            opacity: fadeIn,
            transform: `translateY(${(1 - slideIn) * -30}px)`,
            marginBottom: theme.spacing.lg,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontFamily: theme.fonts.primary,
              color: theme.colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 3,
              textAlign: 'center',
            }}
          >
            📚 VOCABULARY
          </div>
        </div>

        {/* Main Word Card */}
        <div
          style={{
            opacity: fadeIn,
            transform: `scale(${scale})`,
            backgroundColor: theme.colors.backgroundLight,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl,
            marginBottom: theme.spacing.xl,
            boxShadow: theme.shadows.lg,
            textAlign: 'center',
          }}
        >
          {/* Word */}
          <div
            style={{
              fontSize: 96,
              fontFamily: theme.fonts.heading,
              color: theme.colors.primary,
              marginBottom: theme.spacing.lg,
              fontWeight: 'bold',
              lineHeight: 1.1,
            }}
          >
            {word}
          </div>

          {/* Thai Translation */}
          <div
            style={{
              fontSize: 56,
              fontFamily: theme.fonts.primary,
              color: theme.colors.textAccent,
              marginBottom: theme.spacing.md,
              lineHeight: 1.3,
            }}
          >
            {thaiTranslation}
          </div>

          {/* Pronunciation */}
          <div
            style={{
              fontSize: 40,
              fontFamily: theme.fonts.monospace,
              color: theme.colors.textSecondary,
              fontStyle: 'italic',
            }}
          >
            [{pronunciation}]
          </div>
        </div>

        {/* Definition */}
        <div
          style={{
            opacity: fadeIn * 0.9,
            transform: `translateX(${(1 - slideIn) * -30}px)`,
            backgroundColor: theme.colors.backgroundLight + '90',
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
          }}
        >
          <div
            style={{
              fontSize: 38,
              fontFamily: theme.fonts.primary,
              color: theme.colors.text,
              lineHeight: 1.6,
              textAlign: 'center',
            }}
          >
            {thaiDefinition}
          </div>
        </div>

        {/* Memory Hook */}
        <div
          style={{
            opacity: fadeIn * 0.85,
            transform: `translateX(${(1 - slideIn) * 30}px)`,
            backgroundColor: theme.colors.accent + '20',
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.lg,
            borderLeft: `8px solid ${theme.colors.accent}`,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontFamily: theme.fonts.primary,
              color: theme.colors.text,
              lineHeight: 1.6,
            }}
          >
            💡 {memoryHook}
          </div>
        </div>
      </AbsoluteFill>

      {/* Audio */}
      {audioUrl && <Audio src={audioUrl} />}
    </AbsoluteFill>
  );
};

