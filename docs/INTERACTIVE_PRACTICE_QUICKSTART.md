# Interactive Practice - Quick Start Guide

## What is Interactive Practice?

Interactive Practice is a feature that automatically pauses the video after English phrases, giving learners time to practice pronunciation. It's like having a personal language tutor who pauses the lesson for you to repeat!

## How to Use (3 Simple Steps)

### Step 1: Enable Auto-Pause

1. Open the interactive viewer at http://localhost:5173
2. Look for the button that says "🎤 Auto-Pause: OFF"
3. Click it once - it will turn green and say "🎤 Auto-Pause: ON"

```
Before:  [🎤 Auto-Pause: OFF]  ← Grey button
After:   [🎤 Auto-Pause: ON]   ← Green button ✓
```

### Step 2: Watch and Practice

1. Click play on the video
2. The video will automatically pause after each English phrase
3. A practice overlay will pop up showing:
   - The English phrase to practice
   - Instructions on how to practice
   - Action buttons

```
Video plays... → English phrase spoken → Video PAUSES → Practice overlay appears!
```

### Step 3: Continue Learning

When the practice overlay appears, you have three options:

1. **Mark as Practiced** - Click this after practicing to track your progress
2. **Continue Now** - Skip practice and continue immediately
3. **Auto-Continue in 3s** - Set a 3-second timer and continue automatically

## Example Flow

```
1. Video: "วันนี้เราจะเรียนประโยค..."
   → Plays normally

2. Video: "Could you recommend a restaurant?"
   → PAUSES after phrase ends

3. Overlay appears:
   ┌──────────────────────────────┐
   │ 🎤 Practice Time!            │
   │                              │
   │ Could you recommend a        │
   │ restaurant?                  │
   │                              │
   │ [✓ Mark as Practiced]        │
   │ [Continue Now →]             │
   └──────────────────────────────┘

4. You practice saying the phrase 2-3 times

5. Click "Mark as Practiced"

6. Video continues automatically!
```

## Tips

### 🎯 Best Practices

- **Say it out loud** - Don't just read silently
- **Repeat 2-3 times** - Muscle memory is important
- **Listen carefully** - Pay attention to pronunciation before the pause
- **Mark as practiced** - Track your progress

### ⚡ Keyboard Shortcuts

- Press `Space` to play/pause manually
- Press `Esc` to close the practice overlay
- Use `←` and `→` to seek backward/forward

### 🔧 Customization

**Want to practice everything again?**

- Refresh the page to reset progress

**Too many pauses?**

- Click the toggle button to disable: "🎤 Auto-Pause: OFF"

**Missing some phrases?**

- The feature only pauses on English phrases in Practice Card segments

## Common Questions

### Q: Why isn't the video pausing?

**A:** Make sure:

1. Auto-Pause is enabled (green button)
2. You're in "Video Mode" (not Flashcard or Practice mode)
3. The current segment has English phrases
4. You haven't already practiced this phrase

### Q: Can I practice the same phrase again?

**A:** Yes! Just refresh the page to reset your progress, or we'll add a "Reset Progress" button in the future.

### Q: Does this work on mobile?

**A:** Yes! The interface is fully responsive and works great on phones and tablets.

### Q: Can I record my voice?

**A:** Not yet, but we're working on it! The recording button is a placeholder for a future update.

## Video Demo

_(Coming soon: Screen recording showing the feature in action)_

## Troubleshooting

| Problem                             | Solution                                                 |
| ----------------------------------- | -------------------------------------------------------- |
| Button is grey and won't turn green | Try clicking again or refresh the page                   |
| Video never pauses                  | Check that you're watching a lesson with English phrases |
| Overlay appears but no phrase shown | This is a bug - please report it                         |
| Can't click the buttons             | Check z-index in CSS or refresh the page                 |

## Get Started Now!

```bash
# Start the interactive viewer
cd interactive-viewer
npm run dev

# Open in browser
# http://localhost:5173

# Enable auto-pause and start learning!
```

## Need More Help?

- Check the [full documentation](./INTERACTIVE_PRACTICE_FEATURE.md)
- Look at [troubleshooting guide](./TROUBLESHOOTING.md)
- Report issues on the project repository

---

**Happy Learning! 🎉**

Remember: The more you practice speaking out loud, the faster you'll improve your English pronunciation!
