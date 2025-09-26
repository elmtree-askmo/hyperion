import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ProxyConfigService } from './proxy-config.service';

@Injectable()
export class GeminiImageService {
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
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, 'base64');

          fs.writeFileSync(filePath, buffer);
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`Image saved as ${filePath} (elapsed: ${duration}s)`);
          return filePath;
        }
      }

      throw new Error('Image data not found in response.');
    } catch (error) {
      console.error('Error generating image with @google/genai:', error);
      throw new Error('Failed to generate image using @google/genai. The model might not be available or the API has changed.');
    }
  }

  async generateImagesForEpisode(videoId: string, episodeNumber: number): Promise<void> {
    const videosDir = path.join(process.cwd(), 'videos');
    const lessonDir = path.join(videosDir, videoId, `lesson_${episodeNumber}`);
    const audioSegmentsPath = path.join(lessonDir, 'audio_segments.json');
    const lessonSegmentsDir = path.join(lessonDir, 'lesson_segments');
    const finalSynchronizedPath = path.join(lessonDir, 'final_synchronized_lesson.json');

    console.log(`🖼️ Generating images for video ${videoId}, episode ${episodeNumber}`);

    try {
      // Read audio segments file
      if (!fs.existsSync(audioSegmentsPath)) {
        console.error(`Audio segments file not found: ${audioSegmentsPath}`);
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
            console.log(`🖼️ Generating image for segment: ${segment.id}`);

            // Generate image using the background description
            const filePath = path.join(lessonSegmentsDir, `${segment.id}.png`);
            // Only generate the image if the file does not already exist
            if (!fs.existsSync(filePath)) {
              const imagePath = await this.generateImage(segment.backgroundImageDescription, filePath);
              console.log(`✅ Generated and saved image for segment ${segment.id}: ${imagePath}`);
            } else {
              console.log(`Image for segment ${segment.id} already exists at ${filePath}, skipping generation.`);
            }
          } catch (error) {
            console.error(`Failed to generate image for segment ${segment.id}:`, error);
          }
        }
      }

      // Update final_synchronized_lesson.json with background URLs
      if (fs.existsSync(finalSynchronizedPath)) {
        await this.updateSynchronizedLessonWithBackgrounds(finalSynchronizedPath, audioSegments, videoId, episodeNumber);
      }

      console.log(`🖼️ Completed image generation for video ${videoId}, episode ${episodeNumber}`);
    } catch (error) {
      console.error(`Failed to generate episode images for video ${videoId}, episode ${episodeNumber}:`, error);
      throw error;
    }
  }

  private async updateSynchronizedLessonWithBackgrounds(finalSynchronizedPath: string, audioSegments: any[], videoId: string, episodeNumber: number): Promise<void> {
    try {
      const synchronizedData = JSON.parse(fs.readFileSync(finalSynchronizedPath, 'utf8'));

      // Update each timing segment with background URL if available
      synchronizedData.lesson?.segmentBasedTiming?.forEach((timingSegment) => {
        // Find matching audio segment by text content or similar logic
        const matchingAudioSegment = audioSegments.find(
          (audioSeg) => audioSeg.text === timingSegment.text || audioSeg.id === this.extractSegmentIdFromAudioUrl(timingSegment.audioUrl),
        );

        if (matchingAudioSegment?.backgroundImageDescription) {
          // Determine image extension (assuming PNG for now, could be made dynamic)
          const imageExtension = '.png';
          timingSegment.backgroundUrl = `/videos/${videoId}/lesson_${episodeNumber}/lesson_segments/${matchingAudioSegment.id}${imageExtension}`;
        }
      });

      // Save the updated synchronized lesson
      fs.writeFileSync(finalSynchronizedPath, JSON.stringify(synchronizedData, null, 2));
      console.log(`✅ Updated final_synchronized_lesson.json with background URLs`);
    } catch (error) {
      console.error('Failed to update synchronized lesson with backgrounds:', error);
    }
  }

  private extractSegmentIdFromAudioUrl(audioUrl: string): string {
    // Extract segment ID from audio URL like "/video/lesson_1/lesson_segments/intro.wav"
    const regex = /\/([^/]+)\.wav$/;
    const matches = regex.exec(audioUrl);
    return matches ? matches[1] : '';
  }
}
