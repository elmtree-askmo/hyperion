import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ComprehensionQuestion } from '../types/lesson';
import './InteractivePractice.css';

interface InteractivePracticeProps {
  question: ComprehensionQuestion;
  onComplete: (answer: string) => void;
  completed: boolean;
}

export const InteractivePractice: React.FC<InteractivePracticeProps> = ({
  question,
  onComplete,
  completed,
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(completed);
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = () => {
    if (userAnswer.trim()) {
      setIsSubmitted(true);
      onComplete(userAnswer);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  return (
    <motion.div
      className="practice-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="practice-card">
        {/* Header */}
        <div className="practice-header">
          <h3 className="practice-title">
            🗣️ Practice Exercise
            {isSubmitted && <span className="completed-badge">✓ Completed</span>}
          </h3>
        </div>

        {/* Context */}
        <div className="practice-context">
          <h4>📍 Context</h4>
          <p>{question.context}</p>
        </div>

        {/* Question */}
        <div className="practice-question">
          <h4>Question:</h4>
          <p className="question-text-en">{question.question}</p>
          <p className="question-text-th">{question.questionTh}</p>
        </div>

        {/* Answer Input */}
        {!isSubmitted ? (
          <div className="practice-input-section">
            <label htmlFor="answer-input">Your Answer:</label>
            <textarea
              id="answer-input"
              className="practice-textarea"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your answer here... (Ctrl+Enter to submit)"
              rows={4}
            />
            <div className="practice-actions">
              <button
                className="hint-button"
                onClick={() => setShowHint(!showHint)}
              >
                {showHint ? '🙈 Hide Hint' : '💡 Show Hint'}
              </button>
              <button
                className="submit-button"
                onClick={handleSubmit}
                disabled={!userAnswer.trim()}
              >
                Submit Answer
              </button>
            </div>
          </div>
        ) : (
          <div className="practice-submitted">
            <div className="submitted-answer">
              <h4>✓ Your Answer:</h4>
              <p>{userAnswer}</p>
            </div>
          </div>
        )}

        {/* Hint Section */}
        {showHint && (
          <motion.div
            className="practice-hint"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <h4>💡 Expected Answer:</h4>
            <p>{question.expectedAnswer}</p>
          </motion.div>
        )}

        {/* Show expected answer after submission */}
        {isSubmitted && (
          <motion.div
            className="practice-expected"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h4>✨ Model Answer:</h4>
            <p className="expected-answer">{question.expectedAnswer}</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

