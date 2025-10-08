import React, { useEffect } from 'react';
import { LessonViewer } from './components/LessonViewer';
import { useLessonStore } from './store/lessonStore';
import { loadLessonData } from './services/lessonService';
import './App.css';

const App: React.FC = () => {
  const { lessonData, setLessonData } = useLessonStore();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const loadLesson = async () => {
      try {
        setLoading(true);
        // For demo, we'll load lesson_1 from henIVlCPVIY
        const data = await loadLessonData('henIVlCPVIY', 'lesson_1');
        setLessonData(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load lesson:', err);
        setError('Failed to load lesson data. Please try again later.');
        setLoading(false);
      }
    };

    loadLesson();
  }, [setLessonData]);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <h2>Loading Interactive Lesson...</h2>
        <p>Preparing your learning experience</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>❌ Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!lessonData) {
    return (
      <div className="app-error">
        <h2>No lesson data available</h2>
        <p>Please check your configuration</p>
      </div>
    );
  }

  return (
    <div className="app">
      <LessonViewer lessonId="lesson_1" />
    </div>
  );
};

export default App;

