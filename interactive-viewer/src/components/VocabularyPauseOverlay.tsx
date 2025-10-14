import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './VocabularyPauseOverlay.css';

interface VocabularyPauseOverlayProps {
  word: string;
  thaiTranslation: string;
  pronunciation?: string;
  onContinue: () => void;
  onReplay: () => void;
  isReviewed: boolean;
}

export const VocabularyPauseOverlay: React.FC<VocabularyPauseOverlayProps> = ({
  word,
  thaiTranslation,
  pronunciation,
  onContinue,
  onReplay,
  isReviewed,
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
        className="vocabulary-pause-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="vocabulary-pause-backdrop" />
        
        <motion.div
          className="vocabulary-pause-content"
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="vocabulary-pause-header">
            <h2>📚 Vocabulary Review</h2>
            {isReviewed && <span className="reviewed-badge">✓ Reviewed</span>}
            <button className="close-button" onClick={handleContinue}>
              ✕
            </button>
          </div>

          {/* Vocabulary Display */}
          <div className="vocabulary-display">
            <div className="vocabulary-label">Review this word:</div>
            <div className="vocabulary-word">{word}</div>
            <div className="vocabulary-translation">{thaiTranslation}</div>
          {pronunciation && (
            <div className="vocabulary-pronunciation">[{pronunciation}]</div>
          )}
        </div>

          {/* Action Buttons */}
          <div className="vocabulary-actions">
            <button
              className="vocabulary-action-button replay-button"
              onClick={handleReplay}
            >
              🔄 Replay This Word
            </button>
            
            <button
              className="vocabulary-action-button continue-button"
              onClick={handleContinue}
            >
              Next Word →
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

