# Flashcard Display Fix

## Problem Description

The flashcard component was displaying incorrectly with several issues:

1. Cards appeared as narrow vertical strips instead of full-width cards
2. Overlay elements were positioned incorrectly
3. Content was not properly filling the card space
4. The locked/unlocked states had confusing UI elements

## Root Cause

The main issue was in the component structure:

- The `blur-overlay` was used as an absolute-positioned sibling to other content
- In the unlocked state, there was no flex-filling content to maintain proper card dimensions
- The locked state only had a header + absolute overlay, with no flex content
- The `word-section` wasn't being used in the locked state, causing layout collapse

## Solution

### 1. **Restructured Component Layout**

Instead of conditionally rendering different layouts, we now keep a consistent structure:

- Card header always present (with conditional click hint)
- Word section always present (with conditional content)
- No more absolute-positioned overlay covering the entire card

### 2. **Unified Content Structure**

```tsx
<div className="flashcard-face flashcard-front">
  <div className="card-header">
    <span className="card-badge">📚 Vocabulary</span>
    {revealed && <span className="click-hint">👆 Click to flip</span>}
  </div>
  <div className="word-section">
    {revealed ? (
      <>{word content}</>
    ) : (
      <div className="locked-placeholder">{lock UI}</div>
    )}
  </div>
</div>
```

### 3. **CSS Updates**

- Removed `.blur-overlay` with absolute positioning
- Added `.locked-placeholder` as a flex container within `word-section`
- Ensured `word-section` always has `flex: 1` to fill available space
- Added `flex-shrink: 0` to card-header to prevent collapse

### 4. **Fixed Layout Properties**

```css
.flashcard {
  width: 100%;
  height: 400px; /* Fixed height */
}

.word-section {
  flex: 1; /* Always fills available space */
  z-index: 10;
}

.locked-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* No absolute positioning */
}
```

## Files Modified

1. `interactive-viewer/src/components/InteractiveFlashcard.tsx`
   - Restructured conditional rendering
   - Unified component structure between locked/unlocked states

2. `interactive-viewer/src/components/InteractiveFlashcard.css`
   - Removed `.blur-overlay` styles
   - Added `.locked-placeholder` styles
   - Fixed `.card-header` with min-height and flex-shrink
   - Ensured proper flex layout throughout

3. `interactive-viewer/src/components/LessonViewer.css`
   - Added proper width constraints to `.practice-flashcards`

## Result

- ✅ Flashcards now display at full width (600px max)
- ✅ Cards maintain proper 400px height
- ✅ Locked state shows clear, centered lock UI
- ✅ Unlocked state shows word content with flip hint
- ✅ No more narrow strip appearance
- ✅ Consistent layout in both video mode and practice mode
- ✅ Smooth transitions between states

## Testing

To verify the fix:

1. Start the interactive viewer: `cd interactive-viewer && npm run dev`
2. Navigate to Practice Mode (✍️ Practice Mode button)
3. Observe flashcards - they should be wide cards, not narrow strips
4. Click to unlock a card - it should reveal the word smoothly
5. Click again to flip and see translation
