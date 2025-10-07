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
  audioUrl: string;
  text: string;
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

  async generateSynchronizedLessonForEpisode(videoId: string, episodeNumber: number): Promise<void> {
    try {
      this.logger.log(`Starting synchronized lesson generation for video: ${videoId}, episode: ${episodeNumber}`);

      const lessonDir = path.join(this.videosDir, videoId, `lesson_${episodeNumber.toString()}`);

      // Load required data files for this episode
      const [microlessonScript, timingMetadata, audioSegments] = await Promise.all([
        this.loadMicrolessonScriptForEpisode(lessonDir),
        this.loadTimingMetadataForEpisode(lessonDir),
        this.loadAudioSegmentsForEpisode(lessonDir),
      ]);

      // Generate synchronized lesson structure
      const synchronizedLesson = this.createSynchronizedLesson(microlessonScript, timingMetadata, audioSegments, lessonDir);

      // Save the synchronized lesson
      await this.saveSynchronizedLesson(lessonDir, synchronizedLesson);

      this.logger.log(`Successfully generated synchronized lesson for video: ${videoId}, episode: ${episodeNumber}`);
    } catch (error) {
      this.logger.error(`Failed to generate synchronized lesson for video: ${videoId}, episode: ${episodeNumber}`, error.stack);
      throw error;
    }
  }

  private async loadMicrolessonScriptForEpisode(episodeDir: string): Promise<MicrolessonScript> {
    const scriptPath = path.join(episodeDir, 'microlesson_script.json');
    const scriptContent = await fs.readFile(scriptPath, 'utf-8');
    return JSON.parse(scriptContent);
  }

  private async loadTimingMetadataForEpisode(episodeDir: string): Promise<{ segments: TimingSegment[] }> {
    const timingPath = path.join(episodeDir, 'lesson_segments', 'timing-metadata.json');
    const timingContent = await fs.readFile(timingPath, 'utf-8');
    return JSON.parse(timingContent);
  }

  private async loadAudioSegmentsForEpisode(episodeDir: string): Promise<{ audioSegments: Array<{ id: string; screenElement: string }> }> {
    const audioSegmentsPath = path.join(episodeDir, 'audio_segments.json');
    const audioSegmentsContent = await fs.readFile(audioSegmentsPath, 'utf-8');
    return JSON.parse(audioSegmentsContent);
  }

  private createSynchronizedLesson(
    microlessonScript: MicrolessonScript,
    timingMetadata: { segments: TimingSegment[] },
    audioSegments: { audioSegments: Array<{ id: string; screenElement: string }> },
    videoDir: string,
  ): SynchronizedLesson {
    const segmentBasedTiming: SegmentBasedTiming[] = [];
    const vocabularyWords = microlessonScript.lesson.keyVocabulary || [];

    // Create timing segments based on the timing metadata
    for (const segment of timingMetadata.segments) {
      // Find corresponding audio segment for correct screenElement
      const audioSegment = audioSegments.audioSegments.find((as) => as.id === segment.segmentId);
      const screenElement = audioSegment ? audioSegment.screenElement : this.mapSegmentToScreenElement(segment.segmentId);

      const timingSegment: SegmentBasedTiming = {
        startTime: segment.startTime,
        endTime: segment.endTime,
        duration: segment.duration,
        screenElement: screenElement,
        audioUrl: this.generateAudioUrl(videoDir, segment.fileName),
        text: segment.text,
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

  private generateAudioUrl(videoDir: string, fileName: string): string {
    // Check if this is an episode directory (contains episode number)
    const videoId = this.getVideoIdFromPath(videoDir);
    const pathParts = videoDir.split(path.sep);
    const lastPart = pathParts[pathParts.length - 1];

    // If the last part is a number, it's an episode directory
    if (/^\d+$/.test(lastPart)) {
      const episodeNumber = lastPart;
      return `/videos/${videoId}/lesson_${episodeNumber}/lesson_segments/${fileName}`;
    } else {
      // Legacy single microlesson structure
      return `/videos/${videoId}/lesson_segments/${fileName}`;
    }
  }

  private getVideoIdFromPath(videoDir: string): string {
    const pathParts = videoDir.split(path.sep);
    const lastPart = pathParts[pathParts.length - 1];

    // If the last part is a number, it's an episode directory, so get the parent
    if (/^\d+$/.test(lastPart)) {
      return pathParts[pathParts.length - 2];
    } else {
      // Single microlesson structure
      return lastPart;
    }
  }

  private async saveSynchronizedLesson(videoDir: string, synchronizedLesson: SynchronizedLesson): Promise<void> {
    const outputPath = path.join(videoDir, 'final_synchronized_lesson.json');
    const formattedOutput = JSON.stringify(synchronizedLesson, null, 2);

    await fs.writeFile(outputPath, formattedOutput, 'utf-8');
    this.logger.log(`Synchronized lesson saved to: ${outputPath}`);
  }
}
