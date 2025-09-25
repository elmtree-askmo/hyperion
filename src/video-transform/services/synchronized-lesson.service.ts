import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

interface TimingSegment {
  segmentId: string;
  fileName: string;
  duration: number;
  startTime: number;
  endTime: number;
  text: string;
}

interface SegmentBasedTiming {
  startTime: number;
  endTime: number;
  screenElement: string;
  duration: number;
  vocabWord?: string;
}

interface SynchronizedLesson {
  lesson: {
    segmentBasedTiming: SegmentBasedTiming[];
  };
  audioUrl: string;
}

interface MicrolessonScript {
  lesson: {
    keyVocabulary: Array<{
      word: string;
      thaiTranslation: string;
      memoryHook: string;
      contextExample: string;
    }>;
  };
}

@Injectable()
export class SynchronizedLessonService {
  private readonly logger = new Logger(SynchronizedLessonService.name);
  private readonly videosDir = path.join(process.cwd(), 'videos');

  async generateSynchronizedLesson(videoId: string): Promise<void> {
    try {
      this.logger.log(`Starting synchronized lesson generation for video: ${videoId}`);

      const videoDir = path.join(this.videosDir, videoId);

      // Load required data files
      const [microlessonScript, timingMetadata] = await Promise.all([this.loadMicrolessonScript(videoDir), this.loadTimingMetadata(videoDir)]);

      // Generate synchronized lesson structure
      const synchronizedLesson = this.createSynchronizedLesson(microlessonScript, timingMetadata);

      // Save the synchronized lesson
      await this.saveSynchronizedLesson(videoDir, synchronizedLesson);

      this.logger.log(`Successfully generated synchronized lesson for video: ${videoId}`);
    } catch (error) {
      this.logger.error(`Failed to generate synchronized lesson for video: ${videoId}`, error.stack);
      throw error;
    }
  }

  private async loadMicrolessonScript(videoDir: string): Promise<MicrolessonScript> {
    const scriptPath = path.join(videoDir, 'microlesson_script.json');
    const scriptContent = await fs.readFile(scriptPath, 'utf-8');
    return JSON.parse(scriptContent);
  }

  private async loadTimingMetadata(videoDir: string): Promise<{ segments: TimingSegment[] }> {
    const timingPath = path.join(videoDir, 'lesson_segments', 'timing-metadata.json');
    const timingContent = await fs.readFile(timingPath, 'utf-8');
    return JSON.parse(timingContent);
  }

  private createSynchronizedLesson(microlessonScript: MicrolessonScript, timingMetadata: { segments: TimingSegment[] }): SynchronizedLesson {
    const segmentBasedTiming: SegmentBasedTiming[] = [];
    const vocabularyWords = microlessonScript.lesson.keyVocabulary || [];

    // Create timing segments based on the timing metadata
    for (const segment of timingMetadata.segments) {
      const timingSegment: SegmentBasedTiming = {
        startTime: segment.startTime,
        endTime: segment.endTime,
        duration: segment.duration,
        screenElement: this.mapSegmentToScreenElement(segment.segmentId),
      };

      // Map vocabulary words to appropriate segments
      if (segment.segmentId.startsWith('vocab_word')) {
        const vocabIndex = this.extractVocabIndex(segment.segmentId);
        if (vocabIndex !== null && vocabularyWords[vocabIndex - 1]) {
          timingSegment.vocabWord = vocabularyWords[vocabIndex - 1].word;
          timingSegment.screenElement = 'vocabulary_card';
        }
      }

      segmentBasedTiming.push(timingSegment);
    }

    return {
      lesson: {
        segmentBasedTiming,
      },
      audioUrl: 'synchronized_audio.mp3',
    };
  }

  private mapSegmentToScreenElement(segmentId: string): string {
    // Map segment IDs to appropriate screen elements
    const elementMap: Record<string, string> = {
      intro: 'title_card',
      conclusion: 'conclusion_card',
      lesson_review: 'review_card',
    };

    // Handle specific patterns
    if (segmentId.startsWith('learning_objective')) {
      return 'objective_card';
    }
    if (segmentId.startsWith('explanation')) {
      return 'explanation_card';
    }
    if (segmentId.startsWith('vocab_word')) {
      return 'vocabulary_card';
    }
    if (segmentId.startsWith('grammar')) {
      return 'grammar_card';
    }
    if (segmentId.startsWith('practice')) {
      return 'practice_card';
    }

    // Return mapped element or default
    return elementMap[segmentId] || 'content_card';
  }

  private extractVocabIndex(segmentId: string): number | null {
    const regex = /vocab_word(\d+)/;
    const match = regex.exec(segmentId);
    return match ? parseInt(match[1], 10) : null;
  }

  private async saveSynchronizedLesson(videoDir: string, synchronizedLesson: SynchronizedLesson): Promise<void> {
    const outputPath = path.join(videoDir, 'final_synchronized_lesson.json');
    const formattedOutput = JSON.stringify(synchronizedLesson, null, 2);

    await fs.writeFile(outputPath, formattedOutput, 'utf-8');
    this.logger.log(`Synchronized lesson saved to: ${outputPath}`);
  }
}
