# 9:16 Vertical Video Format Optimization

## Overview

Updated the video generation system to use **9:16 vertical aspect ratio (1080x1920)** optimized for mobile-first short video platforms like TikTok, Instagram Reels, YouTube Shorts, and Snapchat Spotlight.

## Changes Made

### 1. Video Configuration (remotion/src/styles/theme.ts)

```typescript
export const VIDEO_CONFIG = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInSeconds: 300, // 5 minutes
  aspectRatio: '9:16', // Vertical format for TikTok, Instagram Reels, YouTube Shorts
};
```

### 2. Component Layout Optimization

All card components have been optimized for vertical format to **eliminate blank spaces**:

#### Key Changes:

- Changed `justifyContent: 'center'` to `justifyContent: 'flex-start'`
- Added `paddingTop: VIDEO_CONFIG.height * 0.15-0.25` to position content strategically
- Increased font sizes for better readability in vertical format
- Enhanced spacing and padding for mobile viewing
- Added `textAlign: 'center'` for better visual balance

#### Updated Components:

1. **TitleCard.tsx** ✅
   - Font sizes: 40px (episode), 88px (title), 64px (Thai title)
   - Content centered vertically (appropriate for title screens)
   - Optimized spacing

2. **VocabularyCard.tsx** ✅
   - Font sizes: 96px (word), 56px (Thai), 38-44px (definitions)
   - Starts at 15% from top
   - Reduced empty space at top and bottom

3. **ObjectiveCard.tsx** ✅
   - Font size: 44px
   - Starts at 25% from top
   - Center-aligned text for readability

4. **PracticeCard.tsx** ✅
   - Font sizes: 40px (label), 42-32px (practice text)
   - Starts at 20% from top
   - Enhanced border (10px) for visual emphasis

5. **GrammarCard.tsx** ✅
   - Font size: 40px (label)
   - Starts at 20% from top
   - Enhanced border (10px)

6. **OutroCard.tsx** ✅
   - Font sizes: 96px (celebration), 42-44px (text)
   - Vertically centered (appropriate for ending screen)
   - Larger elements for impact

### 3. Interactive Viewer CSS Update

Updated `.player-container` in `interactive-viewer/src/components/LessonViewer.css`:

```css
.player-container {
  position: relative;
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
  width: 100%;
  max-width: 608px; /* Optimized for vertical format */
  margin: 0 auto;
  aspect-ratio: 9 / 16; /* Maintain aspect ratio */
}
```

## Before vs After

### Before (1:1 or 16:9)

```
┌─────────────────┐
│                 │ ← Large blank space
│                 │
│   VOCABULARY    │
│   recommend     │
│   แนะนำ         │
│   [definition]  │
│                 │ ← Large blank space
│                 │
└─────────────────┘
```

### After (9:16 Optimized)

```
┌─────────────────┐
│                 │ ← Minimal top padding (15-25%)
│  📚 VOCABULARY  │ ← Larger font
│                 │
│   recommend     │ ← 96px font
│   แนะนำ         │ ← 56px font
│   [definition]  │ ← 38px font
│                 │
│   💡 Memory     │
│      Hook       │
│                 │ ← Minimal bottom space
└─────────────────┘
```

## Platform Compatibility

### Perfect For:

- **TikTok** ✅ (9:16 native format)
- **Instagram Reels** ✅ (9:16 native format)
- **YouTube Shorts** ✅ (9:16 native format)
- **Snapchat Spotlight** ✅ (9:16 native format)
- **Facebook Reels** ✅ (9:16 native format)
- **Pinterest Video Pins** ✅ (9:16 native format)

### Mobile Optimization:

- Full-screen viewing on smartphones
- No letterboxing or black bars
- Optimized for portrait mode holding
- Thumb-friendly UI positioning

## Font Size Increases

To improve readability on mobile devices:

| Element          | Before  | After   | Increase |
| ---------------- | ------- | ------- | -------- |
| Vocabulary word  | 80px    | 96px    | +20%     |
| Thai translation | 48px    | 56px    | +17%     |
| Definitions      | 32px    | 38-44px | +19-38%  |
| Labels           | 28-32px | 40px    | +25-43%  |
| Title            | 72px    | 88px    | +22%     |
| Thai title       | 48px    | 64px    | +33%     |

