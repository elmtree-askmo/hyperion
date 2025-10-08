/**
 * Title Card Component
 * Displays lesson title with animated entrance
 */
import React from 'react';
import { AbsoluteFill, Audio, Img, useCurrentFrame } from 'remotion';
import { theme, VIDEO_CONFIG } from '../styles/theme';
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
  const frame = useCurrentFrame();
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
        <AbsoluteFill style={{ opacity: 0.2 }}>
          <Img
            src={backgroundImage}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </AbsoluteFill>
      )}

      {/* Content */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.spacing.xl,
        }}
      >
        {/* Episode indicator */}
        <div
          style={{
            opacity: fadeIn,
            transform: `translateY(${(1 - slideIn) * -50}px)`,
            marginBottom: theme.spacing.md,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontFamily: theme.fonts.primary,
              color: theme.colors.textSecondary,
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: 4,
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
            marginBottom: theme.spacing.lg,
          }}
        >
          <h1
            style={{
              fontSize: 72,
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
          }}
        >
          <h2
            style={{
              fontSize: 48,
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

