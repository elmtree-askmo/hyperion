import React, { useEffect, useState } from 'react';
import { Player } from '@remotion/player';
import { InteractiveFlashcard } from './InteractiveFlashcard';
import { InteractivePractice } from './InteractivePractice';
import { useLessonStore } from '../store/lessonStore';
import { LessonComposition } from '../../../remotion/src/components/LessonComposition';
import { VIDEO_CONFIG } from '../../../remotion/src/styles/theme';
import './LessonViewer.css';

export const LessonViewer: React.FC = () => {
  const {
    lessonData,
    isPlaying,
    interactiveSegments,
    activeSegment,
    userProgress,
    videoEnded,
    currentVideoId,
    setIsPlaying,
    setCurrentLessonId,
    setVideoEnded,
    revealFlashcard,
    completePractice,
  } = useLessonStore();

  const [playerRef, setPlayerRef] = useState<any>(null);
  const [showInteractivePanel, setShowInteractivePanel] = useState(false);
  const [currentMode, setCurrentMode] = useState<'video' | 'flashcard' | 'practice'>('video');
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [episodesMetadata, setEpisodesMetadata] = useState<Array<{
    episodeNumber: number;
    title: string;
    titleTh: string;
    thumbnail: string;
    duration: number;
  }>>([]);

  // Calculate total duration
  const totalDuration = lessonData?.lesson.segmentBasedTiming[
    lessonData.lesson.segmentBasedTiming.length - 1
  ]?.endTime || 300;

  // Load episodes metadata
  useEffect(() => {
    const loadEpisodesMetadata = async () => {
      if (!lessonData) return;
      
      const episodes: Array<{
        episodeNumber: number;
        title: string;
        titleTh: string;
        thumbnail: string;
        duration: number;
      }> = [];

      for (let i = 1; i <= lessonData.lesson.totalEpisodes; i++) {
        try {
          // Load both files to get title and thumbnail
          const [microlessonResponse, synchronizedResponse] = await Promise.all([
            fetch(`/videos/${currentVideoId}/lesson_${i}/microlesson_script.json`),
            fetch(`/videos/${currentVideoId}/lesson_${i}/final_synchronized_lesson.json`),
          ]);
          
          let title = `Episode ${i}`;
          let titleTh = `บทที่ ${i}`;
          let thumbnail = '/videos/placeholder-thumbnail.jpg';
          let duration = 300;

          if (microlessonResponse.ok) {
            const microlessonData = await microlessonResponse.json();
            title = microlessonData.lesson.title || title;
            titleTh = microlessonData.lesson.titleTh || titleTh;
          }

          if (synchronizedResponse.ok) {
            const synchronizedData = await synchronizedResponse.json();
            const firstSegment = synchronizedData.lesson.segmentBasedTiming?.[0];
            thumbnail = firstSegment?.backgroundUrl || thumbnail;
            const lastSegment = synchronizedData.lesson.segmentBasedTiming?.[
              synchronizedData.lesson.segmentBasedTiming.length - 1
            ];
            duration = lastSegment?.endTime || duration;
          }

          episodes.push({
            episodeNumber: i,
            title,
            titleTh,
            thumbnail,
            duration,
          });
        } catch (error) {
          console.warn(`Could not load metadata for lesson_${i}:`, error);
          // Fallback data
          episodes.push({
            episodeNumber: i,
            title: `Episode ${i}`,
            titleTh: `บทที่ ${i}`,
            thumbnail: '/videos/placeholder-thumbnail.jpg',
            duration: 300,
          });
        }
      }
      
      setEpisodesMetadata(episodes);
    };

    loadEpisodesMetadata();
  }, [lessonData, currentVideoId]);

  // Auto-pause when encountering interactive segment
  useEffect(() => {
    if (activeSegment && !showInteractivePanel) {
      setShowInteractivePanel(true);
      if (playerRef && isPlaying) {
        playerRef.pause();
        setIsPlaying(false);
      }
    }
  }, [activeSegment, showInteractivePanel, playerRef, isPlaying, setIsPlaying]);

  // Detect video end
  useEffect(() => {
    if (!playerRef || !lessonData) return;

    const checkVideoEnd = () => {
      const currentFrame = playerRef.getCurrentFrame();
      const totalFrames = Math.ceil(totalDuration * VIDEO_CONFIG.fps);
      
      // Consider video ended if we're at the last frame or very close to it
      if (currentFrame >= totalFrames - 2) {
        setVideoEnded(true);
        setIsPlaying(false);
      }
    };

    // Check every 100ms
    const interval = setInterval(checkVideoEnd, 100);
    return () => clearInterval(interval);
  }, [playerRef, lessonData, setVideoEnded, setIsPlaying]);

  const handleFlashcardReveal = (word: string) => {
    revealFlashcard(word);
  };

  const handlePracticeComplete = (practiceId: string) => {
    completePractice(practiceId);
  };

  const handleContinue = () => {
    setShowInteractivePanel(false);
    if (playerRef) {
      playerRef.play();
      setIsPlaying(true);
    }
  };

  const handleNextPractice = () => {
    if (currentPracticeIndex < practiceSegments.length - 1) {
      setCurrentPracticeIndex(currentPracticeIndex + 1);
    }
  };

  const handlePreviousPractice = () => {
    if (currentPracticeIndex > 0) {
      setCurrentPracticeIndex(currentPracticeIndex - 1);
    }
  };

  const handleNextLesson = () => {
    if (!lessonData) return;
    
    const currentEpisode = lessonData.lesson.episodeNumber;
    const totalEpisodes = lessonData.lesson.totalEpisodes;
    
    if (currentEpisode < totalEpisodes) {
      const nextLessonId = `lesson_${currentEpisode + 1}`;
      setCurrentLessonId(nextLessonId);
      setCurrentMode('video'); // Switch back to video mode for new lesson
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
            className={`mode-button ${currentMode === 'video' ? 'active' : ''}`}
            onClick={() => setCurrentMode('video')}
          >
            📺 Video Mode
          </button>
          <button
            className={`mode-button ${currentMode === 'flashcard' ? 'active' : ''}`}
            onClick={() => setCurrentMode('flashcard')}
          >
            📚 Flashcard Mode
          </button>
          <button
            className={`mode-button ${currentMode === 'practice' ? 'active' : ''}`}
            onClick={() => setCurrentMode('practice')}
          >
            ✍️ Practice Mode
          </button>
        </div>
      </div>

      {/* Main Layout with Episode Sidebar */}
      <div className="lesson-layout">
        {/* Main Content */}
        <div className="lesson-content">
          <div className="lesson-content-inner">
        {currentMode === 'video' ? (
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

              {/* Next Lesson Overlay - Show when video ends */}
              {videoEnded && lessonData && (
                <div className="interactive-overlay next-lesson-overlay">
                  <div className="interactive-overlay-content">
                    <div className="next-lesson-content">
                      <div className="congratulations-icon">🎉</div>
                      <h2>เยี่ยมมาก!</h2>
                      <p className="completion-message">
                        คุณได้เรียนจบบทเรียนนี้แล้ว
                      </p>
                      {lessonData.lesson.episodeNumber < lessonData.lesson.totalEpisodes && (
                        <button
                          className="next-lesson-button"
                          onClick={handleNextLesson}
                        >
                          👉 Next: Lesson {lessonData.lesson.episodeNumber + 1}
                        </button>
                      )}
                      <button
                        className="replay-button"
                        onClick={() => {
                          if (playerRef) {
                            playerRef.seekTo(0);
                            setVideoEnded(false);
                          }
                        }}
                      >
                        🔄 Replay This Lesson
                      </button>
                    </div>
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
        ) : currentMode === 'flashcard' ? (
          /* Flashcard Mode */
          <div className="flashcard-mode">
            <div className="flashcard-mode-intro">
              <h2>📚 Vocabulary Review</h2>
              <p>
                Review and memorize all vocabulary from this lesson. Click each card to reveal the word and flip to see the translation.
              </p>
              <div className="flashcard-stats">
                <span>Total Cards: {flashcardSegments.length}</span>
                <span>•</span>
                <span>Mastered: {userProgress.completedFlashcards.length}</span>
              </div>
            </div>

            <div className="flashcard-mode-grid">
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
        ) : (
          /* Practice Mode */
          <div className="practice-mode">
            <div className="practice-header">
              <h2>✍️ Practice Exercises</h2>
              <div className="practice-progress-indicator">
                <span className="current-question">
                  Question {currentPracticeIndex + 1}
                </span>
                <span className="question-separator">/</span>
                <span className="total-questions">{practiceSegments.length}</span>
              </div>
            </div>

            {practiceSegments.length > 0 && (
              <>
                <div className="practice-question-container">
                  <InteractivePractice
                    key={currentPracticeIndex}
                    question={practiceSegments[currentPracticeIndex].data}
                    onComplete={() =>
                      handlePracticeComplete(
                        practiceSegments[currentPracticeIndex].data.question
                      )
                    }
                    completed={userProgress.completedPractices.includes(
                      practiceSegments[currentPracticeIndex].data.question
                    )}
                  />
                </div>

                <div className="practice-navigation">
                  <button
                    className="nav-button prev-button"
                    onClick={handlePreviousPractice}
                    disabled={currentPracticeIndex === 0}
                  >
                    ← Previous
                  </button>
                  <div className="practice-dots">
                    {practiceSegments.map((_, index) => (
                      <span
                        key={index}
                        className={`practice-dot ${
                          index === currentPracticeIndex ? 'active' : ''
                        } ${
                          userProgress.completedPractices.includes(
                            practiceSegments[index].data.question
                          )
                            ? 'completed'
                            : ''
                        }`}
                        onClick={() => setCurrentPracticeIndex(index)}
                      />
                    ))}
                  </div>
                  <button
                    className="nav-button next-button"
                    onClick={handleNextPractice}
                    disabled={currentPracticeIndex === practiceSegments.length - 1}
                  >
                    Next →
                  </button>
                </div>
              </>
            )}
          </div>
        )}
          </div>

        {/* Progress Bar - Show in Flashcard and Practice Mode */}
        {currentMode === 'flashcard' && (
          <div className="lesson-progress">
            <div className="progress-stats">
              <span>
                Flashcards: {userProgress.completedFlashcards.length} /{' '}
                {flashcardSegments.length}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${
                    (userProgress.completedFlashcards.length /
                      flashcardSegments.length) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        )}
        {currentMode === 'practice' && (
          <div className="lesson-progress">
            <div className="progress-stats">
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
                    (userProgress.completedPractices.length /
                      practiceSegments.length) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        )}
        </div>

        {/* Episode Navigation Sidebar - Right */}
        <div className="episode-sidebar">
          <div className="episode-sidebar-header">
            <h3>📚 Episodes</h3>
            <p className="episode-count">
              {lessonData.lesson.episodeNumber} / {lessonData.lesson.totalEpisodes}
            </p>
          </div>

          <div className="episode-list">
            {episodesMetadata.map((episode) => (
              <div
                key={episode.episodeNumber}
                className={`episode-card ${
                  episode.episodeNumber === lessonData.lesson.episodeNumber ? 'active' : ''
                }`}
                onClick={() => {
                  setCurrentLessonId(`lesson_${episode.episodeNumber}`);
                  setCurrentMode('video');
                }}
              >
                <div className="episode-thumbnail">
                  <img 
                    src={episode.thumbnail} 
                    alt={episode.title}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/videos/placeholder-thumbnail.jpg';
                    }}
                  />
                  <div className="episode-number-badge">{episode.episodeNumber}</div>
                  {episode.episodeNumber === lessonData.lesson.episodeNumber && (
                    <div className="playing-indicator">
                      <span className="playing-icon">▶</span>
                    </div>
                  )}
                </div>
                <div className="episode-info">
                  <h4 className="episode-title">{episode.title}</h4>
                  <p className="episode-title-th">{episode.titleTh}</p>
                  <div className="episode-meta">
                    <span className="episode-duration">
                      {Math.floor(episode.duration / 60)}:{String(Math.floor(episode.duration % 60)).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

