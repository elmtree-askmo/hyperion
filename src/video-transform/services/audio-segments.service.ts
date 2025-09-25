import { Injectable } from '@nestjs/common';
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
  private readonly videosDir = path.join(process.cwd(), 'videos');
  private readonly llm;

  constructor(private readonly llmConfigService: LLMConfigService) {
    // Get LLM instance with higher temperature for creative content
    const llmConfig: LLMConfig = {
      temperature: 0.7,
      model: {
        openai: 'gpt-4o',
        openrouter: 'deepseek/deepseek-chat-v3.1:free',
        groq: 'openai/gpt-oss-120b',
      },
    };

    this.llm = this.llmConfigService.getLLMWithConfig(llmConfig);

    if (this.llm) {
      console.log(`🎵 AudioSegments using ${this.llmConfigService.getLLMProvider()} LLM provider`);
    } else {
      throw new Error('❌ LLM is required for audio segments generation. Please configure LLM_PROVIDER and corresponding API key.');
    }
  }

  async generateAudioSegmentsForEpisode(videoId: string, episodeNumber: number): Promise<AudioSegmentsResponse> {
    try {
      const episodeDir = path.join(this.videosDir, videoId, `episode_${episodeNumber.toString()}`);
      const audioSegmentsPath = path.join(episodeDir, 'audio_segments.json');

      // Check if audio segments already exist
      if (fs.existsSync(audioSegmentsPath)) {
        const existingSegments: AudioSegmentsResponse = JSON.parse(fs.readFileSync(audioSegmentsPath, 'utf8'));
        return existingSegments;
      }

      // Read the microlesson script file for this episode
      const scriptPath = path.join(episodeDir, 'microlesson_script.json');
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
      if (!fs.existsSync(episodeDir)) {
        fs.mkdirSync(episodeDir, { recursive: true });
      }

      // Save the generated audio segments
      fs.writeFileSync(audioSegmentsPath, JSON.stringify(result, null, 2));

      return result;
    } catch (error) {
      console.error(`Failed to generate audio segments for episode ${episodeNumber}:`, error);
      throw new Error(`Failed to generate audio segments for episode ${episodeNumber}: ${error.message}`);
    }
  }

  async generateAudioSegments(videoId: string): Promise<AudioSegmentsResponse> {
    try {
      const audioSegmentsPath = path.join(this.videosDir, videoId, 'audio_segments.json');

      // Check if audio segments already exist
      if (fs.existsSync(audioSegmentsPath)) {
        const existingSegments: AudioSegmentsResponse = JSON.parse(fs.readFileSync(audioSegmentsPath, 'utf8'));
        return existingSegments;
      }

      // Read the microlesson script file
      const scriptPath = path.join(this.videosDir, videoId, 'microlesson_script.json');
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`Microlesson script not found for video: ${videoId}`);
      }

      const microlessonScript: MicrolessonScript = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));

      // Generate audio segments from microlesson script using LLM
      const audioSegments = await this.generateAudioSegmentsWithLLM(microlessonScript);

      const result: AudioSegmentsResponse = {
        audioSegments,
      };

      // Save the generated audio segments
      fs.writeFileSync(audioSegmentsPath, JSON.stringify(result, null, 2));

      return result;
    } catch (error) {
      console.error('Failed to generate audio segments:', error);
      throw new Error(`Failed to generate audio segments: ${error.message}`);
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
You are an expert English language instructor creating an engaging audio lesson script. 
Based on the provided microlesson script, generate natural, conversational audio segments that will be used for text-to-speech generation.

MICROLESSON SCRIPT DATA:
Title: ${script.lesson.title}
Title (Thai): ${script.lesson.titleTh}
Duration: ${Math.round(script.lesson.duration / 60)} minutes

Learning Objectives:
${script.lesson.learningObjectives.map((obj, i) => `${i + 1}. ${obj.statement}`).join('\n')}

Key Vocabulary:
${script.lesson.keyVocabulary
  .slice(0, 10)
  .map((vocab) => `- ${vocab.word}: ${vocab.contextExample}`)
  .join('\n')}

Grammar Points:
${script.lesson.grammarPoints.map((grammar, i) => `${i + 1}. ${grammar.structure}: ${grammar.explanation}`).join('\n')}

Practice Questions:
${script.lesson.comprehensionQuestions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}

INSTRUCTIONS:
Create engaging audio segments with natural, conversational text suitable for English language learners. Each segment should:
1. Use clear, simple English appropriate for the learning level
2. Sound natural when spoken by a text-to-speech system
3. Include smooth transitions and engaging introductions
4. Be concise but informative
5. Encourage learner participation

Generate the following types of segments:
- 1 intro segment welcoming learners
- 1-2 learning objective segments explaining what they'll learn
- 6-8 vocabulary segments introducing key words with examples
- 2-3 grammar segments explaining important structures
- 2-3 practice segments with interactive questions
- 1 conclusion segment encouraging continued learning

For vocabulary segments, include the target word clearly and use it in a natural example sentence.

Return ONLY a valid JSON object in this exact format:
{{
  "audioSegments": [
    {{
      "id": "intro",
      "text": "Welcome to today's lesson...",
      "screenElement": "title_card",
      "visualDescription": "..."
    }},
    {{
      "id": "vocab_word1", 
      "text": "First word: ...",
      "screenElement": "vocabulary_card",
      "vocabWord": "target word"
    }}
  ]
}}`;

      const promptTemplate = PromptTemplate.fromTemplate(prompt);
      const chain = RunnableSequence.from([promptTemplate, this.llm, new StringOutputParser()]);

      const result = await chain.invoke(
        {},
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
        console.log(`✅ Generated ${parsedResult.audioSegments.length} audio segments using LLM`);
        return parsedResult.audioSegments;
      } else {
        throw new Error('Invalid LLM response format');
      }
    } catch (error) {
      console.error('❌ LLM audio generation failed:', error.message);
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
