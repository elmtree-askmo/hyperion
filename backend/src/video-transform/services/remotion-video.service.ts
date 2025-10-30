/**
 * Remotion Video Generation Service
 * Handles video rendering using Remotion
 */
import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { FinalSynchronizedLesson, FlashcardsData, AudioSegmentsData, MicrolessonScript } from '../types/lesson-data.types';

const execAsync = promisify(exec);

@Injectable()
export class RemotionVideoService {
  private readonly logger = new Logger(RemotionVideoService.name);
  private readonly remotionDir = path.join(process.cwd(), '../remotion');
  private readonly videosDir = path.join(process.cwd(), 'videos');

  /**
   * Generate video from lesson data
   */
  async generateVideo(
    lessonPath: string,
    outputPath: string,
    onStatusUpdate?: (status: 'generating' | 'completed' | 'failed', data?: any) => Promise<void>,
  ): Promise<{ success: boolean; outputPath: string; error?: string }> {
    try {
      this.logger.log(`Starting video generation for lesson: ${lessonPath}`);

      // Notify status update: generating
      if (onStatusUpdate) {
        await onStatusUpdate('generating', { lessonPath });
      }

      // Load all required data files
      const lessonData = await this.loadLessonData(lessonPath);

      // Create temporary input props file
      const propsPath = await this.createPropsFile(lessonData);

      // Run Remotion render
      const videoPath = await this.renderVideo(propsPath, outputPath);

      // Clean up temporary files
      fs.unlinkSync(propsPath);

      this.logger.log(`Video generated successfully: ${videoPath}`);

      // Notify status update: completed
      if (onStatusUpdate) {
        await onStatusUpdate('completed', { lessonPath, outputPath: videoPath });
      }

      return {
        success: true,
        outputPath: videoPath,
      };
    } catch (error) {
      this.logger.error(`Video generation failed: ${error.message}`, error.stack);

      // Notify status update: failed
      if (onStatusUpdate) {
        await onStatusUpdate('failed', { lessonPath, error: error.message });
      }

      return {
        success: false,
        outputPath: '',
        error: error.message,
      };
    }
  }

  /**
   * Load and combine all lesson data
   */
  private async loadLessonData(lessonPath: string): Promise<any> {
    try {
      const basePath = path.join(this.videosDir, lessonPath);

      // Load final synchronized lesson
      const finalLessonPath = path.join(basePath, 'final_synchronized_lesson.json');
      const finalLessonData: FinalSynchronizedLesson = JSON.parse(fs.readFileSync(finalLessonPath, 'utf-8'));

      // Load microlesson script
      const scriptPath = path.join(basePath, 'microlesson_script.json');
      const scriptData: MicrolessonScript = JSON.parse(fs.readFileSync(scriptPath, 'utf-8'));

      // Load flashcards
      const flashcardsPath = path.join(basePath, 'flashcards.json');
      const flashcardsData: FlashcardsData = JSON.parse(fs.readFileSync(flashcardsPath, 'utf-8'));

      // Load audio segments
      const audioSegmentsPath = path.join(basePath, 'audio_segments.json');
      const audioSegmentsData: AudioSegmentsData = JSON.parse(fs.readFileSync(audioSegmentsPath, 'utf-8'));

      // Combine all data
      // Wrap in lessonData to match the component's expected props structure
      return {
        lessonData: {
          lesson: {
            title: scriptData.lesson.title,
            titleTh: scriptData.lesson.titleTh,
            episodeNumber: scriptData.seriesInfo.episodeNumber,
            totalEpisodes: scriptData.seriesInfo.totalEpisodes,
            segmentBasedTiming: finalLessonData.lesson.segmentBasedTiming,
          },
          flashcards: flashcardsData.flashcards,
          audioSegments: audioSegmentsData.audioSegments,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to load lesson data: ${error.message}`);
      throw new Error(`Failed to load lesson data: ${error.message}`);
    }
  }

  /**
   * Create temporary props file for Remotion
   */
  private async createPropsFile(lessonData: any): Promise<string> {
    const propsPath = path.join(this.remotionDir, 'temp-props.json');
    fs.writeFileSync(propsPath, JSON.stringify(lessonData, null, 2));
    return propsPath;
  }

  /**
   * Render video using Remotion CLI
   */
  private async renderVideo(propsPath: string, outputPath: string): Promise<string> {
    try {
      // Convert to absolute path if relative
      const absoluteOutputPath = path.isAbsolute(outputPath) ? outputPath : path.join(process.cwd(), outputPath);

      // Ensure output directory exists
      const outputDir = path.dirname(absoluteOutputPath);
      fs.mkdirSync(outputDir, { recursive: true });

      // Build Remotion command for MP4 export
      // Note: Use CRF for quality control (lower = better quality, 18-28 is good range)
      // Cannot use both CRF and video-bitrate together
      // Audio bitrate must be string with K or M suffix (e.g., "128K" or "0.128M")
      // IMPORTANT: Override dimensions to 9:16 (1080x1920) for mobile platform export
      // while keeping 1:1 (1024x1024) for Interactive Viewer preview
      const command = [
        'npx',
        'remotion',
        'render',
        'src/index.ts',
        'Lesson',
        absoluteOutputPath,
        '--props',
        propsPath,
        '--overwrite',
        '--codec',
        'h264',
        '--audio-bitrate',
        '128K',
        '--crf',
        '23',
        '--width',
        '1080',
        '--height',
        '1920',
      ].join(' ');

      this.logger.log(`Executing Remotion render: ${command}`);

      // Execute render command
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.remotionDir,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      if (stderr) {
        this.logger.warn(`Remotion stderr: ${stderr}`);
      }

      this.logger.log(`Remotion stdout: ${stdout}`);

      // Verify output file exists using absolute path
      const stats = fs.statSync(absoluteOutputPath);
      if (!stats.isFile()) {
        throw new Error('Output file was not created');
      }

      return absoluteOutputPath;
    } catch (error) {
      this.logger.error(`Remotion render failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get video generation progress (placeholder for future implementation)
   */
  async getProgress(jobId: string): Promise<{ progress: number; status: string }> {
    // TODO: Implement progress tracking
    return {
      progress: 0,
      status: 'pending',
    };
  }

  /**
   * Cancel video generation (placeholder for future implementation)
   */
  async cancelGeneration(jobId: string): Promise<boolean> {
    // TODO: Implement cancellation
    return false;
  }
}
