import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flashcard } from '../types/lesson';
import './InteractiveFlashcard.css';

interface InteractiveFlashcardProps {
  flashcard: Flashcard;
  onReveal: () => void;
  revealed: boolean;
}

export const InteractiveFlashcard: React.FC<InteractiveFlashcardProps> = ({
  flashcard,
  onReveal,
  revealed,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleClick = () => {
    if (!revealed) {
      onReveal();
      setIsFlipped(true);
    } else {
      setIsFlipped(!isFlipped);
    }
  };

  const handleShowDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(!showDetails);
  };

  return (
    <div className="flashcard-container">
      {/* Main Flashcard */}
      <motion.div
        className="flashcard"
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ perspective: 1000 }}
      >
        <motion.div
          className="flashcard-inner"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <div className="flashcard-face flashcard-front">
            <div className="card-header">
              <span className="card-badge">📚 Vocabulary</span>
              {revealed && (
                <span className="click-hint animate-pulse">
                  👆 Click to flip
                </span>
              )}
            </div>
            <div className="word-section">
              {revealed ? (
                <>
                  <h2 className="word">{flashcard.word}</h2>
                  <p className="pronunciation">[{flashcard.pronunciation}]</p>
                  <p className="phonetic">{flashcard.phonetic}</p>
                </>
              ) : (
                <div className="locked-placeholder">
                  <span className="lock-icon">🔒</span>
                  <h3 className="unlock-title">Click to unlock</h3>
                  <p className="unlock-hint">Tap anywhere to reveal the word</p>
                </div>
              )}
            </div>
          </div>

          {/* Back */}
          <div className="flashcard-face flashcard-back">
            <div className="card-header">
              <span className="card-badge">✨ Translation</span>
            </div>
            <div className="translation-section">
              <h3 className="thai-word">{flashcard.thaiTranslation}</h3>
              <p className="part-of-speech">{flashcard.partOfSpeech}</p>
              <div className="definition">
                <p className="definition-text">{flashcard.thaiDefinition}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Details Panel */}
      {revealed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="details-toggle"
        >
          <button onClick={handleShowDetails} className="details-button">
            {showDetails ? '▲ Hide Details' : '▼ Show More Details'}
          </button>
        </motion.div>
      )}

      {/* Expanded Details */}
      <AnimatePresence>
        {showDetails && revealed && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flashcard-details"
          >
            {/* Memory Hook */}
            <div className="detail-section">
              <h4>💡 Memory Hook</h4>
              <p>{flashcard.memoryHook}</p>
            </div>

            {/* Context Example */}
            <div className="detail-section">
              <h4>📝 Context Example</h4>
              <p className="context-example">{flashcard.contextExample}</p>
            </div>

            {/* Definition in English */}
            <div className="detail-section">
              <h4>🔤 English Definition</h4>
              <p>{flashcard.definition}</p>
            </div>

            {/* Difficulty Badge */}
            <div className="difficulty-badge">
              <span>
                Difficulty: <strong>{flashcard.difficulty}</strong>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

