import React, { useEffect, useState } from 'react';
import { Player } from '@remotion/player';
import { InteractiveFlashcard } from './InteractiveFlashcard';
import { InteractivePractice } from './InteractivePractice';
import { useLessonStore } from '../store/lessonStore';
import { LessonComposition } from '../../../remotion/src/components/LessonComposition';
import { VIDEO_CONFIG } from '../../../remotion/src/styles/theme';
import './LessonViewer.css';

interface LessonViewerProps {
  lessonId: string;
}

export const LessonViewer: React.FC<LessonViewerProps> = ({ lessonId }) => {
  const {
    lessonData,
    currentTime,
    isPlaying,
    interactiveSegments,
    activeSegment,
    userProgress,
    setCurrentTime,
    setIsPlaying,
    revealFlashcard,
    completePractice,
  } = useLessonStore();

  const [playerRef, setPlayerRef] = useState<any>(null);
  const [showInteractivePanel, setShowInteractivePanel] = useState(false);
  const [selectedFlashcard, setSelectedFlashcard] = useState<any>(null);
  const [showPracticeMode, setShowPracticeMode] = useState(false);

  // Auto-pause when encountering interactive segment
  useEffect(() => {
    if (activeSegment && !showInteractivePanel) {
      setShowInteractivePanel(true);
      if (playerRef && isPlaying) {
        playerRef.pause();
        setIsPlaying(false);
      }
    }
  }, [activeSegment, showInteractivePanel, playerRef, isPlaying]);

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleFlashcardReveal = (word: string) => {
    revealFlashcard(word);
  };

  const handlePracticeComplete = (practiceId: string, answer: string) => {
    completePractice(practiceId);
  };

  const handleContinue = () => {
    setShowInteractivePanel(false);
    if (playerRef) {
      playerRef.play();
      setIsPlaying(true);
    }
  };

  const flashcardSegments = interactiveSegments.filter(
    (seg) => seg.type === 'flashcard'
  );
  const practiceSegments = interactiveSegments.filter(
    (seg) => seg.type === 'practice'
  );

  if (!lessonData) {
    return (
      <div className="lesson-viewer-loading">
        <div className="loading-spinner" />
        <p>Loading lesson...</p>
      </div>
    );
  }

  const totalDuration =
    lessonData.lesson.segmentBasedTiming[
      lessonData.lesson.segmentBasedTiming.length - 1
    ]?.endTime || 300;

  return (
    <div className="lesson-viewer">
      {/* Header */}
      <div className="lesson-header">
        <div className="lesson-title-section">
          <h1>{lessonData.lesson.title}</h1>
          <p className="lesson-title-th">{lessonData.lesson.titleTh}</p>
          <div className="lesson-meta">
            <span>
              Episode {lessonData.lesson.episodeNumber} of{' '}
              {lessonData.lesson.totalEpisodes}
            </span>
            <span>•</span>
            <span>{Math.floor(totalDuration / 60)} minutes</span>
          </div>
        </div>
        <div className="lesson-actions">
          <button
            className={`mode-button ${!showPracticeMode ? 'active' : ''}`}
            onClick={() => setShowPracticeMode(false)}
          >
            📺 Video Mode
          </button>
          <button
            className={`mode-button ${showPracticeMode ? 'active' : ''}`}
            onClick={() => setShowPracticeMode(true)}
          >
            ✍️ Practice Mode
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lesson-content">
        {!showPracticeMode ? (
          <>
            {/* Video Player */}
            <div className="player-container">
              <Player
                ref={setPlayerRef}
                component={LessonComposition}
                inputProps={{ lessonData }}
                durationInFrames={Math.ceil(totalDuration * VIDEO_CONFIG.fps)}
                fps={VIDEO_CONFIG.fps}
                compositionWidth={VIDEO_CONFIG.width}
                compositionHeight={VIDEO_CONFIG.height}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
                controls
                loop={false}
                showVolumeControls
                clickToPlay
                doubleClickToFullscreen
                spaceKeyToPlayOrPause
                onTimeUpdate={(e) => handleTimeUpdate(e.currentTime)}
                onPlay={handlePlay}
                onPause={handlePause}
              />

              {/* Interactive Overlay */}
              {showInteractivePanel && activeSegment && (
                <div className="interactive-overlay">
                  <div className="interactive-overlay-content">
                    <div className="overlay-header">
                      <h3>⏸️ Interactive Content</h3>
                      <button
                        className="close-button"
                        onClick={handleContinue}
                      >
                        ✕
                      </button>
                    </div>
                    {activeSegment.type === 'flashcard' && (
                      <InteractiveFlashcard
                        flashcard={activeSegment.data}
                        onReveal={() =>
                          handleFlashcardReveal(activeSegment.data.word)
                        }
                        revealed={
                          userProgress.completedFlashcards.includes(
                            activeSegment.data.word
                          )
                        }
                      />
                    )}
                    <button
                      className="continue-button"
                      onClick={handleContinue}
                    >
                      Continue Lesson →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Flashcards Sidebar */}
            <div className="flashcards-sidebar">
              <h3>📚 Vocabulary Cards</h3>
              <div className="flashcards-list">
                {flashcardSegments.map((segment, index) => (
                  <div
                    key={index}
                    className={`flashcard-item ${
                      userProgress.completedFlashcards.includes(
                        segment.data.word
                      )
                        ? 'completed'
                        : ''
                    }`}
                    onClick={() => {
                      setSelectedFlashcard(segment);
                      if (playerRef) {
                        playerRef.seekTo(
                          Math.round(segment.startTime * VIDEO_CONFIG.fps)
                        );
                      }
                    }}
                  >
                    <div className="flashcard-item-header">
                      <span className="flashcard-word">
                        {segment.data.word}
                      </span>
                      {userProgress.completedFlashcards.includes(
                        segment.data.word
                      ) && <span className="check-icon">✓</span>}
                    </div>
                    <span className="flashcard-translation">
                      {segment.data.thaiTranslation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Practice Mode */
          <div className="practice-mode">
            <div className="practice-intro">
              <h2>✍️ Practice Exercises</h2>
              <p>
                Complete these exercises to reinforce what you've learned in
                this lesson.
              </p>
            </div>

            <div className="practices-list">
              {practiceSegments.map((segment, index) => (
                <InteractivePractice
                  key={index}
                  question={segment.data}
                  onComplete={(answer) =>
                    handlePracticeComplete(segment.data.question, answer)
                  }
                  completed={userProgress.completedPractices.includes(
                    segment.data.question
                  )}
                />
              ))}
            </div>

            {/* All Flashcards in Practice Mode */}
            <div className="practice-flashcards">
              <h2>📚 Review Vocabulary</h2>
              {flashcardSegments.map((segment, index) => (
                <InteractiveFlashcard
                  key={index}
                  flashcard={segment.data}
                  onReveal={() => handleFlashcardReveal(segment.data.word)}
                  revealed={userProgress.completedFlashcards.includes(
                    segment.data.word
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar - Only show in Practice Mode */}
      {showPracticeMode && (
        <div className="lesson-progress">
          <div className="progress-stats">
            <span>
              Flashcards: {userProgress.completedFlashcards.length} /{' '}
              {flashcardSegments.length}
            </span>
            <span>
              Practices: {userProgress.completedPractices.length} /{' '}
              {practiceSegments.length}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${
                  ((userProgress.completedFlashcards.length +
                    userProgress.completedPractices.length) /
                    (flashcardSegments.length + practiceSegments.length)) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

