# Test Scripts

This directory contains various test scripts for different services used in the Hyperion backend application.

## Available Test Scripts

### 1. LLM Service Test (`test-llm-service.ts`)

Tests the LLM (Large Language Model) service connectivity and functionality.

### 2. Gemini Image Service Test (`test-gemini-image-service.ts`)

Tests the Google Gemini image processing service.

### 3. TTS Service Test (`test-tts-service.ts`)

Tests the Text-to-Speech (TTS) audio generation service using Google Cloud TTS API.

### 4. Flashcards Service Test (`test-flashcards-service.ts`)

Tests the vocabulary flashcards generation service with LLM-powered content creation including Thai pronunciations and memory hooks.

## Flashcards Service Test

This script tests the Flashcards generation service that creates vocabulary flashcards with Thai pronunciations, translations, and memory hooks using LLM.

### Prerequisites

1. **LLM API Key**: OpenAI, Groq, or OpenRouter API key
2. **Lesson Data**: Existing microlesson_script.json files in the videos directory
3. **Node.js**: Version 18+ with TypeScript support

### Setup

1. **LLM Configuration**:

   ```bash
   # Add to your .env file
   LLM_PROVIDER=openai  # or 'groq' or 'openrouter'
   OPENAI_API_KEY=your-api-key-here
   # or
   GROQ_API_KEY=your-groq-api-key
   # or
   OPENROUTER_API_KEY=your-openrouter-api-key
   ```

2. **Test Data**:
   - Ensure you have lesson data in `videos/{videoId}/lesson_{number}/microlesson_script.json`
   - The script will use `henIVlCPVIY/lesson_1` by default

### Usage

```bash
# Build the project first
npm run build

# Run the test script
node dist/scripts/test-flashcards-service.js

# Or using ts-node directly
npx ts-node scripts/test-flashcards-service.ts
```

### Tests Performed

1. **Generate Flashcards for Single Lesson**
   - Reads vocabulary from microlesson_script.json
   - Uses LLM to generate enhanced flashcards
   - Saves flashcards to lesson directory

2. **Retrieve Existing Flashcards**
   - Tests reading flashcards from saved JSON file
   - Verifies data integrity

3. **Generate Flashcards for All Lessons**
   - Processes all lessons in a video
   - Creates flashcards for each lesson

### Sample Output

```
🃏 Testing Flashcards Service...

📹 Video ID: henIVlCPVIY
📖 Lesson Number: 1

Test 1: Generating flashcards for lesson 1...
────────────────────────────────────────────────────────────
✅ Generated 3 flashcards

🃏 Flashcard 1:
   Word: recommend
   Thai: แนะนำ
   Pronunciation: เรค-คอม-เมนด์
   Phonetic: /ˌrekəˈmend/
   Part of Speech: verb
   Difficulty: medium
   Memory Hook: จำด้วยเสียง เร-คอม-เมนด์ คล้ายคำที่คนไทยพูดว่า 'เรคอมเมนต์'
   Example: Can you recommend a good phone? - ขอแนะนำโทรศัพท์ที่ Central World

🃏 Flashcard 2:
   Word: vegetarian
   Thai: มังสวิรัติ
   Pronunciation: เว-จิ-แท-เรียน
   Phonetic: /ˌvedʒɪˈteəriən/
   Part of Speech: adjective
   Difficulty: medium
   Memory Hook: แยกเสียง เวจ = ผัก แล้วนึกถึงเทศกาลกินเจ
   Example: Do you have vegetarian options? - ถามที่ Terminal 21 Food Court

────────────────────────────────────────────────────────────

Test 2: Getting existing flashcards...
────────────────────────────────────────────────────────────
✅ Retrieved 3 flashcards from file

Test 3: Generating flashcards for all lessons...
────────────────────────────────────────────────────────────
✅ Generated flashcards for 3 lessons:
   lesson_1: 3 flashcards
   lesson_2: 4 flashcards
   lesson_3: 3 flashcards

════════════════════════════════════════════════════════════
✅ All tests completed successfully!
════════════════════════════════════════════════════════════
```

### Output Files

Generated flashcards are saved to:

