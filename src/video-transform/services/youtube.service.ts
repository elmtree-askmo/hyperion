import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
const youtubedl = require('youtube-dl-exec');

export interface VideoMetadata {
  title: string;
  description: string;
  duration: number;
  language: string;
  thumbnailUrl: string;
  channelName: string;
  publishedAt: Date;
  viewCount: number;
}

// Define the expected structure from youtube-dl-exec
interface YoutubeVideoInfo {
  id?: string;
  title?: string;
  description?: string;
  duration?: number;
  language?: string;
  thumbnail?: string;
  uploader?: string;
  channel?: string;
  upload_date?: string;
  view_count?: number;
  [key: string]: any; // Allow other properties
}

@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);
  // Define the directory to save JSON files
  private readonly videosDir = path.join(process.cwd(), 'videos');

  constructor() {}

  private async ensureDir(dir: string): Promise<void> {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create videos directory:', error);
    }
  }

  async getVideoMetadata(youtubeUrl: string): Promise<VideoMetadata> {
    try {
      if (!this.isValidYouTubeUrl(youtubeUrl)) {
        throw new BadRequestException('Invalid YouTube URL');
      }

      // Extract video ID for checking existing metadata
      const videoId = this.extractVideoId(youtubeUrl);
      if (!videoId) {
        throw new BadRequestException('Could not extract video ID from YouTube URL');
      }

      // Check if metadata file already exists
      const existingMetadata = await this.loadExistingMetadata(videoId);
      if (existingMetadata) {
        this.logger.log(`Using cached metadata for video ${videoId}`);
        return this.formatVideoMetadata(existingMetadata, videoId);
      }

      // If no cached metadata, fetch from API
      this.logger.log(`Fetching new metadata for video ${videoId}`);
      const videoInfo = (await youtubedl(youtubeUrl, {
        'dump-single-json': true,
        'no-check-certificates': true,
        'no-warnings': true,
        'prefer-free-formats': true,
        'add-header': ['referer:youtube.com', 'user-agent:googlebot'],
      })) as YoutubeVideoInfo;

      // Save complete videoInfo to JSON file
      await this.saveVideoDetailsToFile(videoInfo, videoId);

      // Return formatted metadata
      return this.formatVideoMetadata(videoInfo, videoId);
    } catch (error) {
      this.logger.error('YouTube metadata extraction error:', error);
      throw new BadRequestException(`Failed to fetch video metadata: ${error.message}`);
    }
  }

  /**
   * Load existing metadata from file if it exists
   */
  private async loadExistingMetadata(videoId: string): Promise<YoutubeVideoInfo | null> {
    try {
      const filename = 'metadata.json';
      const filepath = path.join(`${this.videosDir}/${videoId}`, filename);

      // Check if file exists
      await fs.access(filepath);

      // Read and parse the file
      const fileContent = await fs.readFile(filepath, 'utf8');
      const metadata = JSON.parse(fileContent) as YoutubeVideoInfo;

      return metadata;
    } catch (error) {
      // File doesn't exist or can't be read
      return null;
    }
  }

  /**
   * Load existing transcript from VTT file if it exists
   */
  private async loadExistingTranscript(subtitlePath: string): Promise<string | null> {
    try {
      // Check if file exists
      await fs.access(subtitlePath);

      // Read and parse the VTT file
      const vttContent = await fs.readFile(subtitlePath, 'utf8');
      return this.parseVTTSubtitles(vttContent);
    } catch (error) {
      // File doesn't exist or can't be read
      return null;
    }
  }

  /**
   * Format video metadata into the expected structure
   */
  private formatVideoMetadata(videoInfo: YoutubeVideoInfo, videoId: string): VideoMetadata {
    return {
      title: videoInfo.title || '',
      description: videoInfo.description || '',
      duration: videoInfo.duration || 0,
      language: videoInfo.language || 'en',
      thumbnailUrl: videoInfo.thumbnail || '',
      channelName: videoInfo.uploader || videoInfo.channel || '',
      publishedAt: videoInfo.upload_date ? this.parseUploadDate(videoInfo.upload_date) : new Date(),
      viewCount: videoInfo.view_count || 0,
    };
  }

  private parseUploadDate(uploadDate: string): Date {
    try {
      // youtube-dl returns date in YYYYMMDD format
      if (uploadDate && uploadDate.length === 8) {
        const year = parseInt(uploadDate.substring(0, 4));
        const month = parseInt(uploadDate.substring(4, 6)) - 1; // Month is 0-indexed
        const day = parseInt(uploadDate.substring(6, 8));
        return new Date(year, month, day);
      }
      return new Date();
    } catch (error) {
      return new Date();
    }
  }

  private async saveVideoDetailsToFile(videoInfo: YoutubeVideoInfo, videoId: string): Promise<void> {
    try {
      const filename = 'metadata.json';
      const filepath = path.join(`${this.videosDir}/${videoId}`, filename);
      await this.ensureDir(`${this.videosDir}/${videoId}`);

      // Convert videoInfo to JSON string with proper formatting
      const jsonContent = JSON.stringify(videoInfo, null, 2);

      await fs.writeFile(filepath, jsonContent, 'utf8');
      this.logger.log(`Video metadata saved to: ${filepath}`);
    } catch (error) {
      this.logger.error(`Failed to save video metadata to file: ${error.message}`);
      // Don't throw error here to avoid breaking the main flow
    }
  }

  async getVideoTranscript(youtubeUrl: string): Promise<string> {
    try {
      const videoId = this.extractVideoId(youtubeUrl);
      if (!videoId) {
        throw new BadRequestException('Could not extract video ID from YouTube URL');
      }

      // Check if transcript file already exists
      const subtitlePath = path.join(`${this.videosDir}/${videoId}`, 'subtitles.en.vtt');
      const existingTranscript = await this.loadExistingTranscript(subtitlePath);
      if (existingTranscript) {
        this.logger.log(`Using cached transcript for video ${videoId}`);
        return existingTranscript;
      }

      // If no cached transcript, download from API
      this.logger.log(`Downloading new transcript for video ${videoId}`);
      try {
        await this.ensureDir(`${this.videosDir}/${videoId}`);
        await youtubedl(youtubeUrl, {
          writeAutoSub: true,
          subLang: 'en', // Fixed: use subLang instead of writeSubsLang
          skipDownload: true,
          output: path.join(`${this.videosDir}/${videoId}`, 'subtitles'),
        });
        this.logger.log(`Video subtitles saved to: ${subtitlePath}`);

        // Read the subtitle file if it was created
        try {
          const subtitleContent = await fs.readFile(subtitlePath, 'utf8');
          return this.parseVTTSubtitles(subtitleContent);
        } catch (readError) {
          console.warn('Could not read subtitle file:', readError.message);
        }
      } catch (subtitleError) {
        console.warn('Could not extract subtitles:', subtitleError.message);
      }

      return `Transcript not available for video ${videoId}. Auto-generated captions may not be available.`;
    } catch (error) {
      throw new BadRequestException(`Failed to get video transcript: ${error.message}`);
    }
  }

  private parseVTTSubtitles(vttContent: string): string {
    try {
      const lines = vttContent.split('\n');
      const textSegments: string[] = [];
      let currentSegment = '';
      let isReadingText = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines
        if (line === '') {
          if (currentSegment) {
            textSegments.push(currentSegment);
            currentSegment = '';
          }
          isReadingText = false;
          continue;
        }

        // Skip header lines
        if (line.startsWith('WEBVTT') || line.startsWith('Kind:') || line.startsWith('Language:')) {
          continue;
        }

        // Skip timestamp lines (format: HH:MM:SS.mmm --> HH:MM:SS.mmm)
        if (line.includes('-->')) {
          if (currentSegment) {
            textSegments.push(currentSegment);
            currentSegment = '';
          }
          isReadingText = true;
          continue;
        }

        // Skip position/alignment information
        if (line.includes('align:') || line.includes('position:')) {
          continue;
        }

        // Process text lines
        if (isReadingText && line !== '') {
          // Clean the text by removing time stamps and HTML-like tags
          let cleanText = line;

          // Remove time stamp markers like <00:00:08.280>
          cleanText = cleanText.replace(/<\d{2}:\d{2}:\d{2}\.\d{3}>/g, '');

          // Remove HTML-like tags like <c> and </c>
          cleanText = cleanText.replace(/<\/?[^>]+(>|$)/g, '');

          // Clean up extra spaces
          cleanText = cleanText.replace(/\s+/g, ' ').trim();

          // Only add non-empty text
          if (cleanText !== '') {
            currentSegment = cleanText;
          }
        }
      }

      // Add final segment if exists
      if (currentSegment) {
        textSegments.push(currentSegment);
      }

      // Remove duplicate segments and create clean transcript
      const uniqueSegments: string[] = [];
      const seenSegments = new Set<string>();

      for (const segment of textSegments) {
        const normalizedSegment = segment.toLowerCase().replace(/[^\w\s\[\]]/g, '');

        // Only add if we haven't seen this exact segment before
        if (!seenSegments.has(normalizedSegment)) {
          seenSegments.add(normalizedSegment);
          uniqueSegments.push(segment);
        }
      }

      // Join segments and do final cleanup for overlapping phrases
      let result = uniqueSegments.join(' ');

      // Advanced duplicate removal for overlapping phrases
      const words = result.split(/\s+/);
      const finalWords: string[] = [];

      for (let i = 0; i < words.length; i++) {
        const word = words[i];

        // Look for repeated sequences starting from this position
        let skipCount = 0;

        // Check for various lengths of repeated sequences (3-10 words)
        for (let seqLen = 3; seqLen <= Math.min(10, Math.floor((words.length - i) / 2)); seqLen++) {
          const sequence1 = words.slice(i, i + seqLen);
          const sequence2 = words.slice(i + seqLen, i + 2 * seqLen);

          // If sequences match, skip the repeated part
          if (sequence1.length === sequence2.length && sequence1.every((w, idx) => w.toLowerCase() === sequence2[idx]?.toLowerCase())) {
            skipCount = seqLen;
            break;
          }
        }

        if (skipCount > 0) {
          // Add the first occurrence and skip the repeated part
          for (let j = 0; j < skipCount; j++) {
            if (i + j < words.length) {
              finalWords.push(words[i + j]);
            }
          }
          i += skipCount * 2 - 1; // Skip both sequences (minus 1 because loop will increment)
        } else {
          finalWords.push(word);
        }
      }

      // Final cleanup: remove extra spaces and format properly
      result = finalWords.join(' ').replace(/\s+/g, ' ').trim();

      // Add line breaks after common markers for better readability
      result = result.replace(/(\[Music\])/g, '\n\n$1\n\n');
      result = result.replace(/(\[Applause\])/g, '\n\n$1\n\n');
      result = result.replace(/\n\n+/g, '\n\n'); // Clean up multiple line breaks
      result = result.trim();

      return result;
    } catch (error) {
      this.logger.error('Error parsing VTT subtitles:', error);
      return 'Failed to parse subtitle content';
    }
  }

  private extractVideoId(youtubeUrl: string): string {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = regex.exec(youtubeUrl);
    return match ? match[1] : '';
  }

  isValidYouTubeUrl(url: string): boolean {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  }
}
