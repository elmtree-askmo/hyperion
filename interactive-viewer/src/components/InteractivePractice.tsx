import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ComprehensionQuestion } from '../types/lesson';
import { useLessonStore, ValidationResult } from '../store/lessonStore';
import './InteractivePractice.css';

interface InteractivePracticeProps {
  question: ComprehensionQuestion;
  onComplete: (answer: string) => void;
  completed: boolean;
}

// Get API base URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const InteractivePractice: React.FC<InteractivePracticeProps> = ({
  question,
  onComplete,
  completed,
}) => {
  const { userProgress, savePracticeAnswer } = useLessonStore();
  
  // Get saved answer and validation result if this practice was completed before
  const savedPracticeAnswer = userProgress.practiceAnswers[question.question];
  
  const [userAnswer, setUserAnswer] = useState(savedPracticeAnswer?.userAnswer || '');
  const [isSubmitted, setIsSubmitted] = useState(completed);
  const [showHint, setShowHint] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(
    savedPracticeAnswer?.validationResult || null
  );

  // Update state when navigating to a different question
  useEffect(() => {
    const saved = userProgress.practiceAnswers[question.question];
    if (saved) {
      setUserAnswer(saved.userAnswer);
      setValidationResult(saved.validationResult);
      setIsSubmitted(true);
    } else {
      setUserAnswer('');
      setValidationResult(null);
      setIsSubmitted(completed);
    }
  }, [question.question, userProgress.practiceAnswers, completed]);

  const handleSubmit = async () => {
    if (userAnswer.trim()) {
      setIsValidating(true);
      
      try {
        // Call backend API to validate answer
        const response = await fetch(`${API_BASE_URL}/api/v1/video-transform/validate-practice-answer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            context: question.context,
            question: question.question,
            expectedAnswer: question.expectedAnswer,
            userAnswer: userAnswer,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to validate answer');
        }

        const result: ValidationResult = await response.json();
        setValidationResult(result);
        setIsSubmitted(true);
        
        // Save the answer and validation result
        savePracticeAnswer(question.question, userAnswer, result);
        
        // Only mark as complete if answer is correct
        if (result.isCorrect) {
          onComplete(userAnswer);
        }
      } catch (error) {
        console.error('Error validating answer:', error);
        // Fallback: show error message
        setValidationResult({
          isCorrect: false,
          feedbackTh: 'เกิดข้อผิดพลาดในการตรวจสอบคำตอบ กรุณาลองใหม่อีกครั้ง',
          feedbackEn: 'An error occurred while checking your answer. Please try again.',
        });
        setIsSubmitted(false);
      } finally {
        setIsValidating(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  const handleTryAgain = () => {
    setIsSubmitted(false);
    setValidationResult(null);
    setUserAnswer('');
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
            {isSubmitted && validationResult?.isCorrect && (
              <span className="completed-badge">✓ Completed</span>
            )}
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
                disabled={!userAnswer.trim() || isValidating}
              >
                {isValidating ? 'กำลังตรวจสอบ... / Checking...' : 'Submit Answer'}
              </button>
            </div>
          </div>
        ) : (
          <div className="practice-submitted">
            {/* Validation Result */}
            {validationResult && (
              <motion.div
                className={validationResult.isCorrect ? 'validation-result-correct' : 'validation-result-incorrect'}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h4>
                  {validationResult.isCorrect ? '✓ ถูกต้อง! / Correct!' : '✗ ลองอีกครั้ง / Try Again'}
                </h4>
                <p className="feedback-th">{validationResult.feedbackTh}</p>
                <p className="feedback-en">{validationResult.feedbackEn}</p>
              </motion.div>
            )}

            {/* User's Answer */}
            <div className={validationResult?.isCorrect ? 'submitted-answer submitted-answer-correct' : 'submitted-answer submitted-answer-incorrect'}>
              <h4>
                {validationResult?.isCorrect ? '✓' : '✗'} Your Answer:
              </h4>
              <p>{userAnswer}</p>
            </div>

            {/* Try Again Button (only show if incorrect) */}
            {validationResult && !validationResult.isCorrect && (
              <button className="try-again-button" onClick={handleTryAgain}>
                🔄 ลองอีกครั้ง / Try Again
              </button>
            )}
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

        {/* Show expected answer after submission only if correct */}
        {isSubmitted && validationResult?.isCorrect && (
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

