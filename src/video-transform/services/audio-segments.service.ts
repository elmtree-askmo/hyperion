import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AudioSegmentsResponse, AudioSegment } from '../dto/audio-segments.dto';

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

      // Generate audio segments from microlesson script
      const audioSegments = this.createAudioSegmentsFromScript(microlessonScript);

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

  private createAudioSegmentsFromScript(script: MicrolessonScript): AudioSegment[] {
    const segments: AudioSegment[] = [];

    // 1. Introduction segment - use lesson title
    segments.push({
      id: 'intro',
      text: `Welcome to today's lesson: ${script.lesson.title}. This lesson will help you master English conversation skills in real-world situations.`,
      textTh: script.lesson.titleTh,
      screenElement: 'title_card',
      visualDescription: `Title card showing "${script.lesson.title}" in English and "${script.lesson.titleTh}" in Thai with lesson duration ${Math.round(script.lesson.duration / 60)} minutes`,
    });

    // 2. Learning objectives segments
    script.lesson.learningObjectives.forEach((objective, index) => {
      segments.push({
        id: `learning_objective_${index + 1}`,
        text: `Learning objective ${index + 1}: ${objective.statement}`,
        textTh: objective.statementTh,
        screenElement: 'learning_objective_card',
        visualDescription: `Learning objective card displaying the main goal and Thai translation with cultural context examples`,
      });

      // Add step-by-step explanation
      if (objective.stepByStepExplanation && objective.stepByStepExplanation.length > 0) {
        segments.push({
          id: `explanation_${index + 1}`,
          text: `Here's how we'll achieve this: ${objective.stepByStepExplanation.join('. ')}`,
          screenElement: 'step_by_step_card',
          visualDescription: 'Step-by-step explanation with numbered points and visual progress indicators',
        });
      }
    });

    // 3. Key vocabulary segments
    script.lesson.keyVocabulary.slice(0, 10).forEach((vocab, index) => {
      segments.push({
        id: `vocab_word${index + 1}`,
        text: `Let's learn the word "${vocab.word}". For example: ${vocab.contextExample}`,
        screenElement: 'vocabulary_card',
        vocabWord: vocab.word,
        visualDescription: `Vocabulary card showing "${vocab.word}" with Thai translation "${vocab.thaiTranslation}", memory hook, and context example in a visually appealing format`,
        metadata: {
          thaiTranslation: vocab.thaiTranslation,
          memoryHook: vocab.memoryHook,
          contextExample: vocab.contextExample,
        },
      });
    });

    // 4. Grammar points segments
    script.lesson.grammarPoints.forEach((grammar, index) => {
      segments.push({
        id: `grammar_${index + 1}`,
        text: `Grammar focus: ${grammar.structure}. ${grammar.explanation}. Examples: ${grammar.examples.slice(0, 2).join('. ')}`,
        screenElement: 'grammar_card',
        visualDescription: `Grammar explanation card with structure pattern, examples in both English and Thai context`,
        metadata: {
          thaiTranslation: grammar.thaiExplanation,
        },
      });
    });

    // 5. Practice segments from comprehension questions
    script.lesson.comprehensionQuestions.forEach((question, index) => {
      segments.push({
        id: `practice_${index + 1}`,
        text: `Practice question: ${question.question}. Think about this in the context of: ${question.context}`,
        textTh: question.questionTh,
        screenElement: 'practice_card',
        visualDescription: `Interactive practice card with question in both languages and context scenario for real-world application`,
      });
    });

    // 6. Review segments from original segments
    if (script.lesson.originalSegments && script.lesson.originalSegments.length > 0) {
      segments.push({
        id: 'lesson_review',
        text: `Let's review what we covered: ${script.lesson.originalSegments.slice(0, 3).join(', ')}. These topics will help you in everyday English conversations.`,
        screenElement: 'review_card',
        visualDescription: 'Lesson review summary with key topics and takeaways highlighted in an organized layout',
      });
    }

    // 7. Conclusion segment
    segments.push({
      id: 'conclusion',
      text: `Congratulations! You've completed this English lesson. Remember to practice these phrases in real situations. Keep learning and improving your English skills every day.`,
      screenElement: 'conclusion_card',
      visualDescription: 'Motivational conclusion card with completion badge and encouragement for continued learning',
    });

    return segments;
  }
}
