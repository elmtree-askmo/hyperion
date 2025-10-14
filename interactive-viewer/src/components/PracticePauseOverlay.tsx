import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './PracticePauseOverlay.css';

interface PracticePauseOverlayProps {
  phrase: string;
  thaiTranslation?: string;
  onContinue: () => void;
  onReplay: () => void;
  isPracticed: boolean;
}

export const PracticePauseOverlay: React.FC<PracticePauseOverlayProps> = ({
  phrase,
  thaiTranslation,
  onContinue,
  onReplay,
  isPracticed,
}) => {
  const handleContinue = () => {
    onContinue();
  };

  const handleReplay = () => {
    onReplay();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="practice-pause-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="practice-pause-backdrop" />
        
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
            <div className="phrase-text">{phrase}</div>
            {thaiTranslation && (
              <div className="phrase-translation">{thaiTranslation}</div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="practice-actions">
            <button
              className="practice-action-button replay-button"
              onClick={handleReplay}
            >
              🔄 Replay This Phrase
            </button>
            
            <button
              className="practice-action-button continue-button"
              onClick={handleContinue}
            >
              Next Phrase →
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

