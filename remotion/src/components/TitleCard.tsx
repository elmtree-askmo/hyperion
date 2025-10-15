/**
 * Title Card Component
 * Displays lesson title with animated entrance
 */
import React from 'react';
import { AbsoluteFill, Audio, Img } from 'remotion';
import { theme } from '../styles/theme';
import { useFadeIn, useSlideIn, useScaleIn } from '../utils/animation';

interface TitleCardProps {
  title: string;
  titleTh: string;
  episodeNumber: number;
  totalEpisodes: number;
  audioUrl?: string;
  backgroundImage?: string;
}

export const TitleCard: React.FC<TitleCardProps> = ({
  title,
  titleTh,
  episodeNumber,
  totalEpisodes,
  audioUrl,
  backgroundImage,
}) => {
  const slideIn = useSlideIn(0);
  const fadeIn = useFadeIn(10, 20);
  const scale = useScaleIn(5);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.background }}>
      {/* Background gradient */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${theme.colors.backgroundLight} 0%, ${theme.colors.background} 100%)`,
        }}
      />

      {/* Background image if provided */}
      {backgroundImage && (
        <AbsoluteFill style={{ opacity: 0.7 }}>
          <Img
            src={backgroundImage}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        </AbsoluteFill>
      )}

      {/* Content - Responsive layout for both 1:1 preview and 9:16 export */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: `${theme.spacing.xxl}px ${theme.spacing.xl}px`,
        }}
      >
        {/* Episode indicator */}
        <div
          style={{
            opacity: fadeIn,
            transform: `translateY(${(1 - slideIn) * -50}px)`,
            marginBottom: theme.spacing.xl,
          }}
        >
          <div
            style={{
              fontSize: 40,
              fontFamily: theme.fonts.primary,
              color: theme.colors.textSecondary,
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: 6,
            }}
          >
            Lesson {episodeNumber} of {totalEpisodes}
          </div>
        </div>

        {/* Main title */}
        <div
          style={{
            opacity: fadeIn,
            transform: `scale(${scale})`,
            marginBottom: theme.spacing.xxl,
            padding: `0 ${theme.spacing.md}px`,
          }}
        >
          <h1
            style={{
              fontSize: 88,
              fontFamily: theme.fonts.heading,
              color: theme.colors.text,
              textAlign: 'center',
              margin: 0,
              lineHeight: 1.2,
              textShadow: theme.shadows.lg,
            }}
          >
            {title}
          </h1>
        </div>

        {/* Thai title */}
        <div
          style={{
            opacity: fadeIn,
            transform: `translateY(${(1 - slideIn) * 50}px)`,
            padding: `0 ${theme.spacing.md}px`,
          }}
        >
          <h2
            style={{
              fontSize: 64,
              fontFamily: theme.fonts.primary,
              color: theme.colors.textAccent,
              textAlign: 'center',
              margin: 0,
              lineHeight: 1.4,
              textShadow: theme.shadows.md,
            }}
          >
            {titleTh}
          </h2>
        </div>

        {/* Decorative elements */}
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

