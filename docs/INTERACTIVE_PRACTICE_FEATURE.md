# Interactive Practice Feature

## Overview

The Interactive Practice feature provides two main capabilities:

1. **Auto-Pause for Pronunciation Practice**: Video automatically pauses after English phrases in practice segments
2. **AI-Powered Answer Validation**: Practice Mode with intelligent answer checking

This creates an engaging, interactive learning experience where students can:

1. Listen to English phrases in context
2. Have the video automatically pause after each phrase
3. Practice speaking the phrase out loud
4. Mark phrases as practiced to track progress
5. Complete comprehension questions with AI feedback

## Features

### Auto-Pause Functionality (Video Mode)

- **Automatic Detection**: The system automatically detects English phrases in Practice Card segments
- **Smart Timing**: Video pauses right after each English phrase is spoken (within 0.05 seconds)
- **One-Time Pause**: Each phrase only triggers a pause once until marked as practiced
- **Always Enabled**: Auto-pause is always active in Video Mode (no toggle needed)

### Practice Overlay (PracticePauseOverlay)

When a video pauses for practice, an overlay appears with:

- **Phrase Display**: Shows the English phrase prominently with replay button (🔊)
- **Thai Translation**: Displays translation if available
- **Instructions**: Step-by-step guidance on how to practice
- **Recording Button**: Placeholder for future voice recording feature (disabled)
- **Primary Action**:
  - Mark as Practiced - Marks phrase and resumes video
- **Close Button**: Click backdrop or ✕ button to resume without marking

### Practice Mode with AI Validation

Separate mode for completing comprehension questions:

- **Question Display**: Context, situation, and question text
- **Text Input**: Multi-line textarea for answers
- **Hint System**: Optional hints for each question
- **AI Validation**: Submit answers for intelligent checking
- **Bilingual Feedback**: Results shown in both Thai and English
- **Try Again**: Option to retry incorrect answers

### Visual Feedback

- **Practice Prompt**: In-video prompts when English phrases are active
- **Progress Tracking**: Visual indicators show which phrases have been practiced
- **Badge System**: "Practiced" badge shows completion status
- **Countdown Timer**: Optional auto-continue countdown

## User Interface

### Mode Buttons

Located in the lesson header:

```
[📺 Video Mode] [✍️ Practice Mode]
```

- **Video Mode**: Watch video with auto-pause features
- **Practice Mode**: Complete comprehension questions
- **Active State**: Purple gradient background
- **Inactive State**: Dark background

### Practice Overlay

Modal that appears when video pauses:

```
┌─────────────────────────────────┐
│ 🎤 Practice Time!           ✕  │
├─────────────────────────────────┤
│  Practice this phrase:          │
│                                 │
│  🔊 Could you recommend a       │
│     restaurant?                 │
│                                 │
│  คุณช่วยแนะนำร้านอาหารได้ไหม    │
├─────────────────────────────────┤
│  👂 Listen carefully            │
│  🗣️ Say it out loud 2-3 times  │
│  ✅ Mark as practiced           │
├─────────────────────────────────┤
│  [🎙️ Record Voice (Coming)]    │
├─────────────────────────────────┤
│  [✓ Mark as Practiced]          │
└─────────────────────────────────┘
```

Note: Click backdrop or ✕ to close without marking.

## Technical Implementation

### State Management (Zustand Store)

State properties for practice features:

```typescript
interface LessonState {
  // Auto-pause state
  currentPracticePhrase: string | null;
  isPracticePaused: boolean;

  // Progress tracking
  userProgress: {
    practicedPhrases: string[]; // Video mode practice phrases
    completedPractices: string[]; // Practice mode questions
    quizAnswers: Record<string, string>;
  };
}
```

Actions:

```typescript
setCurrentPracticePhrase(phrase: string | null)
setIsPracticePaused(paused: boolean)
completePracticePhrase(phrase: string)
completePractice(practiceId: string)
submitQuizAnswer(questionId: string, answer: string)
```

### Auto-Pause Detection

The system monitors video playback every 100ms and checks:

1. Is current mode "video"?
2. Are we not already paused?
3. Are we at the end of an English phrase in a practice_card segment?
4. Has this phrase not been practiced yet?

If all conditions are true, the video pauses and shows the practice overlay.

```typescript
// Simplified detection logic
for (segment of practice_card_segments) {
  for (timing of segment.textPartTimings) {
    if (
      timing.language === "en" &&
      currentTime >= segment.startTime + timing.endTime - 0.05 &&
      !userProgress.practicedPhrases.includes(timing.text)
    ) {
      playerRef.pause();
      setCurrentPracticePhrase(timing.text);
      setIsPracticePaused(true);
    }
  }
}
```

