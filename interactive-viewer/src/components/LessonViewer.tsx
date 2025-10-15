import React, { useEffect, useState, useRef } from 'react';
import { Player } from '@remotion/player';
import { InteractiveFlashcard } from './InteractiveFlashcard';
import { InteractivePractice } from './InteractivePractice';
import { PracticePauseOverlay } from './PracticePauseOverlay';
import { VocabularyPauseOverlay } from './VocabularyPauseOverlay';
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
    currentPracticePhrase,
    isPracticePaused,
    currentVocabularyWord,
    isVocabularyPaused,
    setIsPlaying,
    setCurrentLessonId,
    setVideoEnded,
    setCurrentPracticePhrase,
    setIsPracticePaused,
    setCurrentVocabularyWord,
    setIsVocabularyPaused,
    completePracticePhrase,
    markVocabularyReviewed,
    revealFlashcard,
    completePractice,
  } = useLessonStore();

  const [playerRef, setPlayerRef] = useState<any>(null);
  const [showInteractivePanel, setShowInteractivePanel] = useState(false);
  const [currentMode, setCurrentMode] = useState<'video' | 'flashcard' | 'practice'>('video');
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [lastCheckedTime, setLastCheckedTime] = useState(0);
  const [lastPausedTime, setLastPausedTime] = useState(0);
  const [lastVocabPausedTime, setLastVocabPausedTime] = useState(0);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  // Use ref to track just-clicked vocabulary (doesn't trigger re-render)
  const justClickedVocabRef = useRef<string | null>(null);
  // Track the timeout to clear it on new clicks
  const vocabClickTimeoutRef = useRef<number | null>(null);
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

  // Auto-pause for practice mode (always enabled for practice_card segments)
  useEffect(() => {
    if (!playerRef || !lessonData || currentMode !== 'video' || isPracticePaused) {
      return;
    }

    const checkForPracticeSegments = () => {
      const currentFrame = playerRef.getCurrentFrame();
      const currentTime = currentFrame / VIDEO_CONFIG.fps;

      // Avoid checking the same time multiple times (but allow re-checking after 0.2s)
      if (Math.abs(currentTime - lastCheckedTime) < 0.2) return;
      
      // Cooldown period after pausing - prevent immediate re-trigger
      // If we just paused within the last 1.5 seconds, skip checking
      if (lastPausedTime > 0 && currentTime - lastPausedTime < 1.5) {
        return;
      }
      
      setLastCheckedTime(currentTime);

      // Debug: Log current position (only occasionally to reduce noise)
      if (Math.abs(currentTime - lastCheckedTime) > 1) {
        console.log('🔍 Checking at time:', currentTime.toFixed(2));
      }

      // Find ONLY practice_card segments with English textParts
      const segments = lessonData.lesson.segmentBasedTiming;
      
      for (const segment of segments) {
        // ONLY trigger for practice_card segments
        if (segment.screenElement !== 'practice_card') continue;
        
        if (!segment.textPartTimings || segment.textPartTimings.length === 0) continue;

        // Check each textPart timing for English phrases
        for (const timing of segment.textPartTimings) {
          if (timing.language !== 'en') continue;

          const absoluteStartTime = segment.startTime + timing.startTime;
          const absoluteEndTime = segment.startTime + timing.endTime;

          // Check if we're currently playing this English phrase (not after it ends)
          // Trigger pause slightly before the end to show overlay while still on the phrase
          const pauseTriggerTime = absoluteEndTime - 0.3; // 300ms before end
          const isInPhrase = currentTime >= absoluteStartTime && currentTime <= absoluteEndTime;
          const shouldTriggerPause = currentTime >= pauseTriggerTime && currentTime < absoluteEndTime;
          
          if (
            isInPhrase &&
            shouldTriggerPause &&
            !userProgress.practicedPhrases.includes(timing.text)
          ) {
            // Debug log
            console.log('🎤 Practice pause triggered:', {
              phrase: timing.text,
              currentTime: currentTime.toFixed(2),
              phraseWindow: `${absoluteStartTime.toFixed(2)} - ${absoluteEndTime.toFixed(2)}`,
              pauseTriggerTime: pauseTriggerTime.toFixed(2),
              segment: segment.screenElement,
              isPlaying,
            });

            // Pause immediately at current position to show overlay while phrase is visible
            playerRef.pause();
            setIsPlaying(false);
            setCurrentPracticePhrase(timing.text);
            setIsPracticePaused(true);
            setLastPausedTime(currentTime);
            return;
          }
        }
      }
    };

    const interval = setInterval(checkForPracticeSegments, 100);
    return () => clearInterval(interval);
  }, [
    playerRef,
    lessonData,
    currentMode,
    isPracticePaused,
    isPlaying,
    userProgress.practicedPhrases,
    lastCheckedTime,
    lastPausedTime,
    setIsPlaying,
    setCurrentPracticePhrase,
    setIsPracticePaused,
  ]);

  // Auto-pause for vocabulary cards (at the end of each vocabulary_card segment)
  useEffect(() => {
    if (!playerRef || !lessonData || currentMode !== 'video' || isVocabularyPaused) {
      return;
    }

    const checkForVocabularySegmentEnd = () => {
      const currentFrame = playerRef.getCurrentFrame();
      const currentTime = currentFrame / VIDEO_CONFIG.fps;

      // Cooldown period after pausing - prevent immediate re-trigger
      if (lastVocabPausedTime > 0 && currentTime - lastVocabPausedTime < 1.5) {
        return;
      }

      // Find vocabulary_card segments
      const segments = lessonData.lesson.segmentBasedTiming;
      
      for (const segment of segments) {
        // ONLY trigger for vocabulary_card segments
        if (segment.screenElement !== 'vocabulary_card') continue;
        
        if (!segment.vocabWord) continue;

        // Check if we've already reviewed this word
        if (userProgress.reviewedVocabulary.includes(segment.vocabWord)) continue;

        // Skip if user just clicked to jump (using ref for immediate check)
        // "*" means skip all detection (user is manually navigating)
        if (justClickedVocabRef.current === "*") continue;

        // Check if we're currently IN this vocabulary card segment
        // Trigger pause slightly before the end to show overlay while still displaying the card
        const pauseTriggerTime = segment.endTime - 0.3; // 300ms before end
        const isInSegment = currentTime >= segment.startTime && currentTime <= segment.endTime;
        const shouldTriggerPause = currentTime >= pauseTriggerTime && currentTime < segment.endTime;
        
        if (isInSegment && shouldTriggerPause) {
          // Debug log
          console.log('📚 Vocabulary pause triggered:', {
            word: segment.vocabWord,
            currentTime: currentTime.toFixed(2),
            segmentStart: segment.startTime.toFixed(2),
            segmentEnd: segment.endTime.toFixed(2),
            pauseTriggerTime: pauseTriggerTime.toFixed(2),
            segment: segment.screenElement,
            isPlaying,
          });

          // Find the flashcard data for this word
          const flashcard = lessonData.flashcards.find(f => f.word === segment.vocabWord);
          
          if (flashcard) {
            // Pause immediately at current position to show overlay while card is visible
            playerRef.pause();
            setIsPlaying(false);
            setCurrentVocabularyWord(segment.vocabWord);
            setIsVocabularyPaused(true);
            setLastVocabPausedTime(currentTime);
          }
          return;
        }
      }
    };

    const interval = setInterval(checkForVocabularySegmentEnd, 100);
    return () => clearInterval(interval);
  }, [
    playerRef,
    lessonData,
    currentMode,
    isVocabularyPaused,
    isPlaying,
    userProgress.reviewedVocabulary,
    lastVocabPausedTime,
    setIsPlaying,
    setCurrentVocabularyWord,
    setIsVocabularyPaused,
  ]);

  // Monitor playback state changes - close overlays if user manually plays video
  useEffect(() => {
    if (!playerRef) return;

    // Check if player is actually playing
    // The Remotion Player doesn't have a direct isPlaying() method, 
    // so we monitor frame changes to detect if video is playing
    let lastFrame = playerRef.getCurrentFrame();
    let consecutiveChanges = 0;
    const requiredConsecutiveChanges = 2; // Need 2+ consecutive changes to confirm playback
    
    const checkInterval = setInterval(() => {
      const currentFrame = playerRef.getCurrentFrame();
      const frameChanged = currentFrame !== lastFrame;
      
      if (frameChanged) {
        consecutiveChanges++;
      } else {
        consecutiveChanges = 0; // Reset if no change detected
      }
      
      lastFrame = currentFrame;

      // Only close overlays if we have consecutive frame changes (real playback)
      // This prevents closing when we just seeked to a new position
      if (consecutiveChanges >= requiredConsecutiveChanges) {
        if (isPracticePaused) {
          console.log('📹 Video resumed during practice pause - closing overlay');
          setIsPracticePaused(false);
          setCurrentPracticePhrase(null);
          setIsPlaying(true);
          consecutiveChanges = 0; // Reset after closing
        }
        if (isVocabularyPaused) {
          console.log('📹 Video resumed during vocabulary pause - closing overlay');
          setIsVocabularyPaused(false);
          setCurrentVocabularyWord(null);
          setIsPlaying(true);
          consecutiveChanges = 0; // Reset after closing
        }
      }
    }, 100); // Check every 100ms

    return () => {
      clearInterval(checkInterval);
    };
  }, [
    playerRef,
    isPracticePaused,
    isVocabularyPaused,
    setIsPracticePaused,
    setCurrentPracticePhrase,
    setIsVocabularyPaused,
    setCurrentVocabularyWord,
    setIsPlaying,
  ]);

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

  const handlePracticeContinue = () => {
    // Mark as practiced to prevent re-triggering
    if (currentPracticePhrase) {
      completePracticePhrase(currentPracticePhrase);
    }
    
    setIsPracticePaused(false);
    setCurrentPracticePhrase(null);
    
    if (playerRef) {
      playerRef.play();
      setIsPlaying(true);
    }
  };

  const handlePracticeReplay = () => {
    // Find the segment containing the current practice phrase
    if (currentPracticePhrase && lessonData && playerRef) {
      console.log('🔄 Replaying phrase:', currentPracticePhrase);
      
      // Search through ONLY practice_card segments
      for (const segment of lessonData.lesson.segmentBasedTiming) {
        // Only look in practice_card segments
        if (segment.screenElement !== 'practice_card') continue;
        
        if (segment.textPartTimings) {
          const timing = segment.textPartTimings.find(
            t => t.text === currentPracticePhrase && t.language === 'en'
          );
          
          if (timing) {
            // Seek to the start of this specific phrase within the segment
            const phraseStartTime = segment.startTime + timing.startTime;
            const startFrame = Math.round(phraseStartTime * VIDEO_CONFIG.fps);
            
            console.log('🔄 Found phrase in segment:', {
              segment: segment.screenElement,
              segmentStart: segment.startTime.toFixed(2),
              phraseStart: phraseStartTime.toFixed(2),
              frame: startFrame,
            });
            
            playerRef.seekTo(startFrame);
            
            // Reset cooldown timer to allow re-triggering after replay finishes
            // Use phrase start time as reference to allow cooldown to work properly
            setLastPausedTime(phraseStartTime - 2);
            
            // Close the overlay and play
            setIsPracticePaused(false);
            setCurrentPracticePhrase(null);
            playerRef.play();
            setIsPlaying(true);
            return;
          }
        }
      }
      
      console.warn('⚠️ Could not find phrase in segments:', currentPracticePhrase);
    }
  };

  const handleVocabularyContinue = () => {
    // Mark as reviewed to prevent re-triggering
    if (currentVocabularyWord) {
      markVocabularyReviewed(currentVocabularyWord);
    }
    
    setIsVocabularyPaused(false);
    setCurrentVocabularyWord(null);
    
    if (playerRef) {
      playerRef.play();
      setIsPlaying(true);
    }
  };

  const handleVocabularyReplay = () => {
    // Find the segment for the current vocabulary word
    if (currentVocabularyWord && lessonData && playerRef) {
      const segment = lessonData.lesson.segmentBasedTiming.find(
        seg => seg.screenElement === 'vocabulary_card' && seg.vocabWord === currentVocabularyWord
      );
      
      if (segment) {
        // Seek to the start of the vocabulary card
        const startFrame = Math.round(segment.startTime * VIDEO_CONFIG.fps);
        playerRef.seekTo(startFrame);
        
        // Reset the cooldown timer to allow re-triggering after replay finishes
        // Use segment start time as reference to allow cooldown to work properly
        setLastVocabPausedTime(segment.startTime - 2);
        
        // Close the overlay and play
        setIsVocabularyPaused(false);
        setCurrentVocabularyWord(null);
        playerRef.play();
        setIsPlaying(true);
      }
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
      {/* Debug Panel Toggle Button (Only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => setShowDebugPanel(!showDebugPanel)}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            background: showDebugPanel ? 'rgba(59, 130, 246, 0.9)' : 'rgba(0, 0, 0, 0.6)',
            color: '#fff',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            padding: '12px',
            borderRadius: '50%',
            fontSize: '20px',
            cursor: 'pointer',
            zIndex: 9999,
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
          title={showDebugPanel ? 'Hide Debug Info' : 'Show Debug Info'}
        >
          🐛
        </button>
      )}

      {/* Debug Panel (Only in development) */}
      {process.env.NODE_ENV === 'development' && showDebugPanel && (
        <div style={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          background: 'rgba(0, 0, 0, 0.95)',
          color: '#fff',
          padding: '16px',
          borderRadius: '12px',
          fontSize: '11px',
          zIndex: 9998,
          maxWidth: '320px',
          fontFamily: 'monospace',
          lineHeight: '1.6',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        }}>
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: '12px', 
            borderBottom: '2px solid rgba(59, 130, 246, 0.5)', 
            paddingBottom: '8px',
            fontSize: '13px',
            color: '#3b82f6',
          }}>
            🐛 Debug Info
          </div>
          <div>Is Paused: {isPracticePaused ? '⏸️ Yes' : '▶️ No'}</div>
          <div>Mode: {currentMode}</div>
          <div>Playing: {isPlaying ? '▶️ Yes' : '⏸️ No'}</div>
          <div>Practiced: {userProgress.practicedPhrases.length} phrases</div>
          {playerRef && (
            <>
              <div>Current Time: {(playerRef.getCurrentFrame() / VIDEO_CONFIG.fps).toFixed(2)}s</div>
              {lastPausedTime > 0 && (
                <div style={{ color: '#facc15' }}>
                  Cooldown: {Math.max(0, 3 - ((playerRef.getCurrentFrame() / VIDEO_CONFIG.fps) - lastPausedTime)).toFixed(1)}s
                </div>
              )}
              <div style={{ marginTop: '12px', fontSize: '10px', color: '#888', borderTop: '1px solid #333', paddingTop: '8px' }}>
                💡 Check console for "🔍 Checking" logs
              </div>
            </>
          )}
          {currentPracticePhrase && (
            <div style={{ marginTop: '12px', padding: '8px', background: '#1a1a1a', borderRadius: '6px', border: '1px solid #333' }}>
              <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>Current Phrase:</div>
              <div style={{ color: '#10b981' }}>{currentPracticePhrase.substring(0, 40)}{currentPracticePhrase.length > 40 ? '...' : ''}</div>
            </div>
          )}
        </div>
      )}

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

              {/* Practice Pause Overlay */}
              {isPracticePaused && currentPracticePhrase && (
                <PracticePauseOverlay
                  phrase={currentPracticePhrase}
                  thaiTranslation={undefined}
                  onContinue={handlePracticeContinue}
                  onReplay={handlePracticeReplay}
                  isPracticed={userProgress.practicedPhrases.includes(currentPracticePhrase)}
                />
              )}

              {/* Vocabulary Pause Overlay */}
              {isVocabularyPaused && currentVocabularyWord && lessonData && (
                (() => {
                  const flashcard = lessonData.flashcards.find(f => f.word === currentVocabularyWord);
                  return flashcard ? (
                    <VocabularyPauseOverlay
                      word={flashcard.word}
                      thaiTranslation={flashcard.thaiTranslation}
                      pronunciation={flashcard.pronunciation}
                      onContinue={handleVocabularyContinue}
                      onReplay={handleVocabularyReplay}
                      isReviewed={userProgress.reviewedVocabulary.includes(currentVocabularyWord)}
                    />
                  ) : null;
                })()
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
                        // Clear any existing timeout from previous clicks
                        if (vocabClickTimeoutRef.current) {
                          clearTimeout(vocabClickTimeoutRef.current);
                        }
                        
                        // Set ref to "*" to skip ALL pause detection temporarily
                        // This prevents triggering any vocabulary pause overlay
                        // when user is manually jumping to a specific word
                        justClickedVocabRef.current = "*";
                        
                        // Seek to position
                        playerRef.seekTo(
                          Math.round(segment.startTime * VIDEO_CONFIG.fps)
                        );
                        
                        // Clear the ref after a short delay to allow next detection
                        // This allows normal pause behavior if user continues watching
                        vocabClickTimeoutRef.current = setTimeout(() => {
                          justClickedVocabRef.current = null;
                          vocabClickTimeoutRef.current = null;
                        }, 3000);
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

