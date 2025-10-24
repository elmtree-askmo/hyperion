import { Injectable, Logger } from '@nestjs/common';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

interface TextPart {
  text: string;
  language: 'th' | 'en';
  speakingRate?: number;
  englishTranslation?: string;
}

interface AudioSegment {
  id: string;
  text: string;
  textParts?: TextPart[];
  description?: string;
  screenElement: string;
  vocabWord?: string;
  visualDescription?: string;
  backgroundImageDescription?: string;
  metadata?: any;
}

interface AudioSegmentsResponse {
  audioSegments: AudioSegment[];
}

export interface TextPartTiming {
  text: string;
  language: string;
  duration: number;
  startTime: number;
  endTime: number;
  englishTranslation?: string;
}

export interface TimingMetadata {
  segmentId: string;
  fileName: string;
  duration: number;
  startTime: number;
  endTime: number;
  text: string;
  textPartTimings?: TextPartTiming[];
}

export interface TtsTimingMetadata {
  segments: TimingMetadata[];
  totalDuration: number;
  generatedAt: string;
}

@Injectable()
export class TtsAudioSegmentsService {
  private readonly logger = new Logger(TtsAudioSegmentsService.name);
  private readonly videosDir = path.join(process.cwd(), 'videos');
  private readonly credentialsPath = path.join(process.cwd(), '.credentials/gcloud_key.json');
  private readonly ttsClient: TextToSpeechClient;

  constructor() {
    // Initialize Google Cloud TTS client with credentials
    this.ttsClient = new TextToSpeechClient({
      keyFilename: this.credentialsPath,
    });
  }

  async generateTtsAudioSegmentsForEpisode(videoId: string, episodeNumber: number): Promise<TtsTimingMetadata> {
    try {
      const lessonDir = path.join(this.videosDir, videoId, `lesson_${episodeNumber.toString()}`);
      const segmentsPath = path.join(lessonDir, 'lesson_segments');
      const audioSegmentsPath = path.join(lessonDir, 'audio_segments.json');
      const timingMetadataPath = path.join(segmentsPath, 'timing-metadata.json');

      // Create lesson_segments directory if it doesn't exist
      if (!fs.existsSync(segmentsPath)) {
        fs.mkdirSync(segmentsPath, { recursive: true });
      }

      // Check if timing metadata already exists
      if (fs.existsSync(timingMetadataPath)) {
        const existingMetadata: TtsTimingMetadata = JSON.parse(fs.readFileSync(timingMetadataPath, 'utf8'));
        return existingMetadata;
      }

      // Read audio segments data
      if (!fs.existsSync(audioSegmentsPath)) {
        throw new Error(`Audio segments not found for video: ${videoId}, episode: ${episodeNumber}`);
      }

      const audioSegmentsData: AudioSegmentsResponse = JSON.parse(fs.readFileSync(audioSegmentsPath, 'utf8'));
      const segments = audioSegmentsData.audioSegments;

      const timingMetadata: TimingMetadata[] = [];
      let currentTime = 0;

      // Process each segment
      for (const segment of segments) {
        const fileName = `${segment.id}.wav`;
        const audioFilePath = path.join(segmentsPath, fileName);

        let duration: number;
        let textPartTimings: TextPartTiming[] | undefined;

        // Check if segment has textParts (new format with language separation)
        if (segment.textParts && segment.textParts.length > 0) {
          // Generate audio with multiple parts and merge them
          const result = await this.generateTtsAudioWithParts(segment.textParts, audioFilePath, segmentsPath, segment.id);
          duration = result.duration;
          textPartTimings = result.partTimings;
          this.logger.log(
            `Generated multi-part TTS audio for Episode ${episodeNumber}, segment ${segment.id}: ${fileName} (${duration.toFixed(2)}s) with ${textPartTimings.length} part timings`,
          );
        } else {
          // Backward compatibility: use original text field
          duration = await this.generateTtsAudio(segment.text, audioFilePath);
          this.logger.log(`Generated TTS audio for Episode ${episodeNumber}, segment ${segment.id}: ${fileName} (${duration.toFixed(2)}s)`);
        }

        // Create timing metadata entry
        const timingEntry: TimingMetadata = {
          segmentId: segment.id,
          fileName: fileName,
          duration: duration,
          startTime: currentTime,
          endTime: currentTime + duration,
          text: segment.text,
          textPartTimings: textPartTimings,
        };

        timingMetadata.push(timingEntry);
        currentTime += duration;
      }

      // Create final timing metadata
      const result: TtsTimingMetadata = {
        segments: timingMetadata,
        totalDuration: currentTime,
        generatedAt: new Date().toISOString(),
      };

      // Save timing metadata
      fs.writeFileSync(timingMetadataPath, JSON.stringify(result, null, 2));

      this.logger.log(`✅ Generated ${segments.length} TTS audio files for Episode ${episodeNumber} with total duration: ${currentTime.toFixed(2)}s`);

      return result;
    } catch (error) {
      this.logger.error(`Failed to generate TTS audio segments for episode ${episodeNumber}:`, error);
      throw new Error(`Failed to generate TTS audio segments for episode ${episodeNumber}: ${error.message}`);
    }
  }

