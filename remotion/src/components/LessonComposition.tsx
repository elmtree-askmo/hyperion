/**
 * Main Lesson Composition
 * Orchestrates all lesson segments with synchronized timing
 */
import React from 'react';
import { AbsoluteFill, Sequence, staticFile } from 'remotion';
import { TitleCard } from './TitleCard';
import { VocabularyCard } from './VocabularyCard';
import { GrammarCard } from './GrammarCard';
import { ObjectiveCard } from './ObjectiveCard';
import { PracticeCard } from './PracticeCard';
import { OutroCard } from './OutroCard';
import { VIDEO_CONFIG } from '../styles/theme';

interface TextPart {
  text: string;
  language: string;
  speakingRate?: number;
}

interface TextPartTiming {
  text: string;
  language: string;
  duration: number;
  startTime: number;
  endTime: number;
}

interface SegmentTiming {
  startTime: number;
  endTime: number;
  duration: number;
  screenElement: string;
  audioUrl: string;
  text: string;
  vocabWord?: string;
  textParts?: TextPart[];
  textPartTimings?: TextPartTiming[];
  backgroundUrl?: string;
}

interface LessonData {
  lesson: {
    title: string;
    titleTh: string;
    episodeNumber: number;
    totalEpisodes: number;
    segmentBasedTiming: SegmentTiming[];
  };
  flashcards: Array<{
    word: string;
    thaiTranslation: string;
    pronunciation: string;
    definition: string;
    thaiDefinition: string;
    memoryHook: string;
    contextExample: string;
  }>;
  audioSegments: Array<{
    id: string;
    backgroundImageDescription: string;
  }>;
}

export const LessonComposition: React.FC<{ lessonData: LessonData }> = ({
  lessonData,
}) => {
  const { lesson, flashcards } = lessonData;
  const { segmentBasedTiming } = lesson;
  const fps = VIDEO_CONFIG.fps;

  // Log for debugging
  console.log('LessonComposition rendering with:', {
    hasLesson: !!lesson,
    segmentsCount: segmentBasedTiming?.length || 0,
    title: lesson?.title,
    flashcardsCount: flashcards?.length || 0,
  });

  // If no segments, show error message
  if (!segmentBasedTiming || segmentBasedTiming.length === 0) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: '#FF6B6B',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 48,
            fontFamily: 'Arial, sans-serif',
            textAlign: 'center',
          }}
        >
          ❌ No lesson segments found!
          <br />
          <span style={{ fontSize: 32 }}>
            segmentBasedTiming is empty or undefined
          </span>
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      {segmentBasedTiming.map((segment, index) => {
        const startFrame = Math.round(segment.startTime * fps);
        const durationInFrames = Math.round(segment.duration * fps);

        // Find corresponding flashcard if it's a vocabulary card
        const flashcard = segment.vocabWord
          ? flashcards.find((f) => f.word === segment.vocabWord)
          : null;

        // Handle both local paths and remote URLs (S3, CDN, etc.)
        // If URL starts with http:// or https://, use it directly
        // Otherwise, treat as local path and use staticFile()
        const isRemoteUrl = (url: string) => url.startsWith('http://') || url.startsWith('https://');
        
        const audioUrl = segment.audioUrl
          ? isRemoteUrl(segment.audioUrl)
            ? segment.audioUrl // Use S3/CDN URL directly
            : staticFile(segment.audioUrl.replace(/^\//, '')) // Local file
          : undefined;

        const backgroundImage = segment.backgroundUrl
          ? isRemoteUrl(segment.backgroundUrl)
            ? segment.backgroundUrl // Use S3/CDN URL directly
            : staticFile(segment.backgroundUrl.replace(/^\//, '')) // Local file
          : undefined;

        // Render appropriate component based on screen element type
        let Component: React.ReactNode;

        switch (segment.screenElement) {
          case 'title_card':
            Component = (
              <TitleCard
                title={lesson.title}
                titleTh={lesson.titleTh}
                episodeNumber={lesson.episodeNumber}
                totalEpisodes={lesson.totalEpisodes}
                audioUrl={audioUrl}
                backgroundImage={backgroundImage}
              />
            );
            break;

          case 'objective_card':
            Component = (
              <ObjectiveCard
                text={segment.text}
                textParts={segment.textParts}
                textPartTimings={segment.textPartTimings}
                audioUrl={audioUrl}
                backgroundImage={backgroundImage}
                durationInFrames={durationInFrames}
              />
            );
            break;

          case 'vocabulary_card':
            if (flashcard) {
              Component = (
                <VocabularyCard
                  word={flashcard.word}
                  thaiTranslation={flashcard.thaiTranslation}
                  pronunciation={flashcard.pronunciation}
                  definition={flashcard.definition}
                  thaiDefinition={flashcard.thaiDefinition}
                  memoryHook={flashcard.memoryHook}
                  contextExample={flashcard.contextExample}
                  audioUrl={audioUrl}
                  backgroundImage={backgroundImage}
                />
              );
            } else {
              // Fallback if flashcard not found
              Component = (
                <ObjectiveCard
                  text={segment.text}
                  audioUrl={audioUrl}
                  backgroundImage={backgroundImage}
                />
              );
            }
            break;

          case 'grammar_card':
            Component = (
              <GrammarCard
                text={segment.text}
                textParts={segment.textParts}
                textPartTimings={segment.textPartTimings}
                audioUrl={audioUrl}
                backgroundImage={backgroundImage}
                durationInFrames={durationInFrames}
              />
            );
            break;

          case 'practice_card':
            Component = (
              <PracticeCard
                text={segment.text}
                textParts={segment.textParts}
                textPartTimings={segment.textPartTimings}
                audioUrl={audioUrl}
                backgroundImage={backgroundImage}
                durationInFrames={durationInFrames}
              />
            );
            break;

          case 'outro_card':
            Component = (
              <OutroCard
                text={segment.text}
                episodeNumber={lesson.episodeNumber}
                totalEpisodes={lesson.totalEpisodes}
                audioUrl={audioUrl}
                backgroundImage={backgroundImage}
              />
            );
            break;

          default:
            Component = (
              <ObjectiveCard
                text={segment.text}
                audioUrl={audioUrl}
                backgroundImage={backgroundImage}
              />
            );
        }

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={durationInFrames}
            name={`Segment ${index + 1}: ${segment.screenElement}`}
          >
            {Component}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

