import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { AudioSegmentsResponse, AudioSegment } from '../dto/audio-segments.dto';
import { LLMConfigService, LLMConfig } from './llm-config.service';

interface MicrolessonScript {
  lesson: {
    title: string;
    titleTh: string;
    duration: number;
    learningObjectives: Array<{
      statement: string;
      statementTh: string;
      stepByStepExplanation: string[];
      thaiContextExamples: Array<{
        englishPhrase: string;
        thaiContext: string;
        situation: string;
        memoryHook: string;
        pronunciation: string;
      }>;
      memoryHooks: string[];
      summaryPoints: string[];
    }>;
    keyVocabulary: Array<{
      word: string;
      thaiTranslation: string;
      memoryHook: string;
      contextExample: string;
    }>;
    grammarPoints: Array<{
      structure: string;
      explanation: string;
      thaiExplanation: string;
      examples: string[];
    }>;
    comprehensionQuestions: Array<{
      question: string;
      questionTh: string;
      expectedAnswer: string;
      context: string;
    }>;
    originalSegments: string[];
  };
  seriesInfo: {
    seriesTitle: string;
    seriesTitleTh: string;
    episodeNumber: number;
    totalEpisodes: number;
    description: string;
    descriptionTh: string;
  };
  audioUrl: null;
}

@Injectable()
export class AudioSegmentsService {
  private readonly logger = new Logger(AudioSegmentsService.name);
  private readonly videosDir = path.join(process.cwd(), 'videos');
  private readonly llm;

  constructor(private readonly llmConfigService: LLMConfigService) {
    // Get LLM instance with higher temperature for creative content
    const llmConfig: LLMConfig = {
      temperature: 0.7,
      model: {
        openai: 'gpt-5',
        openrouter: 'deepseek/deepseek-chat-v3.1:free',
        groq: 'openai/gpt-oss-120b',
      },
    };

    this.llm = this.llmConfigService.getLLMWithConfig(llmConfig);

    if (this.llm) {
      this.logger.log(`🎵 AudioSegments using ${this.llmConfigService.getLLMProvider()} LLM provider`);
    } else {
      throw new Error('❌ LLM is required for audio segments generation. Please configure LLM_PROVIDER and corresponding API key.');
    }
  }

  async generateAudioSegmentsForEpisode(videoId: string, episodeNumber: number): Promise<AudioSegmentsResponse> {
    try {
      const lessonDir = path.join(this.videosDir, videoId, `lesson_${episodeNumber.toString()}`);
      const audioSegmentsPath = path.join(lessonDir, 'audio_segments.json');

      // Check if audio segments already exist
      if (fs.existsSync(audioSegmentsPath)) {
        const existingSegments: AudioSegmentsResponse = JSON.parse(fs.readFileSync(audioSegmentsPath, 'utf8'));
        return existingSegments;
      }

      // Read the microlesson script file for this episode
      const scriptPath = path.join(lessonDir, 'microlesson_script.json');
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`Microlesson script not found for video: ${videoId}, episode: ${episodeNumber}`);
      }

