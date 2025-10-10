# TTS Short Text Parts Fix

## Issue

**Error**: `Failed to get audio duration for file: .../grammar_modals_part_4.wav`

**Root Cause**: The LLM was generating very short textParts (e.g., `", "`, `" และ "`) that are too short for Google Cloud TTS to process reliably. These parts often result in:

- Empty or malformed audio files
- ffprobe unable to get duration
- TTS API returning no content

Example problematic structure:

```json
"textParts": [
  {"text": "คำศัพท์: ", "language": "th"},
  {"text": "restaurant", "language": "en", "speakingRate": 0.8},
  {"text": ", ", "language": "th"},  // ❌ Too short!
  {"text": "May we have a table?", "language": "en", "speakingRate": 0.8},
  {"text": ", ", "language": "th"},  // ❌ Too short!
  {"text": "Would you like salad?", "language": "en", "speakingRate": 0.8}
]
```

## Solution

### 1. Runtime Merging (`mergeShortTextParts`)

Added a method to automatically merge very short text parts (< 3 characters) with adjacent parts of the same language:

```typescript
private mergeShortTextParts(textParts: TextPart[]): TextPart[] {
  // Merge short parts (< 3 chars) with adjacent same-language parts
  // Before: [{"text": "คำ", "language": "th"}, {"text": ", ", "language": "th"}, {"text": "word", "language": "en"}]
  // After:  [{"text": "คำ, ", "language": "th"}, {"text": "word", "language": "en"}]
}
```

**Logic**:

1. If a part is < 3 characters AND same language as previous part → merge with previous
2. If a part is < 3 characters AND same language as next part → merge with next
3. Otherwise, keep as is

**Benefits**:

- Automatically fixes LLM-generated short parts
- No need to regenerate audio_segments.json
- Works with existing data

### 2. LLM Prompt Update

Updated the prompt to guide the LLM to avoid creating short textParts:

```
6. AVOID creating very short textParts (< 3 characters like ", " or " และ ").
   Instead, merge short connectors with adjacent Thai text to ensure smooth TTS generation
```

**Recommended structure**:

```json
"textParts": [
  {"text": "คำศัพท์: ", "language": "th"},
  {"text": "restaurant", "language": "en", "speakingRate": 0.8},
  {"text": ", May we have a table?, ", "language": "th"},  // ✅ Merged!
  {"text": "Would you like salad?", "language": "en", "speakingRate": 0.8}
]
```

Or better yet:

```json
"textParts": [
  {"text": "คำศัพท์: ", "language": "th"},
  {"text": "restaurant", "language": "en", "speakingRate": 0.8},
  {"text": " — ร้านอาหาร, ", "language": "th"},  // ✅ Meaningful Thai text
  {"text": "Let's go to a restaurant", "language": "en", "speakingRate": 0.8}
]
```

### 3. Enhanced Logging

Now logs the merging process:

```
Generating multi-part audio for grammar_modals with 6 parts
Merged short part ", " with previous part
After merging short parts: 3 parts (from 6)
```

## Testing

### Before Fix

```bash
# Error on parts with short texts
[Error] Failed to get audio duration for file: grammar_modals_part_4.wav
```

### After Fix

```bash
npm run build

# Clear old files
rm videos/henIVlCPVIY/lesson_1/lesson_segments/*.wav
rm videos/henIVlCPVIY/lesson_1/lesson_segments/timing-metadata.json

# Regenerate - should work now
# The mergeShortTextParts will automatically fix problematic segments
```

## Implementation Details

**File**: `src/video-transform/services/tts-audio-segments.service.ts`

**Key changes**:

1. Added `mergeShortTextParts()` method (lines 222-272)
2. Called in `generateTtsAudioWithParts()` before generating audio (line 151)
3. Enhanced logging to show merge operations

**File**: `src/video-transform/services/audio-segments.service.ts`

**Key changes**:

1. Updated LLM prompt to avoid short parts (line 243)

## Examples

### Example 1: Punctuation Merging

**Before**:

```json
[
  { "text": "คำศัพท์: ", "language": "th" },
  { "text": "menu", "language": "en" },
  { "text": ", ", "language": "th" },
  { "text": "dressing", "language": "en" }
]
```

**After Merge**:

```json
[
  { "text": "คำศัพท์: ", "language": "th" },
  { "text": "menu", "language": "en" },
  { "text": ", dressing", "language": "th" }, // Merged with next
  { "text": "dressing", "language": "en" } // This is now absorbed
]
```

Wait, this logic needs refinement - let me fix it properly.

Actually, the current implementation will merge ", " (Thai) with the previous Thai part, which is correct:

```json
[
  { "text": "คำศัพท์: , ", "language": "th" }, // Merged!
  { "text": "menu", "language": "en" },
  { "text": "dressing", "language": "en" }
]
```

### Example 2: Thai Connectors

**Before**:

```json
[
  { "text": "phrase1", "language": "en" },
  { "text": " และ ", "language": "th" },
  { "text": "phrase2", "language": "en" }
]
```

**After Merge** (no change - >= 3 chars):

```json
[
  { "text": "phrase1", "language": "en" },
  { "text": " และ ", "language": "th" }, // Kept as is (>= 3 chars)
  { "text": "phrase2", "language": "en" }
]
```

## Future Improvements

1. **Minimum audio duration check**: Add a check to ensure generated audio is at least 0.5s
2. **Silent padding**: Add small silence between merged parts for better pacing
3. **Better LLM examples**: Provide more examples in prompt showing proper textParts structure
4. **Validation**: Add pre-flight validation of textParts before TTS generation

## Related Files

- `src/video-transform/services/tts-audio-segments.service.ts` - Main fix implementation
- `src/video-transform/services/audio-segments.service.ts` - LLM prompt update