```
videos/{videoId}/lesson_{number}/flashcards.json
```

Example structure:

```json
{
  "flashcards": [
    {
      "word": "recommend",
      "thaiTranslation": "แนะนำ",
      "pronunciation": "เรค-คอม-เมนด์",
      "phonetic": "/ˌrekəˈmend/",
      "memoryHook": "จำด้วยเสียง...",
      "contextExample": "Can you recommend...",
      "partOfSpeech": "verb",
      "difficulty": "medium"
    }
  ]
}
```

### Troubleshooting

#### Common Issues:

1. **Missing LLM API Key**

   ```
   ❌ Test failed: LLM provider not configured
   ```

   - Solution: Add appropriate API key to `.env` file
   - Set `LLM_PROVIDER` environment variable

2. **No Lesson Data**

   ```
   ❌ Microlesson script not found for lesson 1
   ```

   - Solution: Ensure microlesson_script.json exists in lesson directory
   - Run microlesson generation first

3. **LLM API Rate Limit**

   ```
   ❌ Flashcard generation failed: Rate limit exceeded
   ```

   - Solution: Wait a few moments and retry
   - Check your API usage quota

4. **Invalid JSON Response**
   ```
   ❌ Failed to parse LLM flashcards response
   ```

   - Solution: Service will automatically fallback to basic flashcards
   - Check LLM model compatibility

## TTS Service Test

This script tests the Text-to-Speech functionality including audio generation and timing metadata.

### Prerequisites

1. **Google Cloud Credentials**: You need a valid Google Cloud service account key
2. **FFmpeg**: Required for audio duration measurement
3. **Test Data**: Audio segments data in the videos directory

### Setup

1. **Google Cloud Setup**:

   ```bash
   # Create .credentials directory
   mkdir -p .credentials

   # Place your Google Cloud service account key
   # Download from Google Cloud Console and save as:
   # .credentials/gcloud_key.json
   ```

2. **Install FFmpeg**:

   ```bash
   # macOS
   brew install ffmpeg

   # Ubuntu/Debian
   sudo apt install ffmpeg

   # Windows
   # Download from https://ffmpeg.org/
   ```

### Usage

```bash
# Using npm script (recommended)
npm run test:tts

# Or directly with ts-node
npx ts-node scripts/test-tts-service.ts
```

### Tests Performed

The TTS test script performs the following tests:

1. **Service Initialization**
   - Verifies TTS service can be initialized
   - Checks Google Cloud credentials availability

2. **Audio Generation Test**
   - Tests TTS audio generation for existing lesson segments
   - Measures audio duration and timing metadata

3. **Metadata Retrieval Test**
   - Tests retrieval of timing metadata
   - Validates segment information

4. **Audio File Access Test**
   - Tests retrieval of generated audio files
   - Verifies file integrity

### Sample Output

```
🎤 Testing TTS Audio Segments Service...
============================================================
✅ TTS Service initialized successfully
✅ Google Cloud credentials found
📁 Found test data: henIVlCPVIY/lesson_1
🚀 Generating TTS audio segments...
✅ TTS Generation Results:
   📊 Total segments: 15
   ⏱️  Total duration: 45.32 seconds
   📅 Generated at: 2025-09-30T10:15:30.123Z

📋 First 3 segments:
   1. segment-1: 3.21s - "Welcome to this English lesson. Today we will learn..."
   2. segment-2: 2.87s - "Let's start with some basic vocabulary words..."
   3. segment-3: 4.15s - "The first word we'll learn is 'hello'. This is a..."

🔍 Testing timing metadata retrieval...
✅ Successfully retrieved timing metadata
   📊 Retrieved 15 segments

🎵 Testing audio file retrieval for segment: segment-1
✅ Successfully retrieved audio file (154832 bytes)

🎉 TTS Service test completed successfully!
============================================================
🏁 Test completed successfully!
```

### Troubleshooting

#### Common Issues:

1. **Missing Google Cloud Credentials**

   ```
   ❌ Google Cloud credentials not found at .credentials/gcloud_key.json
   ```

   - Solution: Download service account key from Google Cloud Console
   - Place the JSON file at `.credentials/gcloud_key.json`

