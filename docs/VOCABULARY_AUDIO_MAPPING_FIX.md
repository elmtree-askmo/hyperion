# Vocabulary Audio Mapping Fix

## Problem Description

When playing vocabulary cards in the interactive viewer, the audio and displayed word were mismatched:

- Playing "vegetarian" card → heard "recommendation" audio
- Playing "recommendation" card → heard "vegetarian" audio

## Root Cause

The bug was in `/src/video-transform/services/synchronized-lesson.service.ts` in the `createSynchronizedLesson` method.

### Original Implementation (Incorrect)

The code was using array index mapping between `microlesson_script.json`'s `keyVocabulary` array and the segment IDs:

```typescript
// Extract vocab index from segment ID (e.g., "vocab_word2" → 2)
const vocabIndex = this.extractVocabIndex(segment.segmentId);
if (vocabIndex !== null && vocabularyWords[vocabIndex - 1]) {
  // Map: vocab_word2 → vocabularyWords[1] → "vegetarian" ❌ WRONG!
  timingSegment.vocabWord = vocabularyWords[vocabIndex - 1].word;
}
```

### The Issue

The order of words in `microlesson_script.json`'s `keyVocabulary` array didn't match the order in `audio_segments.json`:

**microlesson_script.json keyVocabulary order:**

1. recommend (index 0)
2. vegetarian (index 1)
3. recommendation (index 2)

**audio_segments.json order:**

1. vocab_word1 → "recommend"
2. vocab_word2 → "recommendation"
3. vocab_word3 → "vegetarian"

This caused:

- `vocab_word2` → `vocabularyWords[1]` → "vegetarian" ❌
- `vocab_word3` → `vocabularyWords[2]` → "recommendation" ❌

## Solution

Modified the code to read the `vocabWord` field directly from `audio_segments.json` instead of using array index mapping:

```typescript
// Use vocabWord from audio_segments.json if available for vocabulary cards
// Support both 'vocab_word' and 'vocab_' prefixes (lesson_1/2 use vocab_word1, lesson_3 uses vocab_produce)
if (segment.segmentId.startsWith('vocab') && audioSegment?.vocabWord) {
  timingSegment.vocabWord = audioSegment.vocabWord; // ✅ Correct!
  timingSegment.screenElement = 'vocabulary_card';
}
```

## Files Modified

1. **`/src/video-transform/services/synchronized-lesson.service.ts`**
   - Updated `loadAudioSegmentsForEpisode` method to include `vocabWord` in type definition
   - Modified `createSynchronizedLesson` method to use `vocabWord` from `audioSegment`
   - Removed unused `extractVocabIndex` method

2. **All lesson files regenerated:**
   - `/videos/henIVlCPVIY/lesson_1/final_synchronized_lesson.json` - Manually fixed first, then regenerated
   - `/videos/henIVlCPVIY/lesson_2/final_synchronized_lesson.json` - Regenerated with fixed code
   - `/videos/henIVlCPVIY/lesson_3/final_synchronized_lesson.json` - Regenerated with fixed code (also had missing vocabWord fields)

## Verification

After the fix, all lessons have correct mappings:

**Lesson 1:**

- `vocab_word1.wav` → `"recommend"` ✅
- `vocab_word2.wav` → `"recommendation"` ✅
- `vocab_word3.wav` → `"vegetarian"` ✅

**Lesson 2:**

- `vocab_word1.wav` → `"recommend"` ✅
- `vocab_word2.wav` → `"recommendation"` ✅
- `vocab_word3.wav` → `"deposit"` ✅
- `vocab_word4.wav` → `"balance"` ✅
- `vocab_word5.wav` → `"fiction"` ✅
- `vocab_word6.wav` → `"genre"` ✅

**Lesson 3:**

- `vocab_produce.wav` → `"produce"` ✅
- `vocab_dairy.wav` → `"dairy"` ✅
- `vocab_shopping_list.wav` → `"shopping list"` ✅
- `vocab_section.wav` → `"section"` ✅
- `vocab_fresh.wav` → `"fresh"` ✅
- `vocab_genre.wav` → `"genre"` ✅
- `vocab_tickets.wav` → `"tickets"` ✅
- `vocab_daily_routine.wav` → `"daily routine"` ✅

## Prevention

The fix ensures that future generations of `final_synchronized_lesson.json` will correctly map vocabulary words by reading them directly from `audio_segments.json`, which is the single source of truth for segment-to-vocabulary mapping.

## Date

2025-10-09
