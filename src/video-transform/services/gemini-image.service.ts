import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ProxyConfigService } from './proxy-config.service';

@Injectable()
export class GeminiImageService {
  private readonly logger = new Logger(GeminiImageService.name);
  private readonly genAI: GoogleGenAI;

  constructor(private readonly proxyConfigService: ProxyConfigService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    // Create GoogleGenAI instance
    const genAIConfig: any = {
      apiKey,
      httpOptions: {
        timeout: 180000,
      },
    };

    this.genAI = new GoogleGenAI(genAIConfig);
  }

  async generateImage(prompt: string, filePath: string): Promise<string> {
    try {
      const startTime = Date.now();
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: prompt,
      });

      // Ensure the directory for the file exists, not the file itself
      const fileDir = path.dirname(filePath);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          this.logger.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, 'base64');

          fs.writeFileSync(filePath, buffer);
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          this.logger.log(`Image saved as ${filePath} (elapsed: ${duration}s)`);
          return filePath;
        }
      }

      throw new Error('Image data not found in response.');
    } catch (error) {
      this.logger.error('Error generating image with @google/genai:', error);
      throw new Error('Failed to generate image using @google/genai. The model might not be available or the API has changed.');
    }
  }

  async generateImagesForEpisode(videoId: string, episodeNumber: number): Promise<void> {
    const videosDir = path.join(process.cwd(), 'videos');
    const lessonDir = path.join(videosDir, videoId, `lesson_${episodeNumber}`);
    const audioSegmentsPath = path.join(lessonDir, 'audio_segments.json');
    const lessonSegmentsDir = path.join(lessonDir, 'lesson_segments');

    this.logger.log(`🖼️ Generating images for video ${videoId}, episode ${episodeNumber}`);

    try {
      // Read audio segments file
      if (!fs.existsSync(audioSegmentsPath)) {
        this.logger.error(`Audio segments file not found: ${audioSegmentsPath}`);
        return;
      }

      const audioSegmentsData = JSON.parse(fs.readFileSync(audioSegmentsPath, 'utf8'));
      const audioSegments = audioSegmentsData.audioSegments;

      // Ensure lesson_segments directory exists
      if (!fs.existsSync(lessonSegmentsDir)) {
        fs.mkdirSync(lessonSegmentsDir, { recursive: true });
      }

      // Generate images for each segment that has backgroundImageDescription
      for (const segment of audioSegments) {
        if (segment.backgroundImageDescription) {
          try {
            this.logger.log(`🖼️ Generating image for segment: ${segment.id}`);

            // Generate image using the background description
            const filePath = path.join(lessonSegmentsDir, `${segment.id}.png`);
            // Only generate the image if the file does not already exist
            if (!fs.existsSync(filePath)) {
              const imagePath = await this.generateImage(segment.backgroundImageDescription, filePath);
              this.logger.log(`✅ Generated and saved image for segment ${segment.id}: ${imagePath}`);
            } else {
              this.logger.log(`Image for segment ${segment.id} already exists at ${filePath}, skipping generation.`);
            }
          } catch (error) {
            this.logger.error(`Failed to generate image for segment ${segment.id}:`, error);
          }
        }
      }

      this.logger.log(`🖼️ Completed image generation for video ${videoId}, episode ${episodeNumber}`);
    } catch (error) {
      this.logger.error(`Failed to generate episode images for video ${videoId}, episode ${episodeNumber}:`, error);
      throw error;
    }
  }
}