2. **FFmpeg Not Found**

   ```
   ❌ Failed to get audio duration: ffprobe command not found
   ```

   - Solution: Install FFmpeg using your system's package manager

3. **No Test Data**

   ```
   ⚠️ No test data found, creating minimal test...
   ```

   - This is normal if you don't have existing lesson data
   - The script will create a minimal test case

4. **API Quota Exceeded**

   ```
   ❌ TTS Service test failed: Quota exceeded
   ```

   - Solution: Check your Google Cloud TTS API quota and billing

## General Prerequisites

## Setup

1. Install dependencies (already done if you're in the main project):

   ```bash
   npm install openai dotenv
   ```

2. Create or update your `.env` file in the project root:
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ```

## Usage

### Running the test script:

```bash
# Using npm script (recommended)
npm run test:openai

# Or directly with ts-node
npx ts-node scripts/test-openai-connectivity.ts
```

## Tests Performed

The script performs the following connectivity tests:

1. **API Key Configuration Test**
   - Verifies that the OPENAI_API_KEY environment variable is set
   - Checks if the API key has the correct format (starts with 'sk-')

2. **Basic Connection Test**
   - Tests basic connectivity to OpenAI API
   - Fetches the list of available models

3. **Chat Completion Test**
   - Tests the chat completions endpoint
   - Sends a simple test message and verifies the response

4. **Model Availability Test**
   - Checks which common models are available in your account
   - Looks for models like gpt-3.5-turbo, gpt-4, text-embedding-ada-002

## Sample Output

```
[2025-09-25T02:49:34.867Z] INFO: Starting OpenAI API Connectivity Tests...
============================================================
[2025-09-25T02:49:34.867Z] INFO: Testing API Key Configuration...
[2025-09-25T02:49:34.867Z] SUCCESS: ✓ API Key Configuration test passed
[2025-09-25T02:49:34.868Z] INFO: Testing basic API connection...
[2025-09-25T02:49:35.296Z] SUCCESS: ✓ Basic Connection test passed. Found 50 models
[2025-09-25T02:49:35.296Z] INFO: Testing Chat Completions API...
[2025-09-25T02:49:35.332Z] SUCCESS: ✓ Chat Completion test passed. Response: "Hello, World!"
[2025-09-25T02:49:35.332Z] INFO: Testing model availability...
[2025-09-25T02:49:35.364Z] SUCCESS: ✓ Model Availability test passed. Found models: gpt-3.5-turbo, gpt-4
============================================================
Test Summary:
============================================================
✓ API Key Configuration: API key is properly configured (5ms)
✓ Basic Connection: Successfully connected. Found 50 models (428ms)
✓ Chat Completion: Response: "Hello, World!" (36ms)
✓ Model Availability: Found 2/3 common models: gpt-3.5-turbo, gpt-4 (32ms)
============================================================
Total Tests: 4
Passed: 4
Failed: 0
Total Duration: 531ms
============================================================
🎉 All tests passed! OpenAI API connectivity is working correctly.
```

## Troubleshooting

### Common Issues:

1. **Missing API Key**

   ```
   ✗ API Key Configuration test failed: OPENAI_API_KEY environment variable is not set
   ```

   - Solution: Add your OpenAI API key to the `.env` file

2. **Invalid API Key Format**

   ```
   ✗ API Key Configuration test failed: OPENAI_API_KEY does not appear to be a valid OpenAI API key format
   ```

   - Solution: Ensure your API key starts with 'sk-'

3. **Network/Authentication Errors**

   ```
   ✗ Basic Connection test failed: Request failed with status code 401
   ```

   - Solution: Check if your API key is valid and has not expired
   - Verify your OpenAI account has sufficient credits

4. **Model Access Issues**

   ```
   ✗ Chat Completion test failed: Model gpt-4 is not available
   ```

   - Solution: Use a model available in your OpenAI plan (e.g., gpt-3.5-turbo)

## Integration

You can also import and use the test class in your own TypeScript code:

```typescript
import { OpenAIConnectivityTest } from './scripts/test-openai-connectivity';

const tester = new OpenAIConnectivityTest();
await tester.runAllTests();
```