  /**
   * Generate TTS audio with multiple text parts (Thai and English) and merge them
   * Returns both total duration and an array of part timings
   */
  async generateTtsAudioWithParts(
    textParts: TextPart[],
    outputPath: string,
    segmentsPath: string,
    segmentId: string,
  ): Promise<{ duration: number; partTimings: TextPartTiming[] }> {
    try {
      const tempFiles: string[] = [];
      const partTimings: TextPartTiming[] = [];

      this.logger.log(`Generating multi-part audio for ${segmentId} with ${textParts.length} parts`);

      // Filter and merge very short parts to avoid TTS issues
      const mergedParts = this.mergeShortTextParts(textParts);
      this.logger.log(`After merging short parts: ${mergedParts.length} parts (from ${textParts.length})`);

      let currentTime = 0;

      // Generate audio for each text part and record timing
      for (let i = 0; i < mergedParts.length; i++) {
        const part = mergedParts[i];
        const tempFileName = `${segmentId}_part_${i}.wav`;
        const tempFilePath = path.join(segmentsPath, tempFileName);

        // Determine speaking rate: English parts default to 0.8, Thai parts to 1.0
        const speakingRate = part.speakingRate || (part.language === 'en' ? 0.8 : 1.0);

        this.logger.log(
          `Generating part ${i + 1}/${mergedParts.length}: [${part.language}] "${part.text.substring(0, 50)}${part.text.length > 50 ? '...' : ''}" (rate: ${speakingRate})`,
        );

        // Generate audio for this part
        await this.generateTtsAudio(part.text, tempFilePath, speakingRate);

        // Verify the file was created successfully
        if (!fs.existsSync(tempFilePath)) {
          throw new Error(`Failed to create audio file: ${tempFilePath}`);
        }

        const stats = fs.statSync(tempFilePath);
        if (stats.size === 0) {
          throw new Error(`Generated audio file is empty: ${tempFilePath}`);
        }

        // Get duration of this part
        const partDuration = await this.getAudioDuration(tempFilePath);

        // Record timing for this part
        const timing: TextPartTiming = {
          text: part.text,
          language: part.language,
          duration: partDuration,
          startTime: currentTime,
          endTime: currentTime + partDuration,
        };

        // Include English translation if available (for Thai text parts)
        if (part.englishTranslation) {
          timing.englishTranslation = part.englishTranslation;
        }

        partTimings.push(timing);

        currentTime += partDuration;

        tempFiles.push(tempFilePath);
        this.logger.log(`✓ Part ${i + 1}/${mergedParts.length} generated successfully (${(stats.size / 1024).toFixed(2)} KB, ${partDuration.toFixed(2)}s)`);
      }

      // Merge all audio parts into one file
      if (tempFiles.length === 1) {
        // Only one part, just rename it
        this.logger.log(`Single part detected, renaming to final output`);
        fs.renameSync(tempFiles[0], outputPath);
      } else {
        // Multiple parts, merge them
        this.logger.log(`Merging ${tempFiles.length} audio parts into final output`);
        await this.mergeAudioFiles(tempFiles, outputPath);
      }

      // Get duration of the merged audio
      const duration = await this.getAudioDuration(outputPath);
      this.logger.log(`✓ Multi-part audio generation completed for ${segmentId} (${duration.toFixed(2)}s) with ${partTimings.length} timing entries`);

      return { duration, partTimings };
    } catch (error) {
      this.logger.error(`Failed to generate multi-part TTS audio for segment ${segmentId}:`, error);
      // Clean up any temporary files on error
      const segmentDir = path.join(segmentsPath);
      if (fs.existsSync(segmentDir)) {
        const files = fs.readdirSync(segmentDir);
        files.forEach((file) => {
          if (file.startsWith(`${segmentId}_part_`) && file.endsWith('.wav')) {
            const filePath = path.join(segmentDir, file);
            try {
              fs.unlinkSync(filePath);
              this.logger.log(`Cleaned up temporary file: ${file}`);
            } catch (cleanupError) {
              this.logger.warn(`Failed to clean up temporary file ${file}:`, cleanupError);
            }
          }
        });
      }
      throw new Error(`Failed to generate multi-part TTS audio: ${error.message}`);
    }
  }