**Cooldown Mechanism:** Uses `lastPausedTime` and `lastPausedPhrase` to prevent immediate re-trigger of the same phrase within 0.5 seconds.

### Component Architecture

```
LessonViewer
├── Mode Buttons (Video/Practice)
├── Video Mode
│   ├── Player (Remotion)
│   ├── PracticePauseOverlay (conditional)
│   │   ├── Phrase Display with Replay
│   │   ├── Instructions
│   │   ├── Recording Button (disabled)
│   │   └── Mark as Practiced Button
│   ├── Episode Sidebar (left)
│   └── Vocabulary Sidebar (right)
└── Practice Mode
    └── InteractivePractice Components
        ├── Question Display
        ├── Text Input
        ├── Hint Toggle
        ├── Submit Button
        └── Validation Feedback
```

## Usage Guide

### For Learners

#### Video Mode

1. **Watch the Video**:

   - Video will automatically pause after English phrases in practice segments
   - Practice overlay will appear

2. **Practice the Phrase**:

   - Read the English phrase displayed
   - Click 🔊 replay button to hear it again
   - Say it out loud 2-3 times
   - Try to match the pronunciation you heard

3. **Continue Learning**:
   - Click "Mark as Practiced" to track progress and resume
   - Or click ✕ or backdrop to resume without marking

#### Practice Mode

1. **Complete Questions**:

   - Switch to Practice Mode using top button
   - Read each question's context and prompt

2. **Submit Answers**:

   - Type your answer in the text area
   - Use "Show Hint" if you need help
   - Click "Submit Answer"

3. **Review Feedback**:
   - Get bilingual AI feedback (Thai & English)
   - If incorrect, click "Try Again" to resubmit
   - Navigate between questions using dots or buttons

### For Developers

#### Testing the Feature

1. **Start the Interactive Viewer**:

   ```bash
   cd interactive-viewer
   npm run dev
   ```

2. **Test Auto-Pause**:

   - Open http://localhost:3001
   - Play the video in Video Mode
   - Video should pause after English phrases in practice segments
   - Practice overlay should appear

3. **Test Overlay Actions**:

   - Test replay button (should seek back and replay)
   - Test "Mark as Practiced" button
   - Verify practiced phrases don't trigger pauses again
   - Test closing overlay with ✕ or backdrop click

4. **Test Practice Mode**:
   - Switch to Practice Mode
   - Try submitting correct and incorrect answers
   - Verify AI validation feedback appears
   - Test "Try Again" functionality

#### Debugging

Enable console logs:

```typescript
console.log("Practice pause triggered:", {
  phrase: currentPracticePhrase,
  time: currentTime,
  segment: segment.screenElement,
});
```

Check state in React DevTools:

- Look for `lessonStore` state
- Verify `practicePauseEnabled` value
- Check `practicedPhrases` array

## Data Structure

### Segment Timing with TextPartTimings

```json
{
  "startTime": 15.04,
  "endTime": 33.4,
  "screenElement": "practice_card",
  "audioUrl": "/videos/.../practice1.wav",
  "textPartTimings": [
    {
      "text": "เราจะฝึกประโยคว่า",
      "language": "th",
      "duration": 2.5,
      "startTime": 0,
      "endTime": 2.5
    },
    {
      "text": "Could you recommend a restaurant?",
      "language": "en",
      "duration": 2.8,
      "startTime": 2.5,
      "endTime": 5.3
    }
  ]
}
```

## Future Enhancements

### Voice Recording (Phase 2)

- Integrate Web Audio API for voice recording
- Allow learners to record their pronunciation
- Compare with original audio (optional)
- Store recordings locally for review

### Speech Recognition (Phase 3)

- Use Web Speech API for real-time pronunciation feedback
- Highlight mispronounced words
- Provide pronunciation score
- Suggest corrections

### Adaptive Learning (Phase 4)

- Track which phrases are difficult for each learner
- Automatically create review sessions
- Adjust pause duration based on learner performance
- Personalized practice recommendations

### Mobile App Features

- Offline practice mode
- Voice recording with better quality
- Hands-free mode with voice commands
- Progress synchronization across devices

## Styling

### CSS Classes

**Overlay Container**:

```css
.practice-pause-overlay {
  position: fixed;
  z-index: 1000;
  backdrop-filter: blur(8px);
}
```

**Content Card**:

```css
.practice-pause-content {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}
```

**Action Buttons**:

```css
.practice-action-button.mark-practiced {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.practice-action-button.continue-now {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}
```

### Responsive Design

Mobile-first approach with breakpoints:

```css
@media (max-width: 640px) {
  .practice-pause-content {
    padding: 24px 20px;
  }

  .phrase-text {
    font-size: 24px;
  }

  .practice-actions {
    grid-template-columns: 1fr;
  }
}
```