## Spacing Optimization

### Strategic Positioning:

- **Title Card**: Centered (keeps dramatic effect)
- **Vocabulary Card**: Starts at 15% from top
- **Objective Card**: Starts at 25% from top
- **Practice Card**: Starts at 20% from top
- **Grammar Card**: Starts at 20% from top
- **Outro Card**: Centered (keeps impact)

### Padding Adjustments:

- Horizontal padding: Maintained at `theme.spacing.lg` (32px)
- Vertical padding: Increased to `theme.spacing.xl` or `theme.spacing.xxl` (48-64px)
- Content margins: Increased from `theme.spacing.md` to `theme.spacing.xl` (24px → 48px)

## Testing

### 1. Preview in Remotion Studio

```bash
cd remotion
npm run remotion:preview
```

Navigate to any composition to see the vertical format in action.

### 2. Generate Test Video

```bash
npm run test:video
```

This will generate a full lesson video in 9:16 format.

### 3. View in Interactive Viewer

```bash
cd interactive-viewer
npm run dev
```

Open http://localhost:5173 to see the video in a mobile-optimized player.

### 4. Mobile Testing

For best results, test on actual mobile devices:

- Open the interactive viewer on your phone
- Check readability of all text sizes
- Verify no content is cut off
- Ensure touch targets are accessible

## Benefits of Optimized Layout

### 1. Maximum Content Visibility

- ✅ Eliminated blank spaces at top and bottom
- ✅ Content fills the vertical space efficiently
- ✅ Better use of screen real estate

### 2. Enhanced Readability

- ✅ Larger font sizes for mobile viewing
- ✅ Better line height and spacing
- ✅ Center-aligned text for easy scanning

### 3. Professional Appearance

- ✅ Consistent spacing across all cards
- ✅ Visual balance in vertical format
- ✅ Modern, mobile-first design

### 4. Engagement Optimization

- ✅ Content starts higher on screen (captures attention faster)
- ✅ Larger text keeps viewers engaged
- ✅ Less scrolling/waiting for content

## Technical Details

### Layout Strategy

Each card type uses strategic positioning based on content:

1. **Information Cards** (Vocabulary, Objective, Practice, Grammar)
   - Start at 15-25% from top
   - Maximize vertical space usage
   - Focus on content density

2. **Intro/Outro Cards** (Title, Outro)
   - Vertically centered
   - Dramatic presentation
   - Impact over density

### Responsive Font Sizing

Font sizes are calculated relative to viewport:

- Base sizes increased by 20-40%
- Maintains readability on small screens
- Scales proportionally with container

## Troubleshooting

### Issue: Text appears too large

**Solution**: Reduce font sizes in individual card components by 10-20%.

### Issue: Content feels cramped

**Solution**: Increase `paddingTop` percentage in card components (e.g., from 0.15 to 0.18).

### Issue: Blank space still visible

**Solution**:

1. Check if background images have transparency
2. Adjust `paddingTop` values
3. Increase content section margins

### Issue: Text cut off on some devices

**Solution**:

1. Test on actual devices
2. Add max-width constraints to text containers
3. Adjust padding values

## Performance Considerations

### Video Size

- Resolution: 1080x1920 (Full HD vertical)
- File size: Similar to 1920x1080 (same total pixels)
- Rendering time: Comparable to horizontal format

### Mobile Delivery

- Optimized for mobile data consumption
- Standard bitrate: 128kbps audio, CRF 23 video
- Typical file size: ~20-40MB for 5-minute video

## Future Enhancements

Consider implementing:

1. **Dynamic Layout** - Adjust based on content length
2. **Adaptive Font Sizes** - Scale based on text length
3. **Multiple Formats** - Support 1:1, 16:9, and 9:16
4. **Safe Zones** - Account for platform UI overlays
5. **A/B Testing** - Optimize positioning based on engagement

## Related Documentation

- [Remotion Usage Guide](./REMOTION_USAGE.md)
- [Video Generation Summary](./VIDEO_GENERATION_SUMMARY.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Thai Learning Context](../rules/thai-learning-context.md)