  /**
   * Merge short text parts (especially single punctuation) with adjacent parts of the same language
   * to avoid TTS issues with very short texts
   */
  private mergeShortTextParts(textParts: TextPart[]): TextPart[] {
    if (textParts.length <= 1) {
      return textParts;
    }

    const merged: TextPart[] = [];
    let i = 0;

    while (i < textParts.length) {
      const current = textParts[i];

      // If current part is very short (< 3 characters, typically punctuation)
      // and same language as previous part, merge with previous
      if (current.text.trim().length < 3 && merged.length > 0) {
        const previous = merged[merged.length - 1];
        if (previous.language === current.language) {
          // Merge with previous part
          previous.text += current.text;
          // Merge English translations if both exist
          if (previous.englishTranslation && current.englishTranslation) {
            previous.englishTranslation += current.englishTranslation;
          } else if (current.englishTranslation) {
            previous.englishTranslation = current.englishTranslation;
          }
          this.logger.log(`Merged short part "${current.text}" with previous part`);
          i++;
          continue;
        }
      }

      // If current part is very short and same language as next part, merge with next
      if (current.text.trim().length < 3 && i + 1 < textParts.length) {
        const next = textParts[i + 1];
        if (next.language === current.language) {
          // Merge current with next
          const mergedPart: TextPart = {
            text: current.text + next.text,
            language: current.language,
            speakingRate: current.speakingRate || next.speakingRate,
          };
          // Merge English translations if available
          if (current.englishTranslation && next.englishTranslation) {
            mergedPart.englishTranslation = current.englishTranslation + next.englishTranslation;
          } else if (current.englishTranslation || next.englishTranslation) {
            mergedPart.englishTranslation = current.englishTranslation || next.englishTranslation;
          }
          merged.push(mergedPart);
          this.logger.log(`Merged short part "${current.text}" with next part`);
          i += 2; // Skip both current and next
          continue;
        }
      }

      // Otherwise, keep the part as is
      merged.push({ ...current });
      i++;
    }

    return merged;
  }

  async generateTtsAudio(text: string, outputPath: string, speed: number = 1, ssml: boolean = false): Promise<number> {
    try {
      // Configure TTS request
      let input = null;
      if (ssml) {
        input = { ssml: text };
      } else {
        input = { text: text };
      }

      const request = {
        input: input,
        voice: {
          // name: 'en-US-Chirp3-HD-Achernar', // High-quality TTS voice
          // languageCode: 'en-US',
          name: 'th-TH-Chirp3-HD-Achird',
          languageCode: 'th-TH',
        },
        audioConfig: {
          audioEncoding: 'LINEAR16' as const, // WAV format
          speakingRate: speed, // Normal speed
          sampleRateHertz: 24000, // High quality sample rate
        },
      };

      // Call Google Cloud TTS API
      const [response] = await this.ttsClient.synthesizeSpeech(request);

      // Save audio file
      if (response.audioContent) {
        fs.writeFileSync(outputPath, response.audioContent, 'binary');
      } else {
        throw new Error('No audio content received from TTS API');
      }

      // Measure exact duration using ffprobe
      const duration = await this.getAudioDuration(outputPath);

      return duration;
    } catch (error) {
      this.logger.error(`Failed to generate TTS audio for text: "${text.substring(0, 50)}..."`, error);
      throw new Error(`Failed to generate TTS audio: ${error.message}`);
    }
  }