      const microlessonScript: MicrolessonScript = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));

      // Generate audio segments from microlesson script using LLM
      const audioSegments = await this.generateAudioSegmentsWithLLM(microlessonScript);

      const result: AudioSegmentsResponse = {
        audioSegments,
      };

      // Ensure episode directory exists
      if (!fs.existsSync(lessonDir)) {
        fs.mkdirSync(lessonDir, { recursive: true });
      }

      // Save the generated audio segments
      fs.writeFileSync(audioSegmentsPath, JSON.stringify(result, null, 2));

      return result;
    } catch (error) {
      this.logger.error(`Failed to generate audio segments for episode ${episodeNumber}:`, error);
      throw new Error(`Failed to generate audio segments for episode ${episodeNumber}: ${error.message}`);
    }
  }

  /**
   * Generate audio segments using LLM for more natural and engaging content
   */
  private async generateAudioSegmentsWithLLM(script: MicrolessonScript): Promise<AudioSegment[]> {
    // LLM should always be available at this point due to constructor check
    if (!this.llm || !this.llmConfigService.isLLMAvailable()) {
      throw new Error('❌ LLM is required for audio segments generation but is not available');
    }

    try {
      const prompt = `
You are an expert English language instructor creating an engaging audio lesson script for Thai college students (early English learners). 
Based on the provided microlesson script, generate natural, conversational audio segments that will be used for text-to-speech generation.

CRITICAL LANGUAGE REQUIREMENTS:
- ALL explanations, instructions, and descriptions must be in Thai language
- English should ONLY be used for the specific phrases/words students need to learn and practice
- Remember: Most students are early English learners and need Thai explanations
- Use natural, modern Thai that university students understand

MICROLESSON SCRIPT DATA:
{scriptData}

INSTRUCTIONS:
Create engaging audio segments with natural, conversational text suitable for Thai English language learners. Each segment should:
1. Use Thai for ALL explanations and instructions
2. Use English ONLY for the specific phrases students need to learn
3. Sound natural when spoken by Thai TTS system (for Thai parts) and English TTS (for English phrases)
4. Include smooth transitions and engaging introductions in Thai
5. Be concise but informative
6. Encourage learner participation in Thai
7. Include contextual background image descriptions that reflect Thai cultural settings

Generate the following types of segments:
- 1 intro segment welcoming learners (in Thai)
- 1-2 learning objective segments explaining what they'll learn (in Thai with English phrases)
- 6-8 vocabulary segments introducing key words (Thai explanations with English words/examples)
- 2-3 grammar segments explaining important structures (Thai explanations with English examples)
- 2-3 practice segments with interactive questions (Thai questions with English practice phrases)
- 1 conclusion segment encouraging continued learning (in Thai)

For vocabulary segments, include the target English word clearly but explain it in Thai with Thai examples.

VISUAL DESCRIPTION GUIDELINES:
CRITICAL: Every single segment MUST include BOTH visualDescription and backgroundImageDescription fields.
- visualDescription: A short, engaging description of what the learner will see/experience in this segment (1-2 sentences) (in English)
- backgroundImageDescription: Detailed description of the Thai cultural setting/location for AI image generation (in English)

For backgroundImageDescription:
- Describes authentic Thai cultural settings and locations
- Supports the learning content visually
- Uses recognizable Bangkok/Thailand landmarks when appropriate
- Creates an immersive cultural learning environment
- Matches the segment's educational purpose

TEXT PARTS FORMAT (CRITICAL FOR TTS):
Each segment MUST include BOTH "text" and "textParts" fields:
- "text": Complete text for display purposes (Thai + English mixed)
- "textParts": Array separating Thai and English portions for optimized TTS synthesis
  - Thai parts: {{"text": "...", "language": "th"}}
  - English parts: {{"text": "...", "language": "en", "speakingRate": 0.8}}
  
The "textParts" allows the TTS system to apply slower speaking rate (0.8x) to English parts for better learning comprehension, while keeping Thai at normal speed (1.0x).

Return ONLY a valid JSON object in this exact format:
{{
  "audioSegments": [
    {{
      "id": "intro",
      "text": "สวัสดีค่ะ ยินดีต้อนรับสู่บทเรียนวันนี้...",
      "textParts": [
        {{"text": "สวัสดีค่ะ ยินดีต้อนรับสู่บทเรียนวันนี้...", "language": "th"}}
      ],
      "description": "คำอธิบายเป็นภาษาไทย",
      "screenElement": "title_card",
      "visualDescription": "Bright and welcoming introduction to the lesson",
      "backgroundImageDescription": "Modern English language learning classroom in Bangkok with Thai and international students, bright natural lighting, Thai cultural elements visible through windows"
    }},
    {{
      "id": "learning_objective1",
      "text": "เป้าหมายแรกคือ I'd like to make a reservation และ Could you recommend a restaurant?",
      "textParts": [
        {{"text": "เป้าหมายแรกคือ ", "language": "th"}},
        {{"text": "I'd like to make a reservation", "language": "en", "speakingRate": 0.8}},
        {{"text": " และ ", "language": "th"}},
        {{"text": "Could you recommend a restaurant?", "language": "en", "speakingRate": 0.8}}
      ],
      "description": "คำอธิบายเป็นภาษาไทย",
      "screenElement": "objective_card",
      "visualDescription": "Clear presentation of the first learning goal",
      "backgroundImageDescription": "Relevant Thai setting that matches the learning objective"
    }},
    {{
      "id": "vocab_restaurant", 
      "text": "คำศัพท์: restaurant — ร้านอาหาร ใช้เมื่อพูดถึงสถานที่กินข้าว เช่น Let's go to a Japanese restaurant near Siam",
      "textParts": [
        {{"text": "คำศัพท์: ", "language": "th"}},
        {{"text": "restaurant", "language": "en", "speakingRate": 0.8}},
        {{"text": " — ร้านอาหาร ใช้เมื่อพูดถึงสถานที่กินข้าว เช่น ", "language": "th"}},
        {{"text": "Let's go to a Japanese restaurant near Siam", "language": "en", "speakingRate": 0.8}}
      ],
      "description": "คำอธิบายเป็นภาษาไทย",
      "screenElement": "vocabulary_card",
      "vocabWord": "restaurant",
      "visualDescription": "Introduction to the vocabulary word with visual context",
      "backgroundImageDescription": "Relevant Thai cultural scene that supports the vocabulary learning, such as Terminal 21 Food Court or Café Amazon setting"
    }}
  ]
}}

IMPORTANT REMINDERS:
1. Every segment must have both visualDescription and backgroundImageDescription
2. Every segment must have both "text" (complete) and "textParts" (separated by language)
3. English parts in textParts should have "speakingRate": 0.8 for slower, clearer pronunciation
4. Thai parts in textParts should NOT have speakingRate (defaults to 1.0)
5. Ensure textParts accurately reflects the content in the "text" field
6. AVOID creating very short textParts (< 3 characters like ", " or " และ "). Instead, merge short connectors with adjacent Thai text to ensure smooth TTS generation`;

      const promptTemplate = PromptTemplate.fromTemplate(prompt);
      const chain = RunnableSequence.from([promptTemplate, this.llm, new StringOutputParser()]);

      const result = await chain.invoke(
        {
          scriptData: JSON.stringify(script, null, 2),
        },
        {
          tags: ['audio-segments-generation', 'llm-content-creation'],
          metadata: {
            step: 'generate_audio_segments_with_llm',
            lesson_title: script.lesson.title,
            vocabulary_count: script.lesson.keyVocabulary.length,
            grammar_points_count: script.lesson.grammarPoints.length,
            questions_count: script.lesson.comprehensionQuestions.length,
          },
        },
      );

      // Extract JSON from the LLM response
      const jsonContent = this.extractJSONFromResponse(result);
      const parsedResult = JSON.parse(jsonContent);

      if (parsedResult.audioSegments && Array.isArray(parsedResult.audioSegments)) {
        this.logger.log(`✅ Generated ${parsedResult.audioSegments.length} audio segments using LLM`);
        return parsedResult.audioSegments;
      } else {
        throw new Error('Invalid LLM response format');
      }
    } catch (error) {
      this.logger.error('❌ LLM audio generation failed:', error.message);
      throw new Error(`Failed to generate audio segments with LLM: ${error.message}`);
    }
  }

  /**
   * Extract JSON from LLM response (handles markdown code blocks and extra text)
   */
  private extractJSONFromResponse(response: string): string {
    // Remove markdown code blocks
    let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // Find JSON object boundaries
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (start !== -1 && end !== -1 && end > start) {
      return cleaned.substring(start, end + 1);
    }

    return cleaned.trim();
  }
}
