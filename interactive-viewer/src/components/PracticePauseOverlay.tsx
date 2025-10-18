import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './PracticePauseOverlay.css';

interface PracticePauseOverlayProps {
  phrase: string;
  thaiTranslation?: string;
  onContinue: () => void;
  onMarkPracticed: () => void;
  onReplay: () => void;
  isPracticed: boolean;
}

export const PracticePauseOverlay: React.FC<PracticePauseOverlayProps> = ({
  phrase,
  thaiTranslation,
  onContinue,
  onMarkPracticed,
  onReplay,
  isPracticed,
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      onContinue();
    }
  }, [countdown, onContinue]);

  const handleContinue = () => {
    onContinue();
  };

  const handlePractice = () => {
    if (!isPracticed) {
      onMarkPracticed();
    }
  };

  const handleQuickContinue = () => {
    setCountdown(3);
  };

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real implementation, this would integrate with Web Audio API
    // to record the user's voice
  };

  return (
    <AnimatePresence>
      <motion.div
        className="practice-pause-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="practice-pause-backdrop" onClick={handleContinue} />
        
        <motion.div
          className="practice-pause-content"
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="practice-pause-header">
            <h2>🎤 Practice Time!</h2>
            {isPracticed && <span className="practiced-badge">✓ Practiced</span>}
            <button className="close-button" onClick={handleContinue}>
              ✕
            </button>
          </div>

          {/* Phrase Display */}
          <div className="practice-phrase-display">
            <div className="phrase-label">Practice this phrase:</div>
            <div className="phrase-text-container">
              <div className="phrase-text">
              <button 
                className="replay-phrase-button"
                onClick={onReplay}
                title="Replay pronunciation"
                aria-label="Replay pronunciation"
              >
                🔊
              </button>
              {phrase}
              </div>
            </div>
            {thaiTranslation && (
              <div className="phrase-translation">{thaiTranslation}</div>
            )}
          </div>

          {/* Countdown Display */}
          {countdown !== null && (
            <motion.div
              className="countdown-display"
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={countdown}
            >
              {countdown > 0 ? countdown : '▶️'}
            </motion.div>
          )}

          {/* Instructions */}
          <div className="practice-instructions">
            <div className="instruction-item">
              <span className="instruction-icon">👂</span>
              <span>Listen carefully to the pronunciation</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-icon">🗣️</span>
              <span>Say it out loud 2-3 times</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-icon">✅</span>
              <span>Mark as practiced when ready</span>
            </div>
          </div>

          {/* Recording Simulation (Future Feature) */}
          <div className="recording-section">
            <button
              className={`recording-button ${isRecording ? 'recording' : ''}`}
              onClick={handleToggleRecording}
              disabled
              title="Recording feature coming soon!"
            >
              {isRecording ? (
                <>
                  <span className="recording-indicator">●</span>
                  Recording...
                </>
              ) : (
                <>
                  <span className="mic-icon">🎙️</span>
                  Record Your Voice (Coming Soon)
                </>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="practice-actions">
            <button
              className="practice-action-button mark-practiced"
              onClick={handlePractice}
              disabled={isPracticed}
            >
              {isPracticed ? '✓ Already Practiced' : '✓ Mark as Practiced'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