  /**
   * Merge multiple audio files into one using ffmpeg
   */
  private async mergeAudioFiles(inputFiles: string[], outputFile: string): Promise<void> {
    try {
      // Verify all input files exist before merging
      for (const file of inputFiles) {
        if (!fs.existsSync(file)) {
          throw new Error(`Input file does not exist: ${file}`);
        }
        const stats = fs.statSync(file);
        if (stats.size === 0) {
          throw new Error(`Input file is empty: ${file}`);
        }
      }

      // Create a temporary concat list file for ffmpeg
      const concatListPath = outputFile.replace('.wav', '_concat.txt');
      const concatList = inputFiles.map((f) => `file '${path.basename(f)}'`).join('\n');
      fs.writeFileSync(concatListPath, concatList);

      this.logger.log(`Merging ${inputFiles.length} audio files...`);
      this.logger.log(`Concat list: ${concatList.replace(/\n/g, ', ')}`);

      // Use ffmpeg to concatenate audio files
      // For WAV files with same format, we can use concat demuxer with copy codec
      // But we need to ensure the format is exactly the same
      const concatDir = path.dirname(inputFiles[0]);
      const command = `cd "${concatDir}" && ffmpeg -f concat -safe 0 -i "${path.basename(concatListPath)}" -c copy "${path.basename(outputFile)}" -y 2>&1`;

      try {
        const { stdout, stderr } = await execAsync(command);
        if (stderr && stderr.includes('error')) {
          this.logger.warn(`ffmpeg stderr: ${stderr}`);
        }
      } catch (ffmpegError) {
        // If copy codec fails, try re-encoding
        this.logger.warn(`Copy codec failed, trying with re-encoding: ${ffmpegError.message}`);
        const reencodeCommand = `cd "${concatDir}" && ffmpeg -f concat -safe 0 -i "${path.basename(concatListPath)}" -ar 24000 -ac 1 -sample_fmt s16 "${path.basename(outputFile)}" -y 2>&1`;
        await execAsync(reencodeCommand);
      }

      // Verify output file was created
      if (!fs.existsSync(outputFile)) {
        throw new Error(`Output file was not created: ${outputFile}`);
      }

      const outputStats = fs.statSync(outputFile);
      if (outputStats.size === 0) {
        throw new Error(`Output file is empty: ${outputFile}`);
      }

      // Clean up temporary files
      fs.unlinkSync(concatListPath);
      inputFiles.forEach((f) => {
        if (fs.existsSync(f)) {
          fs.unlinkSync(f);
        }
      });

      this.logger.log(`Successfully merged ${inputFiles.length} audio files into ${path.basename(outputFile)} (${(outputStats.size / 1024).toFixed(2)} KB)`);
    } catch (error) {
      this.logger.error(`Failed to merge audio files:`, error);
      throw new Error(`Failed to merge audio files: ${error.message}`);
    }
  }

  private async getAudioDuration(audioFilePath: string): Promise<number> {
    try {
      // Use ffprobe to get precise audio duration
      const command = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioFilePath}"`;
      const { stdout } = await execAsync(command);

      const duration = parseFloat(stdout.trim());

      if (isNaN(duration)) {
        throw new Error('Failed to parse audio duration');
      }

      return duration;
    } catch (error) {
      this.logger.error(`Failed to get audio duration for file: ${audioFilePath}`, error);
      // Fallback: estimate duration based on audio file size (rough approximation)
      try {
        const stats = fs.statSync(audioFilePath);
        // Rough estimate: 24kHz * 16bit * 1channel = 48000 bytes/second
        const estimatedDuration = stats.size / 48000;
        console.warn(`Using estimated duration: ${estimatedDuration}s for ${audioFilePath}`);
        return Math.max(estimatedDuration, 1.0); // Minimum 1 second
      } catch (fallbackError) {
        this.logger.error(`Failed to get file stats for: ${audioFilePath}`, fallbackError);
        return 5.0; // Default fallback duration
      }
    }
  }

  async getTtsTimingMetadata(videoId: string): Promise<TtsTimingMetadata | null> {
    try {
      const timingMetadataPath = path.join(this.videosDir, videoId, 'lesson_segments', 'timing-metadata.json');

      if (!fs.existsSync(timingMetadataPath)) {
        return null;
      }

      const metadata: TtsTimingMetadata = JSON.parse(fs.readFileSync(timingMetadataPath, 'utf8'));
      return metadata;
    } catch (error) {
      this.logger.error('Failed to read TTS timing metadata:', error);
      return null;
    }
  }

  async getSegmentAudioFile(videoId: string, segmentId: string): Promise<Buffer | null> {
    try {
      const audioFilePath = path.join(this.videosDir, videoId, 'lesson_segments', `${segmentId}.wav`);

      if (!fs.existsSync(audioFilePath)) {
        return null;
      }

      return fs.readFileSync(audioFilePath);
    } catch (error) {
      this.logger.error(`Failed to read segment audio file: ${segmentId}`, error);
      return null;
    }
  }
}