## Performance Considerations

### Optimization Strategies

1. **Debouncing**: Check for practice pauses every 100ms (not every frame)
2. **Memoization**: Cache practiced phrases to avoid repeated checks
3. **Lazy Loading**: Only load practice overlay when needed
4. **State Updates**: Batch state updates to minimize re-renders

### Memory Management

- Clear timers when component unmounts
- Remove event listeners properly
- Reset state when lesson changes
- Garbage collect old practice data

## Accessibility

### Keyboard Navigation

- `Esc`: Close practice overlay
- `Enter`: Continue video
- `Space`: Mark as practiced
- `Tab`: Navigate between buttons

### Screen Readers

- Aria labels on all interactive elements
- Announce when practice pause occurs
- Read phrase content automatically
- Describe available actions

### Visual Accessibility

- High contrast colors (WCAG AA compliant)
- Large touch targets (minimum 44x44px)
- Clear focus indicators
- Scalable text (supports 200% zoom)

## Testing Checklist

### Functional Tests

#### Video Mode

- [ ] Video pauses at end of English phrases in practice_card segments
- [ ] Practice overlay appears with correct phrase
- [ ] Replay button seeks back and plays phrase again
- [ ] "Mark as Practiced" prevents future pauses and resumes video
- [ ] Close button (✕) resumes video without marking
- [ ] Backdrop click resumes video
- [ ] Practiced phrases don't trigger pause again
- [ ] Cooldown prevents immediate re-trigger

#### Practice Mode

- [ ] All comprehension questions display correctly
- [ ] Text input accepts user answers
- [ ] Hint button shows/hides hints
- [ ] Submit button calls validation API
- [ ] Correct answers show success feedback (Thai + English)
- [ ] Incorrect answers show error feedback with "Try Again"
- [ ] Try Again allows resubmission
- [ ] Progress tracking updates
- [ ] Navigation between questions works

### Edge Cases

- [ ] Multiple English phrases in quick succession
- [ ] Very short English phrases (< 1 second)
- [ ] Very long English phrases (> 10 seconds)
- [ ] Seeking to different video positions
- [ ] Disabling during active pause
- [ ] Re-enabling after disabling
- [ ] Video end behavior with active pause
- [ ] Network errors during practice

### Browser Compatibility

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (Desktop)
- [ ] Safari (iOS)
- [ ] Chrome (Android)

### Performance Tests

- [ ] No frame drops during playback
- [ ] Smooth pause transitions
- [ ] Fast overlay rendering (< 100ms)
- [ ] No memory leaks over extended use
- [ ] Efficient state updates

## Troubleshooting

### Video Doesn't Pause for Practice

**Possible Causes**:

1. Already practiced the phrase (check `practicedPhrases` array)
2. Not in video mode (must be in "Video Mode")
3. No English phrases in current practice_card segment
4. Within cooldown period after last pause

**Solutions**:

- Reset progress by refreshing page
- Switch to Video Mode
- Verify segment has `screenElement === 'practice_card'`
- Check `textPartTimings` has entries with `language === 'en'`
- Wait for cooldown to expire (0.5 seconds)

### Overlay Doesn't Appear

**Possible Causes**:

1. State not updating (`isPracticePaused` is false)
2. CSS not loaded properly
3. Z-index conflict with other elements
4. Component not rendering

**Solutions**:

- Check React DevTools for state
- Inspect element and verify CSS
- Adjust z-index in CSS
- Add console logs in component

### Phrases Not Detected

**Possible Causes**:

1. Missing `textPartTimings` in segment data
2. Language field not set to "en"
3. Timing calculation incorrect
4. JSON data malformed

**Solutions**:

- Verify JSON structure matches schema
- Check language field values
- Adjust timing threshold in code
- Validate JSON with schema validator

## Related Documentation

- [Interactive Viewer README](../interactive-viewer/README.md)
- [Remotion Video Composition](../rules/remotion-video-composition.md)
- [Thai Learning Context](../rules/thai-learning-context.md)
- [Video Generation Summary](./VIDEO_GENERATION_SUMMARY.md)

## Changelog

### Version 1.0 (Current)

- Initial release with auto-pause functionality
- Practice overlay with instructions
- Progress tracking for practiced phrases
- Toggle button in lesson header
- Visual feedback and animations
- Mobile-responsive design

### Planned for Version 1.1

- Voice recording integration (Web Audio API)
- Enhanced replay with slow-motion option
- Practice history viewer
- Custom cooldown settings
- Export practice report

### Planned for Version 2.0

- Speech recognition feedback
- Pronunciation scoring with visual feedback
- Adaptive learning algorithms
- Multi-language support beyond Thai
- Social sharing of progress
- Offline practice mode
