/**
 * Outro Card Component
 * Displays lesson summary and next steps
 */
import React from 'react';
import { AbsoluteFill, Audio, Img } from 'remotion';
import { theme } from '../styles/theme';
import { useFadeIn, useSlideIn, useScaleIn } from '../utils/animation';

interface OutroCardProps {
  text: string;
  episodeNumber: number;
  totalEpisodes: number;
  audioUrl?: string;
  backgroundImage?: string;
}

export const OutroCard: React.FC<OutroCardProps> = ({
  text,
  episodeNumber,
  totalEpisodes,
  audioUrl,
  backgroundImage,
}) => {
  const fadeIn = useFadeIn(0, 20);
  const slideIn = useSlideIn(5);
  const scale = useScaleIn(10);

  const hasNextLesson = episodeNumber < totalEpisodes;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.background }}>
      {/* Background */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary}20 0%, ${theme.colors.background} 100%)`,
        }}
      />

      {backgroundImage && (
        <AbsoluteFill style={{ opacity: 0.7 }}>
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
          alignItems: 'center',
        }}
      >
        {/* Congratulations */}
        <div
          style={{
            opacity: fadeIn,
            transform: `scale(${scale})`,
            marginBottom: theme.spacing.lg,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontFamily: theme.fonts.heading,
              color: theme.colors.primary,
              textAlign: 'center',
            }}
          >
            🎉 เยี่ยมมาก!
          </div>
        </div>

        {/* Summary text */}
        <div
          style={{
            opacity: fadeIn,
            transform: `translateY(${(1 - slideIn) * 30}px)`,
            backgroundColor: theme.colors.backgroundLight,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
            maxWidth: '90%',
          }}
        >
          <div
            style={{
              fontSize: 34,
              fontFamily: theme.fonts.primary,
              color: theme.colors.text,
              lineHeight: 1.6,
              textAlign: 'center',
            }}
          >
            {text}
          </div>
        </div>

        {/* Next lesson indicator */}
        {hasNextLesson && (
          <div
            style={{
              opacity: fadeIn * 0.9,
              transform: `translateY(${(1 - slideIn) * 50}px)`,
            }}
          >
            <div
              style={{
                fontSize: 36,
                fontFamily: theme.fonts.primary,
                color: theme.colors.textAccent,
                textAlign: 'center',
                padding: theme.spacing.md,
                backgroundColor: theme.colors.backgroundLight + '80',
                borderRadius: theme.borderRadius.md,
              }}
            >
              ➡️ Next: Lesson {episodeNumber + 1}
            </div>
          </div>
        )}

        {/* Decorative element */}
        <div
          style={{
            position: 'absolute',
            bottom: theme.spacing.xl,
            width: '80%',
            height: 4,
            background: `linear-gradient(90deg, transparent, ${theme.colors.primary}, transparent)`,
            opacity: fadeIn,
          }}
        />
      </AbsoluteFill>

      {/* Audio */}
      {audioUrl && <Audio src={audioUrl} />}
    </AbsoluteFill>
  );
};

