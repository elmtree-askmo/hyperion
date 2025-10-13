# Interactive Practice Feature

## Overview

The Interactive Practice feature allows learners to pause the video automatically at English phrases to practice pronunciation. This creates an engaging, interactive learning experience where students can:

1. Listen to English phrases in context
2. Have the video automatically pause after each phrase
3. Practice speaking the phrase out loud
4. Mark phrases as practiced to track progress
5. Continue at their own pace

## Features

### Auto-Pause Functionality

- **Automatic Detection**: The system automatically detects English phrases in Practice Card segments
- **Smart Timing**: Video pauses right after each English phrase is spoken (within 0.5 seconds)
- **One-Time Pause**: Each phrase only triggers a pause once until marked as practiced
- **Toggle Control**: Users can enable/disable auto-pause with a single button click

### Practice Overlay

When a video pauses for practice, an overlay appears with:

- **Phrase Display**: Shows the English phrase prominently
- **Thai Translation**: Displays translation if available (future enhancement)
- **Instructions**: Step-by-step guidance on how to practice
- **Recording Button**: Placeholder for future voice recording feature
- **Multiple Actions**:
  - Mark as Practiced
  - Continue Now
  - Auto-Continue in 3 seconds

### Visual Feedback

- **Practice Prompt**: In-video prompts when English phrases are active
- **Progress Tracking**: Visual indicators show which phrases have been practiced
- **Badge System**: "Practiced" badge shows completion status
- **Countdown Timer**: Optional auto-continue countdown

## User Interface

### Toggle Button

Located in the lesson header:

```
🎤 Auto-Pause: ON/OFF
```

- **OFF State**: Grey background, disabled styling
- **ON State**: Green gradient background, glowing effect
- **Tooltip**: Shows current state on hover

### Practice Overlay

Modal that appears when video pauses:

```
┌─────────────────────────────────┐
│ 🎤 Practice Time!         ✓ ✕  │
├─────────────────────────────────┤
│  Practice this phrase:          │
│                                 │
│  Could you recommend a          │
│  restaurant?                    │
│                                 │
│  คุณช่วยแนะนำร้านอาหารได้ไหม    │
├─────────────────────────────────┤
│  👂 Listen carefully            │
│  🗣️ Say it out loud 2-3 times  │
│  ✅ Mark as practiced           │
├─────────────────────────────────┤
│  [🎙️ Record Voice - Coming]    │
├─────────────────────────────────┤
│  [✓ Mark as Practiced]          │
│  [Continue Now →]               │
│  [Auto-Continue in 3s]          │
├─────────────────────────────────┤
│  💡 Tip: Auto-pause at English  │
│  phrases. Disable in settings.  │
└─────────────────────────────────┘
```

## Technical Implementation

### State Management (Zustand Store)

New state properties:

```typescript
interface LessonState {
  // ... existing properties
  practicePauseEnabled: boolean;
  currentPracticePhrase: string | null;
  isPracticePaused: boolean;
  userProgress: {
    // ... existing properties
    practicedPhrases: string[];
  };
}
```

New actions:

```typescript
setPracticePauseEnabled(enabled: boolean)
setCurrentPracticePhrase(phrase: string | null)
setIsPracticePaused(paused: boolean)
completePracticePhrase(phrase: string)
```

### Auto-Pause Detection

The system monitors video playback every 100ms and checks:

1. Is practice pause enabled?
2. Is current mode "video"?
3. Are we not already paused?
4. Are we at the end of an English phrase?
5. Has this phrase not been practiced yet?

If all conditions are true, the video pauses and shows the practice overlay.

```typescript
// Pseudo-code
if (practicePauseEnabled && currentMode === 'video' && !isPracticePaused && currentTime >= englishPhraseEndTime && !practicedPhrases.includes(phrase)) {
  pauseVideo();
  showPracticeOverlay(phrase);
}
```

### Component Architecture

```
LessonViewer
├── Player (Remotion)
├── PracticePauseOverlay (conditional)
│   ├── Phrase Display
│   ├── Instructions
│   ├── Recording Button (disabled)
│   └── Action Buttons
└── Practice Toggle Button
```

## Usage Guide

### For Learners

1. **Enable Auto-Pause**:
   - Click the "🎤 Auto-Pause: OFF" button in the header
   - Button will turn green and show "Auto-Pause: ON"

2. **Watch the Video**:
   - Video will automatically pause after English phrases
   - Practice overlay will appear

3. **Practice the Phrase**:
   - Read the English phrase
   - Say it out loud 2-3 times
   - Try to match the pronunciation you heard

4. **Continue Learning**:
   - Click "Mark as Practiced" to track progress
   - Click "Continue Now" to resume immediately
   - Or click "Auto-Continue in 3s" for automatic continuation

5. **Disable When Needed**:
   - Click the toggle button again to turn off auto-pause
   - Video will play continuously without pausing

### For Developers

#### Testing the Feature

1. **Start the Interactive Viewer**:

   ```bash
   cd interactive-viewer
   npm run dev
   ```

2. **Enable Practice Mode**:
   - Open http://localhost:5173
   - Click "🎤 Auto-Pause: OFF" to enable

3. **Test Auto-Pause**:
   - Play the video
   - Video should pause after English phrases
   - Practice overlay should appear

4. **Test Actions**:
   - Try all three action buttons
   - Verify state updates correctly
   - Check that practiced phrases don't trigger pauses again

#### Debugging

Enable console logs:

```typescript
console.log('Practice pause triggered:', {
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

- [ ] Toggle button switches state correctly
- [ ] Video pauses at end of English phrases
- [ ] Practice overlay appears with correct phrase
- [ ] "Mark as Practiced" prevents future pauses
- [ ] "Continue Now" resumes video immediately
- [ ] "Auto-Continue" counts down and resumes
- [ ] Practiced phrases show in progress tracker
- [ ] Feature works with all lesson types
- [ ] State persists during lesson navigation

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

### Video Doesn't Pause

**Possible Causes**:

1. Practice pause not enabled (check toggle button)
2. Already practiced the phrase (check `practicedPhrases` array)
3. Not in video mode (must be in "Video Mode")
4. No English phrases in current segment

**Solutions**:

- Enable practice pause toggle
- Reset progress to practice again
- Switch to video mode
- Check segment `textPartTimings` data

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

- Voice recording integration
- Thai translation in overlay
- Custom pause duration settings
- Practice history viewer
- Export practice report

### Planned for Version 2.0

- Speech recognition feedback
- Pronunciation scoring
- Adaptive learning algorithms
- Multi-language support beyond Thai
- Social sharing of progress
