import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Player } from '@remotion/player';
import { InteractiveFlashcard } from './InteractiveFlashcard';
import { InteractivePractice } from './InteractivePractice';
import { PracticePauseOverlay } from './PracticePauseOverlay';
import { useLessonStore } from '../store/lessonStore';
import { LessonComposition } from '../remotion/components/LessonComposition';
import { VIDEO_CONFIG } from '../remotion/styles/theme';
import './LessonViewer.css';

// Get API base URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Generate a placeholder thumbnail SVG for a given episode number
const generatePlaceholderThumbnail = (episodeNumber: number): string => {
  return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EEpisode ${episodeNumber}%3C/text%3E%3C/svg%3E`;
};

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
  const [currentMode, setCurrentMode] = useState<'video' | 'practice'>('video');
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [lastCheckedTime, setLastCheckedTime] = useState(0);
  const [lastPausedTime, setLastPausedTime] = useState(0);
  const [lastPausedPhrase, setLastPausedPhrase] = useState<string | null>(null);
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

  // Helper function to get Thai translation for a practice phrase
  const getThaiTranslationForPhrase = (englishPhrase: string): string | undefined => {
    if (!lessonData) return undefined;
    
    // Search through all segments to find the English phrase in textPartTimings
    for (const segment of lessonData.lesson.segmentBasedTiming) {
      if (segment.screenElement !== 'practice_card') continue;
      
      if (!segment.textPartTimings || segment.textPartTimings.length === 0) continue;
      
      // Check each textPartTiming for the English phrase
      for (const timing of segment.textPartTimings) {
        if (timing.language === 'en' && timing.text === englishPhrase && timing.thaiTranslation) {
          return timing.thaiTranslation;
        }
      }
    }
    
    return undefined;
  };

  // Memoize inputProps for Player to avoid re-creating the object
  const playerInputProps = useMemo(() => ({
    lessonData: {
      lesson: lessonData.lesson,
      flashcards: lessonData.flashcards || [],
      audioSegments: lessonData.audioSegments || [],
    }
  }), [lessonData]);

  // Load episodes metadata using the new API
  useEffect(() => {
    const loadEpisodesMetadata = async () => {
      if (!currentVideoId) return;
      
      try {
        // Use the dedicated episodes metadata API endpoint
        const response = await fetch(`${API_BASE_URL}/api/v1/video-transform/lessons/${currentVideoId}/episodes`);
        
        if (response.ok) {
          const data = await response.json();
          setEpisodesMetadata(data.episodes || []);
        } else {
          console.warn('Failed to load episodes metadata from API');
          // Fallback: generate basic metadata with default 3 episodes
          const fallbackEpisodes = Array.from({ length: 3 }, (_, i) => ({
            episodeNumber: i + 1,
            title: `Episode ${i + 1}`,
            titleTh: `บทที่ ${i + 1}`,
            thumbnail: generatePlaceholderThumbnail(i + 1),
            duration: 300,
          }));
          setEpisodesMetadata(fallbackEpisodes);
        }
      } catch (error) {
        console.error('Error loading episodes metadata:', error);
        // Fallback: generate basic metadata with default 3 episodes
        const fallbackEpisodes = Array.from({ length: 3 }, (_, i) => ({
          episodeNumber: i + 1,
          title: `Episode ${i + 1}`,
          titleTh: `บทที่ ${i + 1}`,
          thumbnail: generatePlaceholderThumbnail(i + 1),
          duration: 300,
        }));
        setEpisodesMetadata(fallbackEpisodes);
      }
    };

    loadEpisodesMetadata();
  }, [currentVideoId]); // Only depend on currentVideoId to avoid duplicate requests

  // Auto-pause when encountering interactive segment (DISABLED for flashcards - using vocabulary pause instead)
  useEffect(() => {
    // Skip flashcard segments - they're now handled by vocabulary pause overlay
    if (activeSegment && activeSegment.type !== 'flashcard' && !showInteractivePanel) {
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
      
      setLastCheckedTime(currentTime);

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

          // Check if we've just reached or passed the end of this English phrase
          // Trigger pause right at the end when the phrase finishes playing
          const pauseTriggerTime = absoluteEndTime - 0.05; // Trigger 50ms before end to catch it reliably
          const hasPhraseJustEnded = currentTime >= pauseTriggerTime && currentTime <= absoluteEndTime + 0.2;
          
          if (
            hasPhraseJustEnded &&
            !userProgress.practicedPhrases.includes(timing.text)
          ) {
            // Only prevent re-trigger if it's the SAME phrase within cooldown period
            const isSamePhraseWithinCooldown = 
              timing.text === lastPausedPhrase && 
              lastPausedTime > 0 && 
              currentTime - lastPausedTime < 0.5;
            
            if (isSamePhraseWithinCooldown) {
              continue; // Skip this phrase but check others
            }
            
            // Pause immediately at current position to show overlay while phrase is visible
            playerRef.pause();
            setIsPlaying(false);
            setCurrentPracticePhrase(timing.text);
            setIsPracticePaused(true);
            setLastPausedTime(currentTime);
            setLastPausedPhrase(timing.text);
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
    lastPausedPhrase,
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
        if (userProgress.reviewedVocabulary.includes(segment.vocabWord)) {
          continue;
        }

        // Skip if user just clicked to jump (using ref for immediate check)
        // "*" means skip all detection (user is manually navigating)
        if (justClickedVocabRef.current === "*") continue;

        // Check if we've just reached or passed the end of this vocabulary card segment
        // Trigger pause right at the end when the card finishes displaying
        const pauseTriggerTime = segment.endTime - 0.05; // Trigger 50ms before end to catch it reliably
        const hasSegmentJustEnded = currentTime >= pauseTriggerTime && currentTime <= segment.endTime + 0.2;
        
        if (hasSegmentJustEnded) {

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

  // Auto-reveal flashcard when vocabulary overlay appears
  useEffect(() => {
    if (isVocabularyPaused && currentVocabularyWord) {
      // Auto-reveal the flashcard when the overlay is shown
      if (!userProgress.completedFlashcards.includes(currentVocabularyWord)) {
        handleFlashcardReveal(currentVocabularyWord);
      }
    }
  }, [isVocabularyPaused, currentVocabularyWord]);

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
          setIsPracticePaused(false);
          setCurrentPracticePhrase(null);
          setIsPlaying(true);
          consecutiveChanges = 0; // Reset after closing
        }
        if (isVocabularyPaused) {
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
    // Update last paused time and phrase to prevent immediate re-trigger
    if (playerRef) {
      const currentTime = playerRef.getCurrentFrame() / VIDEO_CONFIG.fps;
      setLastPausedTime(currentTime);
      setLastPausedPhrase(currentPracticePhrase);
    }
    
    setIsPracticePaused(false);
    setCurrentPracticePhrase(null);
    
    if (playerRef) {
      playerRef.play();
      setIsPlaying(true);
    }
  };

  const handleMarkPracticed = () => {
    // Mark as practiced to prevent re-triggering
    if (currentPracticePhrase) {
      completePracticePhrase(currentPracticePhrase);
    }
    
    // Close the overlay and continue playing
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
      {import.meta.env.DEV && (
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
      {import.meta.env.DEV && showDebugPanel && (
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
          <div>Is Paused: {isPracticePaused || isVocabularyPaused ? '⏸️ Yes' : '▶️ No'}</div>
          <div>Mode: {currentMode}</div>
          <div>Playing: {isPlaying ? '▶️ Yes' : '⏸️ No'}</div>
          <div>Practiced: {userProgress.practicedPhrases.length} phrases</div>
          {playerRef && (
            <div>Current Time: {(playerRef.getCurrentFrame() / VIDEO_CONFIG.fps).toFixed(2)}s</div>
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
            📺 Instruction Mode
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
        {/* Episode Navigation Sidebar - Left */}
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
                      const placeholderUrl = generatePlaceholderThumbnail(episode.episodeNumber);
                      // Prevent infinite loop: only set fallback if not already a data URI
                      if (!target.src.startsWith('data:')) {
                        target.src = placeholderUrl;
                      }
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
                inputProps={playerInputProps}
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
                <div 
                  className="practice-pause-overlay-wrapper"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999,
                  }}
                >
                  <PracticePauseOverlay
                    phrase={currentPracticePhrase}
                    thaiTranslation={getThaiTranslationForPhrase(currentPracticePhrase)}
                    onContinue={handlePracticeContinue}
                    onMarkPracticed={handleMarkPracticed}
                    onReplay={handlePracticeReplay}
                    isPracticed={userProgress.practicedPhrases.includes(currentPracticePhrase)}
                  />
                </div>
              )}

              {/* Vocabulary Pause Overlay - Now uses InteractiveFlashcard */}
              {isVocabularyPaused && currentVocabularyWord && lessonData && 
                lessonData.flashcards.find(f => f.word === currentVocabularyWord) && (
                <div 
                  className="vocabulary-pause-overlay"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                  }}
                >
                  <div 
                    className="vocabulary-pause-backdrop"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      backdropFilter: 'blur(4px)',
                      zIndex: 1,
                    }}
                  />
                  <div 
                    className="vocabulary-flashcard-content"
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
                      borderRadius: '24px',
                      padding: '32px',
                      maxWidth: '800px',
                      width: '90%',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      border: '2px solid rgba(168, 85, 247, 0.6)',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                    }}
                  >
                    <button 
                      className="vocabulary-close-button" 
                      onClick={handleVocabularyContinue}
                      style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        zIndex: 10,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    >
                      ✕
                    </button>
                    
                    <div className="vocabulary-flashcard-header">
                      <h2>📚 New Word</h2>
                      {userProgress.reviewedVocabulary.includes(currentVocabularyWord) && (
                        <span className="reviewed-badge">✓ Reviewed</span>
                      )}
                    </div>
                    
                    <InteractiveFlashcard
                      flashcard={lessonData.flashcards.find(f => f.word === currentVocabularyWord)!}
                      onReveal={() => {
                        // Auto-reveal when shown in overlay
                        if (!userProgress.completedFlashcards.includes(currentVocabularyWord)) {
                          handleFlashcardReveal(currentVocabularyWord);
                        }
                      }}
                      revealed={true}
                    />
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

            {/* Vocabulary Sidebar */}
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
        </div>
      </div>
    </div>
  );
};

