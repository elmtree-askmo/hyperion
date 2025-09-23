import { Injectable, BadRequestException } from '@nestjs/common';
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
  // Define the directory to save JSON files
  private readonly metadataDir = path.join(process.cwd(), 'metadata');

  constructor() {
    // Ensure metadata directory exists
    this.ensureMetadataDir();
  }

  private async ensureMetadataDir(): Promise<void> {
    try {
      await fs.mkdir(this.metadataDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create metadata directory:', error);
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
        console.log(`Using cached metadata for video ${videoId}`);
        return this.formatVideoMetadata(existingMetadata, videoId);
      }

      // If no cached metadata, fetch from API
      console.log(`Fetching new metadata for video ${videoId}`);
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
      console.error('YouTube metadata extraction error:', error);
      throw new BadRequestException(`Failed to fetch video metadata: ${error.message}`);
    }
  }

  /**
   * Load existing metadata from file if it exists
   */
  private async loadExistingMetadata(videoId: string): Promise<YoutubeVideoInfo | null> {
    try {
      const filename = `${videoId}.json`;
      const filepath = path.join(this.metadataDir, filename);

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
      const filename = `${videoId}.json`;
      const filepath = path.join(this.metadataDir, filename);

      // Convert videoInfo to JSON string with proper formatting
      const jsonContent = JSON.stringify(videoInfo, null, 2);

      await fs.writeFile(filepath, jsonContent, 'utf8');
      console.log(`Video metadata saved to: ${filepath}`);
    } catch (error) {
      console.error(`Failed to save video metadata to file: ${error.message}`);
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
      const subtitlePath = path.join(this.metadataDir, `${videoId}.en.vtt`);
      const existingTranscript = await this.loadExistingTranscript(subtitlePath);
      if (existingTranscript) {
        console.log(`Using cached transcript for video ${videoId}`);
        return existingTranscript;
      }

      // If no cached transcript, download from API
      console.log(`Downloading new transcript for video ${videoId}`);
      try {
        await youtubedl(youtubeUrl, {
          writeAutoSub: true,
          subLang: 'en', // Fixed: use subLang instead of writeSubsLang
          skipDownload: true,
          output: path.join(this.metadataDir, `${videoId}.%(ext)s`),
        });

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
      // Simple VTT parser - extract text content only
      const lines = vttContent.split('\n');
      const textLines: string[] = [];

      for (const line of lines) {
        // Skip header, timestamps, and empty lines
        if (!line.startsWith('WEBVTT') && !line.match(/^\d{2}:\d{2}:\d{2}\.\d{3}/) && line.trim() !== '' && !line.includes('-->')) {
          textLines.push(line.trim());
        }
      }

      return textLines.join(' ');
    } catch (error) {
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
