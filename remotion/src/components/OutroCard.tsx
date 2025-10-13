/**
 * Outro Card Component
 * Displays lesson summary and next steps
 */
import React from 'react';
import { AbsoluteFill, Audio, Img } from 'remotion';
import { theme, VIDEO_CONFIG } from '../styles/theme';
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
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
        </AbsoluteFill>
      )}

      {/* Content - Responsive layout for both 1:1 preview and 9:16 export */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: `${theme.spacing.xxl}px ${theme.spacing.xl}px`,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Congratulations */}
        <div
          style={{
            opacity: fadeIn,
            transform: `scale(${scale})`,
            marginBottom: theme.spacing.xxl,
          }}
        >
          <div
            style={{
              fontSize: 96,
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
            padding: theme.spacing.xl,
            marginBottom: theme.spacing.xxl,
            width: '85%',
          }}
        >
          <div
            style={{
              fontSize: 42,
              fontFamily: theme.fonts.primary,
              color: theme.colors.text,
              lineHeight: 1.7,
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
                fontSize: 44,
                fontFamily: theme.fonts.primary,
                color: theme.colors.textAccent,
                textAlign: 'center',
                padding: `${theme.spacing.lg}px ${theme.spacing.xl}px`,
                backgroundColor: theme.colors.backgroundLight + '80',
                borderRadius: theme.borderRadius.lg,
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
            bottom: theme.spacing.xxl,
            width: '70%',
            height: 6,
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

