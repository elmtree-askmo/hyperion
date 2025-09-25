import { Injectable } from '@nestjs/common';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

interface AudioSegment {
  id: string;
  text: string;
  textTh?: string;
  screenElement: string;
  vocabWord?: string;
  visualDescription: string;
  metadata?: any;
}

interface AudioSegmentsResponse {
  audioSegments: AudioSegment[];
}

export interface TimingMetadata {
  segmentId: string;
  fileName: string;
  duration: number;
  startTime: number;
  endTime: number;
  text: string;
}

export interface TtsTimingMetadata {
  segments: TimingMetadata[];
  totalDuration: number;
  generatedAt: string;
}

@Injectable()
export class TtsAudioSegmentsService {
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
      const episodeDir = path.join(this.videosDir, videoId, `episode_${episodeNumber.toString()}`);
      const segmentsPath = path.join(episodeDir, 'lesson_segments');
      const audioSegmentsPath = path.join(episodeDir, 'audio_segments.json');
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

        // Generate TTS audio for this segment
        const duration = await this.generateTtsAudio(segment.text, audioFilePath);

        // Create timing metadata entry
        const timingEntry: TimingMetadata = {
          segmentId: segment.id,
          fileName: fileName,
          duration: duration,
          startTime: currentTime,
          endTime: currentTime + duration,
          text: segment.text,
        };

        timingMetadata.push(timingEntry);
        currentTime += duration;

        console.log(`Generated TTS audio for Episode ${episodeNumber}, segment ${segment.id}: ${fileName} (${duration.toFixed(2)}s)`);
      }

      // Create final timing metadata
      const result: TtsTimingMetadata = {
        segments: timingMetadata,
        totalDuration: currentTime,
        generatedAt: new Date().toISOString(),
      };

      // Save timing metadata
      fs.writeFileSync(timingMetadataPath, JSON.stringify(result, null, 2));

      console.log(`✅ Generated ${segments.length} TTS audio files for Episode ${episodeNumber} with total duration: ${currentTime.toFixed(2)}s`);

      return result;
    } catch (error) {
      console.error(`Failed to generate TTS audio segments for episode ${episodeNumber}:`, error);
      throw new Error(`Failed to generate TTS audio segments for episode ${episodeNumber}: ${error.message}`);
    }
  }

  async generateTtsAudioSegments(videoId: string): Promise<TtsTimingMetadata> {
    try {
      const videoPath = path.join(this.videosDir, videoId);
      const segmentsPath = path.join(videoPath, 'lesson_segments');
      const audioSegmentsPath = path.join(videoPath, 'audio_segments.json');
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
        throw new Error(`Audio segments not found for video: ${videoId}`);
      }

      const audioSegmentsData: AudioSegmentsResponse = JSON.parse(fs.readFileSync(audioSegmentsPath, 'utf8'));
      const segments = audioSegmentsData.audioSegments;

      const timingMetadata: TimingMetadata[] = [];
      let currentTime = 0;

      // Process each segment
      for (const segment of segments) {
        const fileName = `${segment.id}.wav`;
        const audioFilePath = path.join(segmentsPath, fileName);

        // Generate TTS audio for this segment
        const duration = await this.generateTtsAudio(segment.text, audioFilePath);

        // Create timing metadata entry
        const timingEntry: TimingMetadata = {
          segmentId: segment.id,
          fileName: fileName,
          duration: duration,
          startTime: currentTime,
          endTime: currentTime + duration,
          text: segment.text,
        };

        timingMetadata.push(timingEntry);
        currentTime += duration;

        console.log(`Generated TTS audio for segment ${segment.id}: ${fileName} (${duration.toFixed(2)}s)`);
      }

      // Create final timing metadata
      const result: TtsTimingMetadata = {
        segments: timingMetadata,
        totalDuration: currentTime,
        generatedAt: new Date().toISOString(),
      };

      // Save timing metadata
      fs.writeFileSync(timingMetadataPath, JSON.stringify(result, null, 2));

      console.log(`TTS audio generation completed for video ${videoId}. Total duration: ${currentTime.toFixed(2)}s`);
      return result;
    } catch (error) {
      console.error('Failed to generate TTS audio segments:', error);
      throw new Error(`Failed to generate TTS audio segments: ${error.message}`);
    }
  }

  private async generateTtsAudio(text: string, outputPath: string): Promise<number> {
    try {
      // Configure TTS request
      const request = {
        input: { text: text },
        voice: {
          name: 'en-US-Chirp3-HD-Achernar', // High-quality TTS voice
          languageCode: 'en-US',
        },
        audioConfig: {
          audioEncoding: 'LINEAR16' as const, // WAV format
          speakingRate: 1.0, // Normal speed
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
      console.error(`Failed to generate TTS audio for text: "${text.substring(0, 50)}..."`, error);
      throw new Error(`Failed to generate TTS audio: ${error.message}`);
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
      console.error(`Failed to get audio duration for file: ${audioFilePath}`, error);
      // Fallback: estimate duration based on audio file size (rough approximation)
      try {
        const stats = fs.statSync(audioFilePath);
        // Rough estimate: 24kHz * 16bit * 1channel = 48000 bytes/second
        const estimatedDuration = stats.size / 48000;
        console.warn(`Using estimated duration: ${estimatedDuration}s for ${audioFilePath}`);
        return Math.max(estimatedDuration, 1.0); // Minimum 1 second
      } catch (fallbackError) {
        console.error(`Failed to get file stats for: ${audioFilePath}`, fallbackError);
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
      console.error('Failed to read TTS timing metadata:', error);
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
      console.error(`Failed to read segment audio file: ${segmentId}`, error);
      return null;
    }
  }
}
