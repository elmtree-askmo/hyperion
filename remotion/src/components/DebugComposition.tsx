/**
 * Debug Composition
 * Simple test to verify props are passed correctly
 */
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

interface DebugProps {
  lessonData: any;
}

export const DebugComposition: React.FC<DebugProps> = ({ lessonData }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const hasData = lessonData?.lesson?.segmentBasedTiming?.length > 0;
  const segmentCount = lessonData?.lesson?.segmentBasedTiming?.length || 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: hasData ? '#4ECDC4' : '#FF6B6B',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
      }}
    >
      <div
        style={{
          color: 'white',
          fontSize: 48,
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        <div>Frame: {frame}</div>
        <div>Resolution: {width}x{height}</div>
        <div>Has Data: {hasData ? 'YES ✅' : 'NO ❌'}</div>
        <div>Segments: {segmentCount}</div>
        {hasData && (
          <div style={{ fontSize: 32, marginTop: 20 }}>
            Title: {lessonData.lesson.title}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

